use std::path::Path as FsPath;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::Json;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::model::{Job, JobFile, Op, Policy, Resolution, Status, now};
use super::{plan, store};
use crate::state::AppState;

type ApiError = (StatusCode, String);

fn forbidden(msg: &str) -> ApiError {
    (StatusCode::FORBIDDEN, msg.to_string())
}

fn bad_request(msg: &str) -> ApiError {
    (StatusCode::BAD_REQUEST, msg.to_string())
}

fn internal(e: impl std::fmt::Display) -> ApiError {
    (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
}

/// Finder-style unique name for duplicating `name` inside `dir`:
/// "report.pdf" → "report copy.pdf" → "report copy 2.pdf" … picking the first
/// that doesn't already exist. Directories (and extension-less names) get the
/// suffix appended whole.
fn unique_copy_name(dir: &FsPath, name: &str, is_dir: bool) -> String {
    let p = FsPath::new(name);
    let (stem, ext) = match (p.file_stem().and_then(|s| s.to_str()), p.extension()) {
        (Some(stem), Some(ext)) if !is_dir => (stem, ext.to_str()),
        _ => (name, None),
    };
    let build = |suffix: &str| match ext {
        Some(ext) => format!("{stem}{suffix}.{ext}"),
        None => format!("{stem}{suffix}"),
    };

    let first = build(" copy");
    if !dir.join(&first).exists() {
        return first;
    }
    let mut n = 2;
    loop {
        let candidate = build(&format!(" copy {n}"));
        if !dir.join(&candidate).exists() {
            return candidate;
        }
        n += 1;
    }
}

#[derive(Deserialize)]
pub struct PasteReq {
    op: Op,
    src_root: String,
    src_path: String,
    dst_root: String,
    /// Relative path (within `dst_root`) of the directory to paste into.
    #[serde(default)]
    dst_dir: String,
}

#[derive(Serialize)]
pub struct JobView {
    #[serde(flatten)]
    job: Job,
    files: Vec<JobFile>,
}

/// Plan a paste: resolve + guard the paths, build the manifest, detect
/// collisions, and persist the job. Returns the job with its file list so the
/// UI can show a conflict dialog when `status == needs_resolution`.
pub async fn paste(
    State(state): State<AppState>,
    Json(req): Json<PasteReq>,
) -> Result<Json<JobView>, ApiError> {
    let src = crate::fs::resolve_within_root(&state.roots, &req.src_root, &req.src_path)
        .ok_or_else(|| forbidden("source not found or outside root"))?;
    let dst_dir = crate::fs::resolve_within_root(&state.roots, &req.dst_root, &req.dst_dir)
        .ok_or_else(|| forbidden("destination not found or outside root"))?;

    if !dst_dir.is_dir() {
        return Err(bad_request("destination is not a directory"));
    }

    let base_name = src
        .file_name()
        .and_then(|s| s.to_str())
        .map(String::from)
        .ok_or_else(|| bad_request("source has no name"))?;

    if src.is_dir() && dst_dir.starts_with(&src) {
        return Err(bad_request("cannot paste a folder into itself"));
    }

    // Pasting onto itself: a copy duplicates as "name copy.ext" (Finder-style);
    // a move onto itself is a no-op we reject. `dst_name` is `None` whenever the
    // destination keeps the source's own name.
    let dst_name = if dst_dir.join(&base_name) == src {
        match req.op {
            Op::Copy => Some(unique_copy_name(&dst_dir, &base_name, src.is_dir())),
            Op::Move => return Err(bad_request("source and destination are the same")),
        }
    } else {
        None
    };
    let dst_base = dst_name.clone().unwrap_or_else(|| base_name.clone());

    let manifest = {
        let (src, dst_dir, src_base, dst_base) =
            (src.clone(), dst_dir.clone(), base_name.clone(), dst_base.clone());
        tokio::task::spawn_blocking(move || plan::build(&src, &dst_dir, &src_base, &dst_base))
            .await
            .map_err(internal)?
            .map_err(internal)?
    };

    let status = if manifest.has_conflicts() {
        Status::NeedsResolution
    } else {
        Status::Queued
    };

    let ts = now();
    let job = Job {
        id: Uuid::new_v4().to_string(),
        op: req.op,
        src_root: req.src_root,
        src_path: req.src_path,
        dst_root: req.dst_root,
        dst_dir: req.dst_dir,
        dst_name,
        status,
        policy: None,
        bytes_total: manifest.bytes_total,
        bytes_done: 0,
        current_file: None,
        error: None,
        created_at: ts,
        updated_at: ts,
    };

    let files: Vec<JobFile> = manifest
        .files
        .iter()
        .map(|f| JobFile {
            rel_path: f.rel_path.clone(),
            size: f.size,
            bytes_done: 0,
            conflict: f.conflict,
            resolution: None,
            done: false,
        })
        .collect();

    store::create_job(&state.pool, &job, &files)
        .await
        .map_err(internal)?;

    if status == Status::Queued {
        state.notify.notify_one();
    }

    Ok(Json(JobView { job, files }))
}

#[derive(Deserialize)]
pub struct ResolveReq {
    policy: Option<Policy>,
    /// Per-file overrides keyed by `rel_path`.
    #[serde(default)]
    overrides: std::collections::HashMap<String, Resolution>,
}

/// Apply a collision decision to a job awaiting resolution, then requeue it.
pub async fn resolve(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(req): Json<ResolveReq>,
) -> Result<Json<Job>, ApiError> {
    let job = store::get_job(&state.pool, &id)
        .await
        .map_err(internal)?
        .ok_or((StatusCode::NOT_FOUND, "job not found".to_string()))?;

    if job.status != Status::NeedsResolution {
        return Err(bad_request("job is not awaiting resolution"));
    }

    let overrides: Vec<(String, Resolution)> = req.overrides.into_iter().collect();
    store::apply_resolution(&state.pool, &id, req.policy, &overrides)
        .await
        .map_err(internal)?;
    state.notify.notify_one();

    let updated = store::get_job(&state.pool, &id)
        .await
        .map_err(internal)?
        .ok_or((StatusCode::NOT_FOUND, "job not found".to_string()))?;
    Ok(Json(updated))
}

/// List active + recent jobs for the transfers panel.
pub async fn list(State(state): State<AppState>) -> Result<Json<Vec<Job>>, ApiError> {
    let jobs = store::list_jobs(&state.pool, 50).await.map_err(internal)?;
    Ok(Json(jobs))
}

pub async fn clear(State(state): State<AppState>) -> Result<StatusCode, ApiError> {
    store::clear_finished(&state.pool).await.map_err(internal)?;
    Ok(StatusCode::NO_CONTENT)
}

/// A single job with its file manifest.
pub async fn get(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<JobView>, ApiError> {
    let job = store::get_job(&state.pool, &id)
        .await
        .map_err(internal)?
        .ok_or((StatusCode::NOT_FOUND, "job not found".to_string()))?;
    let files = store::get_job_files(&state.pool, &id)
        .await
        .map_err(internal)?;
    Ok(Json(JobView { job, files }))
}

/// Request cancellation: flip the DB status and trip the in-memory flag the
/// worker polls mid-copy.
pub async fn cancel(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Job>, ApiError> {
    let job = store::get_job(&state.pool, &id)
        .await
        .map_err(internal)?
        .ok_or((StatusCode::NOT_FOUND, "job not found".to_string()))?;

    if matches!(job.status, Status::Done | Status::Failed | Status::Canceled) {
        return Err(bad_request("job already finished"));
    }

    if let Some(flag) = state.cancels.lock().unwrap().get(&id) {
        flag.store(true, std::sync::atomic::Ordering::SeqCst);
    }
    store::set_status(&state.pool, &id, Status::Canceled)
        .await
        .map_err(internal)?;

    let updated = store::get_job(&state.pool, &id)
        .await
        .map_err(internal)?
        .ok_or((StatusCode::NOT_FOUND, "job not found".to_string()))?;
    Ok(Json(updated))
}
