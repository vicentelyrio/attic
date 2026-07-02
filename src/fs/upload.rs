use std::ffi::OsString;
use std::path::PathBuf;

use axum::{
    body::Body,
    extract::{Query, State},
    http::StatusCode,
    response::Json,
};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tokio::io::AsyncWriteExt;

use crate::fs::resolve_within_root;
use crate::state::AppState;

#[derive(Deserialize)]
pub(super) struct UploadQuery {
    root: String,
    /// Relative path (within `root`) of the directory to upload into.
    #[serde(default)]
    dir: String,
    name: String,
}

#[derive(Serialize)]
pub(super) struct Uploaded {
    name: String,
    size: u64,
}

/// Accept a filename only if it's a single, ordinary path component — so a
/// client can't escape the resolved directory through the name itself.
fn safe_name(name: &str) -> Option<&str> {
    let name = name.trim();
    if name.is_empty() || name == "." || name == ".." {
        return None;
    }
    if name.contains('/') || name.contains('\\') || name.contains('\0') {
        return None;
    }
    Some(name)
}

fn part_path(dst: &std::path::Path) -> PathBuf {
    let mut s: OsString = dst.as_os_str().to_owned();
    s.push(".part");
    PathBuf::from(s)
}

/// Stream a single file's bytes into the destination directory.
///
/// Bytes land in a `.part` sidecar that is `fsync`'d and atomically renamed into
/// place, so the final file never appears half-written and a dropped connection
/// leaves no partial file behind. The destination directory is guarded by the
/// same root boundary as every other filesystem route; the raw request body is
/// streamed to disk rather than buffered, so large files don't sit in memory.
pub(super) async fn upload(
    State(state): State<AppState>,
    Query(q): Query<UploadQuery>,
    body: Body,
) -> Result<Json<Uploaded>, StatusCode> {
    let name = safe_name(&q.name).ok_or(StatusCode::BAD_REQUEST)?;
    let dir = resolve_within_root(&state.roots, &q.root, &q.dir).ok_or(StatusCode::FORBIDDEN)?;
    if !dir.is_dir() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let dest = dir.join(name);
    let part = part_path(&dest);

    let mut file = tokio::fs::File::create(&part)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut written: u64 = 0;
    let mut stream = body.into_data_stream();
    while let Some(chunk) = stream.next().await {
        let chunk = match chunk {
            Ok(c) => c,
            Err(_) => {
                let _ = tokio::fs::remove_file(&part).await;
                return Err(StatusCode::BAD_REQUEST);
            }
        };
        if file.write_all(&chunk).await.is_err() {
            let _ = tokio::fs::remove_file(&part).await;
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
        written += chunk.len() as u64;
    }

    if file.sync_all().await.is_err() {
        let _ = tokio::fs::remove_file(&part).await;
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }
    drop(file);

    tokio::fs::rename(&part, &dest).await.map_err(|_| {
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(Uploaded { name: name.to_string(), size: written }))
}
