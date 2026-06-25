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
}

pub(super) async fn list_dir(
    State(state): State<AppState>,
    Query(q): Query<ListQuery>,
) -> Result<Json<Vec<Entry>>, StatusCode> {
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
        entries.push(Entry {
            name: item.file_name().to_string_lossy().into_owned(),
            is_dir: meta.is_dir(),
            size: meta.len(),
        });
    }

    entries.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(Json(entries))
}
