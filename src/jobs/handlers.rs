use std::path::Path as FsPath;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::Json;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::model::{Job, JobFile, Op, Policy, Resolution, Status, now};
use super::{plan, store};
use crate::auth::CurrentUser;
use crate::auth::model::User;
use crate::state::AppState;

type ApiError = (StatusCode, String);

fn forbidden(msg: &str) -> ApiError {
    (StatusCode::FORBIDDEN, msg.to_string())
}

fn bad_request(msg: &str) -> ApiError {
    (StatusCode::BAD_REQUEST, msg.to_string())
}

fn not_found() -> ApiError {
    (StatusCode::NOT_FOUND, "job not found".to_string())
}

fn internal(e: impl std::fmt::Display) -> ApiError {
    tracing::error!("jobs error: {e}");
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        "internal error".to_string(),
    )
}

fn can_access(job: &Job, user: &User) -> bool {
    user.role.is_admin() || job.user_id.as_deref() == Some(user.id.as_str())
}

async fn load_accessible_job(state: &AppState, id: &str, user: &User) -> Result<Job, ApiError> {
    let job = store::get_job(&state.pool, id)
        .await
        .map_err(internal)?
        .ok_or_else(not_found)?;
    if !can_access(&job, user) {
        return Err(not_found());
    }
    Ok(job)
}

fn unique_copy_name(dir: &FsPath, name: &str, is_dir: bool) -> String {
    let p = FsPath::new(name);
    let (stem, ext) = match (p.file_stem().and_then(|s| s.to_str()), p.extension()) {
        (Some(stem), Some(ext)) if !is_dir => (stem, ext.to_str()),
        _ => (name, None),
    };
    let with_suffix = |suffix: &str| match ext {
        Some(ext) => format!("{stem}{suffix}.{ext}"),
        None => format!("{stem}{suffix}"),
    };

    let first = with_suffix(" copy");
    if !dir.join(&first).exists() {
        return first;
    }
    let mut n = 2;
    loop {
        let candidate = with_suffix(&format!(" copy {n}"));
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
    #[serde(default)]
    dst_dir: String,
}

#[derive(Serialize)]
pub struct JobView {
    #[serde(flatten)]
    job: Job,
    files: Vec<JobFile>,
}

pub async fn paste(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
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

    let pastes_onto_itself = dst_dir.join(&base_name) == src;
    let dst_name = if pastes_onto_itself {
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
        user_id: Some(user.id),
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
    #[serde(default)]
    overrides: std::collections::HashMap<String, Resolution>,
}

pub async fn resolve(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Path(id): Path<String>,
    Json(req): Json<ResolveReq>,
) -> Result<Json<Job>, ApiError> {
    let job = load_accessible_job(&state, &id, &user).await?;

    if job.status != Status::NeedsResolution {
        return Err(bad_request("job is not awaiting resolution"));
    }

    let overrides: Vec<(String, Resolution)> = req.overrides.into_iter().collect();
    store::apply_resolution(&state.pool, &id, req.policy, &overrides)
        .await
        .map_err(internal)?;
    state.notify.notify_one();

    let updated = load_accessible_job(&state, &id, &user).await?;
    Ok(Json(updated))
}

pub async fn list(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
) -> Result<Json<Vec<Job>>, ApiError> {
    let jobs = if user.role.is_admin() {
        store::list_jobs(&state.pool, 50).await
    } else {
        store::list_jobs_for_user(&state.pool, &user.id, 50).await
    }
    .map_err(internal)?;
    Ok(Json(jobs))
}

pub async fn clear(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
) -> Result<StatusCode, ApiError> {
    if user.role.is_admin() {
        store::clear_finished(&state.pool).await
    } else {
        store::clear_finished_for_user(&state.pool, &user.id).await
    }
    .map_err(internal)?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn get(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Path(id): Path<String>,
) -> Result<Json<JobView>, ApiError> {
    let job = load_accessible_job(&state, &id, &user).await?;
    let files = store::get_job_files(&state.pool, &id)
        .await
        .map_err(internal)?;
    Ok(Json(JobView { job, files }))
}

pub async fn cancel(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Path(id): Path<String>,
) -> Result<Json<Job>, ApiError> {
    let job = load_accessible_job(&state, &id, &user).await?;

    if matches!(job.status, Status::Done | Status::Failed | Status::Canceled) {
        return Err(bad_request("job already finished"));
    }

    if let Some(flag) = state.cancels.lock().unwrap().get(&id) {
        flag.store(true, std::sync::atomic::Ordering::SeqCst);
    }
    store::set_status(&state.pool, &id, Status::Canceled)
        .await
        .map_err(internal)?;

    let updated = load_accessible_job(&state, &id, &user).await?;
    Ok(Json(updated))
}
