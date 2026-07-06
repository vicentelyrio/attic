use std::fmt;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::time::Duration;

use super::model::{Job, JobFile, Op, Policy, Resolution, Status};
use super::{copy, plan, store};
use crate::state::AppState;

// One job at a time: large transfers are disk-bound, so serial is deliberate.
pub async fn run(state: AppState) {
    match store::requeue_running(&state.pool).await {
        Ok(n) if n > 0 => tracing::info!("requeued {n} interrupted job(s)"),
        Ok(_) => {}
        Err(e) => tracing::error!("startup reconcile failed: {e}"),
    }

    loop {
        match store::next_queued(&state.pool).await {
            Ok(Some(job)) => run_job(&state, job).await,
            Ok(None) => state.notify.notified().await,
            Err(e) => {
                tracing::error!("worker poll error: {e}");
                tokio::time::sleep(Duration::from_secs(1)).await;
            }
        }
    }
}

enum Outcome {
    Done,
    Canceled,
    NeedsResolution,
}

#[derive(Debug)]
enum JobError {
    Io(io::Error),
    Db(sqlx::Error),
    Path(String),
}

impl fmt::Display for JobError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            JobError::Io(e) => write!(f, "io: {e}"),
            JobError::Db(e) => write!(f, "db: {e}"),
            JobError::Path(m) => write!(f, "path: {m}"),
        }
    }
}

impl From<io::Error> for JobError {
    fn from(e: io::Error) -> Self {
        JobError::Io(e)
    }
}

impl From<sqlx::Error> for JobError {
    fn from(e: sqlx::Error) -> Self {
        JobError::Db(e)
    }
}

async fn run_job(state: &AppState, job: Job) {
    if let Err(e) = store::set_status(&state.pool, &job.id, Status::Running).await {
        tracing::error!("could not mark job running: {e}");
        return;
    }

    let cancel = Arc::new(AtomicBool::new(false));
    state
        .cancels
        .lock()
        .unwrap()
        .insert(job.id.clone(), cancel.clone());

    let result = process(state, &job, &cancel).await;

    state.cancels.lock().unwrap().remove(&job.id);

    let final_status = match &result {
        Ok(Outcome::Done) => Status::Done,
        Ok(Outcome::Canceled) => Status::Canceled,
        Ok(Outcome::NeedsResolution) => Status::NeedsResolution,
        Err(e) => {
            tracing::error!("job {} failed: {e}", job.id);
            if let Err(e2) = store::set_failed(&state.pool, &job.id, &e.to_string()).await {
                tracing::error!("could not record failure: {e2}");
            }
            return;
        }
    };

    if let Err(e) = store::set_status(&state.pool, &job.id, final_status).await {
        tracing::error!("could not set final status: {e}");
    }
}

