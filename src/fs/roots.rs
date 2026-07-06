use axum::{extract::State, response::Json};
use nix::sys::statvfs::statvfs;
use serde::Serialize;

use crate::state::AppState;

#[derive(Serialize)]
pub(super) struct Root {
    name: String,
    total: u64,
    used: u64,
    available: u64,
}

pub(super) async fn list_roots(State(state): State<AppState>) -> Json<Vec<Root>> {
    let mut roots: Vec<Root> = state
        .roots
        .iter()
        .map(|(name, path)| {
            let (total, used, available) = match statvfs(path.as_path()) {
                Ok(s) => {
                    let unit = s.fragment_size();
                    let total = u64::from(s.blocks()) * unit;
                    let available = u64::from(s.blocks_available()) * unit;
                    (total, total.saturating_sub(available), available)
                }
                Err(_) => (0, 0, 0),
            };
            Root { name: name.clone(), total, used, available }
        })
        .collect();
    roots.sort_by(|a, b| a.name.cmp(&b.name));
    Json(roots)
}
