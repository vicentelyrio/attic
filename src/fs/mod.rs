mod download;
mod listing;
mod mutate;
mod resolve;
mod roots;
mod search;
mod upload;

use std::path::PathBuf;

use axum::{
    Router,
    http::StatusCode,
    routing::{get, post},
};

use crate::state::AppState;

pub(crate) use resolve::resolve_within_root;

/// Turns an unexpected failure into a 500, logging the cause first — a bare
/// 500 in the log is impossible to diagnose from a running deployment.
pub(crate) fn internal(ctx: &str, e: impl std::fmt::Display) -> axum::http::StatusCode {
    tracing::error!("{ctx}: {e}");
    axum::http::StatusCode::INTERNAL_SERVER_ERROR
}

/// Accepts a filename only if it's a single, ordinary path component, so a
/// client can't escape a resolved directory through the name itself.
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

fn rel_components(rel: &str) -> Option<Vec<&str>> {
    rel.split('/')
        .filter(|s| !s.trim().is_empty())
        .map(safe_name)
        .collect()
}

/// Descends one level at a time because an existing component may be a symlink
/// out of the root, which has to be caught before anything is created through it.
pub(crate) async fn ensure_dir(
    state: &AppState,
    root_name: &str,
    dir: &str,
    rel: &str,
) -> Result<PathBuf, StatusCode> {
    let base = resolve_within_root(&state.roots, root_name, dir)?;
    if !base.is_dir() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let parts = rel_components(rel).ok_or(StatusCode::BAD_REQUEST)?;
    let root = state.roots.get(root_name).ok_or(StatusCode::FORBIDDEN)?;

    let mut dir = base;
    for part in parts {
        let next = dir.join(part);
        if !next.exists()
            && let Err(e) = tokio::fs::create_dir(&next).await
            && e.kind() != std::io::ErrorKind::AlreadyExists
        {
            return Err(internal(&format!("create '{}'", next.display()), e));
        }
        dir = tokio::fs::canonicalize(&next)
            .await
            .map_err(|_| StatusCode::BAD_REQUEST)?;
        if !dir.starts_with(root) || !dir.is_dir() {
            return Err(StatusCode::FORBIDDEN);
        }
    }

    Ok(dir)
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/api/roots", get(roots::list_roots))
        .route("/api/list", get(listing::list_dir))
        .route("/api/search", get(search::search))
        .route("/api/download", get(download::download))
        .route("/api/upload", post(upload::upload))
        .route("/api/mkdir", post(mutate::mkdir))
        .route("/api/mkdirp", post(mutate::mkdir_path))
        .route("/api/file", post(mutate::create_file))
        .route("/api/rename", post(mutate::rename))
        .route("/api/delete", post(mutate::delete))
}

#[cfg(test)]
mod tests {
    use super::rel_components;

    #[test]
    fn accepts_nested_folders() {
        assert_eq!(rel_components("a/b/c"), Some(vec!["a", "b", "c"]));
    }

    #[test]
    fn ignores_empty_segments() {
        assert_eq!(rel_components(""), Some(vec![]));
        assert_eq!(rel_components("/a//b/"), Some(vec!["a", "b"]));
    }

    #[test]
    fn rejects_traversal() {
        assert_eq!(rel_components("a/../../etc"), None);
        assert_eq!(rel_components(".."), None);
    }
}