async fn process(
    state: &AppState,
    job: &Job,
    cancel: &Arc<AtomicBool>,
) -> Result<Outcome, JobError> {
    let src_top = crate::fs::resolve_within_root(&state.roots, &job.src_root, &job.src_path)
        .ok_or_else(|| JobError::Path("source no longer resolvable".into()))?;
    let dst_dir = crate::fs::resolve_within_root(&state.roots, &job.dst_root, &job.dst_dir)
        .ok_or_else(|| JobError::Path("destination no longer resolvable".into()))?;
    let src_parent = src_top
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from("/"));
    let src_base = src_top
        .file_name()
        .and_then(|s| s.to_str())
        .ok_or_else(|| JobError::Path("source has no name".into()))?;
    let dst_base = job.dst_name.as_deref().unwrap_or(src_base);
    let target = dst_dir.join(dst_base);

    let files = store::get_job_files(&state.pool, &job.id).await?;

    let untouched_move = job.op == Op::Move && files.iter().all(|f| !f.conflict && !f.done);
    if untouched_move {
        match rename_whole_tree(&src_top, &target) {
            Ok(()) => {
                for f in &files {
                    store::mark_file_done(&state.pool, &job.id, &f.rel_path).await?;
                }
                store::update_progress(&state.pool, &job.id, job.bytes_total, None).await?;
                return Ok(Outcome::Done);
            }
            Err(RenameError::CrossesFilesystems) => {}
            Err(RenameError::Io(e)) => return Err(e.into()),
        }
    }

    let already_copied: u64 = files.iter().map(|f| f.bytes_done.max(0) as u64).sum();
    let counter = Arc::new(AtomicU64::new(already_copied));

    for f in &files {
        if f.done {
            continue;
        }
        if cancel.load(Ordering::SeqCst) {
            return Ok(Outcome::Canceled);
        }

        let source = src_parent.join(&f.rel_path);
        let dest = dst_dir.join(plan::replace_top(&f.rel_path, src_base, dst_base));

        let unplanned_collision = !f.conflict && dest.exists();
        if unplanned_collision {
            store::flag_conflict(&state.pool, &job.id, &f.rel_path).await?;
            return Ok(Outcome::NeedsResolution);
        }

        if f.conflict {
            match effective_resolution(f, job.policy) {
                Some(Resolution::Skip) => {
                    let remaining = (f.size - f.bytes_done).max(0) as u64;
                    counter.fetch_add(remaining, Ordering::Relaxed);
                    store::mark_file_done(&state.pool, &job.id, &f.rel_path).await?;
                    continue;
                }
                Some(Resolution::Overwrite) => {}
                None => return Ok(Outcome::NeedsResolution),
            }
        }

        let completed = copy_with_progress(state, job, f, &source, &dest, &counter, cancel).await?;
        if !completed {
            let _ = fs::remove_file(copy::part_path(&dest));
            return Ok(Outcome::Canceled);
        }
        store::mark_file_done(&state.pool, &job.id, &f.rel_path).await?;

        if job.op == Op::Move {
            let _ = fs::remove_file(&source);
        }
    }

    store::update_progress(&state.pool, &job.id, job.bytes_total, None).await?;

    if job.op == Op::Move && src_top.is_dir() {
        remove_empty_dirs(&src_top);
    }

    Ok(Outcome::Done)
}

enum RenameError {
    CrossesFilesystems,
    Io(io::Error),
}

fn rename_whole_tree(src: &Path, target: &Path) -> Result<(), RenameError> {
    match fs::rename(src, target) {
        Ok(()) => Ok(()),
        Err(e) if e.raw_os_error() == Some(copy::EXDEV) => Err(RenameError::CrossesFilesystems),
        Err(e) => Err(RenameError::Io(e)),
    }
}

fn effective_resolution(f: &JobFile, policy: Option<Policy>) -> Option<Resolution> {
    f.resolution.or_else(|| policy.map(Policy::resolution))
}

async fn copy_with_progress(
    state: &AppState,
    job: &Job,
    f: &JobFile,
    source: &Path,
    dest: &Path,
    counter: &Arc<AtomicU64>,
    cancel: &Arc<AtomicBool>,
) -> Result<bool, JobError> {
    let start_offset = f.bytes_done.max(0) as u64;
    let counter_at_start = counter.load(Ordering::Relaxed);

    let progress_ticker = {
        let pool = state.pool.clone();
        let id = job.id.clone();
        let rel = f.rel_path.clone();
        let counter = counter.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_millis(500));
            interval.tick().await;
            loop {
                interval.tick().await;
                let copied = counter.load(Ordering::Relaxed);
                let per_file = start_offset + copied.saturating_sub(counter_at_start);
                let _ = store::update_progress(&pool, &id, copied as i64, Some(&rel)).await;
                let _ = store::set_file_progress(&pool, &id, &rel, per_file as i64).await;
            }
        })
    };

    let copy_result = {
        let source = source.to_path_buf();
        let dest = dest.to_path_buf();
        let counter = counter.clone();
        let cancel = cancel.clone();
        tokio::task::spawn_blocking(move || {
            copy::copy_file_resumable(&source, &dest, start_offset, &counter, &cancel)
        })
        .await
    };

    progress_ticker.abort();

    let completed = copy_result.map_err(|e| JobError::Io(io::Error::other(e)))??;

    let copied = counter.load(Ordering::Relaxed);
    let _ = store::update_progress(&state.pool, &job.id, copied as i64, Some(&f.rel_path)).await;
    Ok(completed)
}

fn remove_empty_dirs(dir: &Path) {
    if let Ok(rd) = fs::read_dir(dir) {
        for entry in rd.filter_map(Result::ok) {
            let p = entry.path();
            if p.is_dir() {
                remove_empty_dirs(&p);
            }
        }
    }
    let _ = fs::remove_dir(dir);
}
