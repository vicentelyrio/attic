mod download;
mod listing;
mod resolve;
mod roots;
mod search;
mod upload;

use axum::{
    routing::{get, post},
    Router,
};

use crate::state::AppState;

// Re-export so sibling handlers reach it as `crate::fs::resolve_within_root`.
pub(crate) use resolve::resolve_within_root;

/// All filesystem-facing routes, assembled here so main.rs stays pure wiring.
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/api/roots", get(roots::list_roots))
        .route("/api/list", get(listing::list_dir))
        .route("/api/search", get(search::search))
        .route("/api/download", get(download::download))
        .route("/api/upload", post(upload::upload))
}
