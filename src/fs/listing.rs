use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};

use crate::fs::resolve_within_root;
use crate::state::AppState;

#[derive(Deserialize)]
pub(super) struct ListQuery {
    root: String,
    #[serde(default)]
    path: String,
}

#[derive(Serialize)]
pub(super) struct Entry {
    name: String,
    is_dir: bool,
    size: u64,
    items: Option<u64>,
    modified: Option<i64>,
    created: Option<i64>,
}

#[derive(Serialize)]
pub(super) struct Listing {
    writable: bool,
    entries: Vec<Entry>,
}

fn is_writable(dir: &Path) -> bool {
    nix::unistd::access(dir, nix::unistd::AccessFlags::W_OK).is_ok()
}

fn to_epoch(t: std::io::Result<SystemTime>) -> Option<i64> {
    t.ok()
        .and_then(|st| st.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
}

async fn count_children(path: &Path) -> Option<u64> {
    let mut rd = tokio::fs::read_dir(path).await.ok()?;
    let mut n = 0u64;
    while let Ok(Some(_)) = rd.next_entry().await {
        n += 1;
    }
    Some(n)
}

pub(super) async fn list_dir(
    State(state): State<AppState>,
    Query(q): Query<ListQuery>,
) -> Result<Json<Listing>, StatusCode> {
    let dir = resolve_within_root(&state.roots, &q.root, &q.path).ok_or(StatusCode::FORBIDDEN)?;
    let mut read_dir = tokio::fs::read_dir(&dir).await.map_err(|_| StatusCode::NOT_FOUND)?;

    let mut entries = Vec::new();
    while let Some(item) = read_dir
        .next_entry()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    {
        let meta = match item.metadata().await {
            Ok(m) => m,
            Err(_) => continue,
        };
        let is_dir = meta.is_dir();
        let items = if is_dir { count_children(&item.path()).await } else { None };

        entries.push(Entry {
            name: item.file_name().to_string_lossy().into_owned(),
            is_dir,
            size: if is_dir { 0 } else { meta.len() },
            items,
            modified: to_epoch(meta.modified()),
            created: to_epoch(meta.created()),
        });
    }

    entries.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(Json(Listing { writable: is_writable(&dir), entries }))
}
