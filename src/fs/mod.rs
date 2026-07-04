mod download;
mod listing;
mod mutate;
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

/// Accept a filename only if it's a single, ordinary path component — so a
/// client can't escape a resolved directory through the name itself. Shared by
/// every route that turns a user-supplied name into a path (upload, mkdir, …).
pub(crate) fn safe_name(name: &str) -> Option<&str> {
    let name = name.trim();
    if name.is_empty() || name == "." || name == ".." {
        return None;
    }
    if name.contains('/') || name.contains('\\') || name.contains('\0') {
        return None;
    }
    Some(name)
}

/// All filesystem-facing routes, assembled here so main.rs stays pure wiring.
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/api/roots", get(roots::list_roots))
        .route("/api/list", get(listing::list_dir))
        .route("/api/search", get(search::search))
        .route("/api/download", get(download::download))
        .route("/api/upload", post(upload::upload))
        .route("/api/mkdir", post(mutate::mkdir))
        .route("/api/file", post(mutate::create_file))
        .route("/api/delete", post(mutate::delete))
}
