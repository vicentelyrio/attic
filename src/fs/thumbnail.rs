use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

use axum::{
    body::Body,
    extract::{Query, Request, State},
    http::{HeaderValue, StatusCode, header},
    response::{IntoResponse, Response},
};
use image::ImageReader;
use image::codecs::jpeg::JpegEncoder;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use tower::ServiceExt;
use tower_http::services::ServeFile;

use crate::fs::{internal, resolve_within_root};
use crate::state::AppState;

const TARGET_LONG_EDGE: u32 = 480;
const JPEG_QUALITY: u8 = 82;
// Above this, a card thumbnail isn't worth decoding a full-res original for;
// the browser falls back to the file-type placeholder instead.
const MAX_SOURCE_BYTES: u64 = 100 * 1024 * 1024;
// Decoded memory scales with megapixels, not file size — a small but
// highly-compressed file can still decode to a huge pixel buffer. 100MP
// covers real photos (a 45MP mirrorless frame is ~45MP) with headroom while
// still bounding worst-case memory per concurrent decode.
const MAX_SOURCE_PIXELS: u64 = 100_000_000;

#[derive(Deserialize)]
pub(super) struct ThumbnailQuery {
    root: String,
    #[serde(default)]
    path: String,
}

pub(super) async fn thumbnail(
    State(state): State<AppState>,
    Query(q): Query<ThumbnailQuery>,
    req: Request<Body>,
) -> Result<Response, StatusCode> {
    let thumbs_dir = state
        .thumbs_dir
        .as_ref()
        .ok_or(StatusCode::SERVICE_UNAVAILABLE)?;
    let path = resolve_within_root(&state.roots, &q.root, &q.path)?;

    let meta = tokio::fs::metadata(&path)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;
    if meta.is_dir() {
        return Err(StatusCode::BAD_REQUEST);
    }
    if meta.len() > MAX_SOURCE_BYTES {
        return Err(StatusCode::PAYLOAD_TOO_LARGE);
    }

    let mtime = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let cached = cache_path(thumbs_dir, &q.root, &q.path, mtime, TARGET_LONG_EDGE);

    if tokio::fs::metadata(&cached).await.is_err() {
        let _permit = state
            .thumbnail_semaphore
            .acquire()
            .await
            .map_err(|e| internal("acquire thumbnail semaphore", e))?;

        // A concurrent request for the same file may have generated it while
        // this one waited on the permit.
        if tokio::fs::metadata(&cached).await.is_err() {
            let src = path.clone();
            let dst = cached.clone();
            tokio::task::spawn_blocking(move || generate(&src, &dst, TARGET_LONG_EDGE))
                .await
                .map_err(|e| internal("thumbnail generation task", e))?
                .map_err(|e| match e {
                    GenerateError::Image(err) => {
                        tracing::warn!("thumbnail decode failed for '{}': {err}", path.display());
                        StatusCode::UNSUPPORTED_MEDIA_TYPE
                    }
                    GenerateError::TooManyPixels => StatusCode::PAYLOAD_TOO_LARGE,
                    GenerateError::Io(e) => {
                        internal(&format!("generate thumbnail for '{}'", path.display()), e)
                    }
                })?;
        }
    }

    let mut response = ServeFile::new(&cached)
        .oneshot(req)
        .await
        .map_err(|e| internal(&format!("serve thumbnail '{}'", cached.display()), e))?
        .into_response();

    // Content-addressed by mtime, but the request URL isn't (it's root+path),
    // so a long-lived `immutable` header would let the browser's own HTTP
    // cache outlive a file edit. A moderate max-age still avoids re-fetching
    // on every scroll within a session without risking a stale-looking edit.
    response.headers_mut().insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("public, max-age=86400"),
    );

    Ok(response)
}

