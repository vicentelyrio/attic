use std::path::Path;

use axum::{extract::State, http::StatusCode, response::Json};
use serde::{Deserialize, Serialize};

use crate::fs::{resolve_within_root, safe_name};
use crate::state::AppState;

#[derive(Deserialize)]
pub(super) struct NewItemReq {
    root: String,
    #[serde(default)]
    dir: String,
    name: String,
}

#[derive(Serialize)]
pub(super) struct Created {
    name: String,
}

#[derive(Deserialize)]
pub(super) struct DeleteReq {
    root: String,
    paths: Vec<String>,
}

#[derive(Serialize)]
pub(super) struct Deleted {
    count: usize,
}

fn unique_name(dir: &Path, base: &str) -> String {
    if !dir.join(base).exists() {
        return base.to_string();
    }
    let p = Path::new(base);
    let (stem, ext) = match (
        p.file_stem().and_then(|s| s.to_str()),
        p.extension().and_then(|s| s.to_str()),
    ) {
        (Some(stem), Some(ext)) => (stem.to_string(), Some(ext.to_string())),
        _ => (base.to_string(), None),
    };
    let mut n = 2;
    loop {
        let candidate = match &ext {
            Some(ext) => format!("{stem} {n}.{ext}"),
            None => format!("{stem} {n}"),
        };
        if !dir.join(&candidate).exists() {
            return candidate;
        }
        n += 1;
    }
}

/// A root may be a directory the server has no write access to (`/`, for one),
/// so a failed create is usually the filesystem talking, not a server fault.
fn io_status(path: &Path, err: &std::io::Error) -> StatusCode {
    tracing::error!("create '{}' failed: {}", path.display(), err);
    match err.kind() {
        std::io::ErrorKind::PermissionDenied => StatusCode::FORBIDDEN,
        std::io::ErrorKind::AlreadyExists => StatusCode::CONFLICT,
        _ => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

fn resolve_new(
    state: &AppState,
    req: &NewItemReq,
) -> Result<(std::path::PathBuf, String), StatusCode> {
    let name = safe_name(&req.name).ok_or(StatusCode::BAD_REQUEST)?;
    let dir = resolve_within_root(&state.roots, &req.root, &req.dir).ok_or(StatusCode::FORBIDDEN)?;
    if !dir.is_dir() {
        return Err(StatusCode::BAD_REQUEST);
    }
    let name = unique_name(&dir, name);
    Ok((dir, name))
}

pub(super) async fn mkdir(
    State(state): State<AppState>,
    Json(req): Json<NewItemReq>,
) -> Result<Json<Created>, StatusCode> {
    let (dir, name) = resolve_new(&state, &req)?;
    let path = dir.join(&name);
    tokio::fs::create_dir(&path)
        .await
        .map_err(|e| io_status(&path, &e))?;
    Ok(Json(Created { name }))
}

pub(super) async fn create_file(
    State(state): State<AppState>,
    Json(req): Json<NewItemReq>,
) -> Result<Json<Created>, StatusCode> {
    let (dir, name) = resolve_new(&state, &req)?;
    let path = dir.join(&name);
    tokio::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&path)
        .await
        .map_err(|e| io_status(&path, &e))?;
    Ok(Json(Created { name }))
}

// Every path is resolved and guarded before anything is trashed, so a single
// bad path fails the whole batch; a root directory can never be a target.
pub(super) async fn delete(
    State(state): State<AppState>,
    Json(req): Json<DeleteReq>,
) -> Result<Json<Deleted>, StatusCode> {
    let mut targets = Vec::with_capacity(req.paths.len());
    for p in &req.paths {
        let real = resolve_within_root(&state.roots, &req.root, p).ok_or(StatusCode::FORBIDDEN)?;
        if state.roots.values().any(|r| *r == real) {
            return Err(StatusCode::BAD_REQUEST);
        }
        targets.push(real);
    }

    let count = targets.len();
    tokio::task::spawn_blocking(move || trash::delete_all(&targets))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(Deleted { count }))
}
