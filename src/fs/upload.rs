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

use crate::fs::{ensure_dir, internal, safe_name};
use crate::state::AppState;

#[derive(Deserialize)]
pub(super) struct UploadQuery {
    root: String,
    #[serde(default)]
    dir: String,
    #[serde(default)]
    rel: String,
    name: String,
}

#[derive(Serialize)]
pub(super) struct Uploaded {
    name: String,
    size: u64,
}

fn part_path(dst: &std::path::Path) -> PathBuf {
    let mut s: OsString = dst.as_os_str().to_owned();
    s.push(".part");
    PathBuf::from(s)
}

// Streams into a fsync'd `.part` sidecar renamed into place, so the final file
// never appears half-written and a dropped connection leaves nothing behind.
pub(super) async fn upload(
    State(state): State<AppState>,
    Query(q): Query<UploadQuery>,
    body: Body,
) -> Result<Json<Uploaded>, StatusCode> {
    let name = safe_name(&q.name).ok_or(StatusCode::BAD_REQUEST)?;
    let dir = ensure_dir(&state, &q.root, &q.dir, &q.rel).await?;

    let dest = dir.join(name);
    let part = part_path(&dest);

    let mut file = tokio::fs::File::create(&part)
        .await
        .map_err(|e| internal(&format!("create '{}'", part.display()), e))?;

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
        written += chunk.len() as u64;
        if written > state.max_upload_bytes {
            let _ = tokio::fs::remove_file(&part).await;
            return Err(StatusCode::PAYLOAD_TOO_LARGE);
        }
        if let Err(e) = file.write_all(&chunk).await {
            let _ = tokio::fs::remove_file(&part).await;
            return Err(internal(&format!("write '{}'", part.display()), e));
        }
    }

    if let Err(e) = file.sync_all().await {
        let _ = tokio::fs::remove_file(&part).await;
        return Err(internal(&format!("sync '{}'", part.display()), e));
    }
    drop(file);

    tokio::fs::rename(&part, &dest)
        .await
        .map_err(|e| internal(&format!("rename '{}' into place", part.display()), e))?;

    Ok(Json(Uploaded {
        name: name.to_string(),
        size: written,
    }))
}