/// Content-addressed by source identity, mtime, and target size: a modified
/// or replaced file naturally misses cache and regenerates under a new name,
/// so nothing needs explicit invalidation. Sharded by hash prefix to avoid
/// dumping tens of thousands of files in one directory.
fn cache_path(thumbs_dir: &Path, root: &str, rel: &str, mtime: u64, target: u32) -> PathBuf {
    let mut hasher = Sha256::new();
    hasher.update(root.as_bytes());
    hasher.update([0u8]);
    hasher.update(rel.as_bytes());
    let hash = hex::encode(hasher.finalize());
    thumbs_dir
        .join(&hash[..2])
        .join(format!("{hash}-{mtime}-{target}.jpg"))
}

fn part_path(dst: &Path) -> PathBuf {
    let mut s = dst.as_os_str().to_owned();
    s.push(".part");
    PathBuf::from(s)
}

#[derive(Debug)]
enum GenerateError {
    Image(image::ImageError),
    TooManyPixels,
    Io(std::io::Error),
}

impl From<image::ImageError> for GenerateError {
    fn from(e: image::ImageError) -> Self {
        GenerateError::Image(e)
    }
}

impl From<std::io::Error> for GenerateError {
    fn from(e: std::io::Error) -> Self {
        GenerateError::Io(e)
    }
}

/// Decodes, resizes and JPEG-encodes into a `.part` sidecar, then renames into
/// place — `dst` never exists half-written, so a concurrent reader never sees
/// a truncated cache file.
fn generate(src: &Path, dst: &Path, target: u32) -> Result<(), GenerateError> {
    // Cheap header-only read to reject huge pixel counts before the actual
    // decode allocates a full-resolution buffer for them.
    let (w, h) = ImageReader::open(src)?
        .with_guessed_format()?
        .into_dimensions()?;
    if (w as u64) * (h as u64) > MAX_SOURCE_PIXELS {
        return Err(GenerateError::TooManyPixels);
    }

    let img = ImageReader::open(src)?.with_guessed_format()?.decode()?;
    let resized = img.resize(target, target, image::imageops::FilterType::Triangle);
    let rgb = resized.to_rgb8();

    if let Some(parent) = dst.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let part = part_path(dst);
    {
        let mut file = std::fs::File::create(&part)?;
        JpegEncoder::new_with_quality(&mut file, JPEG_QUALITY).encode_image(&rgb)?;
        file.sync_all()?;
    }
    std::fs::rename(&part, dst)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cache_path_changes_with_mtime_and_target() {
        let dir = PathBuf::from("/thumbs");
        let a = cache_path(&dir, "root", "a/b.jpg", 100, 480);
        let b = cache_path(&dir, "root", "a/b.jpg", 200, 480);
        let c = cache_path(&dir, "root", "a/b.jpg", 100, 320);
        let same = cache_path(&dir, "root", "a/b.jpg", 100, 480);

        assert_eq!(a, same);
        assert_ne!(a, b);
        assert_ne!(a, c);
    }

    #[test]
    fn cache_path_changes_with_source_identity() {
        let dir = PathBuf::from("/thumbs");
        let a = cache_path(&dir, "root", "a/b.jpg", 100, 480);
        let b = cache_path(&dir, "other-root", "a/b.jpg", 100, 480);
        let c = cache_path(&dir, "root", "a/c.jpg", 100, 480);

        assert_ne!(a, b);
        assert_ne!(a, c);
    }

    #[test]
    fn cache_path_is_sharded_by_hash_prefix() {
        let dir = PathBuf::from("/thumbs");
        let p = cache_path(&dir, "root", "a/b.jpg", 100, 480);
        let shard = p.parent().unwrap().file_name().unwrap().to_str().unwrap();
        assert_eq!(shard.len(), 2);
    }

    #[test]
    fn round_trips_a_generated_thumbnail() {
        let dir = std::env::temp_dir().join(format!("attic-thumb-test-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();

        let src = dir.join("src.png");
        image::RgbImage::from_pixel(800, 600, image::Rgb([200, 100, 50]))
            .save(&src)
            .unwrap();

        let dst = dir.join("out.jpg");
        generate(&src, &dst, 400).unwrap();

        let decoded = image::open(&dst).unwrap();
        assert_eq!(decoded.width().max(decoded.height()), 400);
        assert!(!part_path(&dst).exists());

        std::fs::remove_dir_all(&dir).ok();
    }
}
