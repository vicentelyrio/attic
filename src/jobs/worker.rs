use std::fmt;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::time::Duration;

use super::model::{Job, JobFile, Op, Policy, Resolution, Status};
use super::{copy, store};
use crate::state::AppState;

/// Background worker: reconcile interrupted jobs, then drain the queue one job
/// at a time (large transfers are disk-bound, so serial is deliberate).
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
    let base_name = src_top
        .file_name()
        .ok_or_else(|| JobError::Path("source has no name".into()))?;
    let target = dst_dir.join(base_name);

    let files = store::get_job_files(&state.pool, &job.id).await?;

    // Fast path: a conflict-free move on the same filesystem is a single rename
    // of the whole tree — no byte copying at all.
    let fresh_move = job.op == Op::Move && files.iter().all(|f| !f.conflict && !f.done);
    if fresh_move {
        match fs::rename(&src_top, &target) {
            Ok(()) => {
                for f in &files {
                    store::mark_file_done(&state.pool, &job.id, &f.rel_path).await?;
                }
                store::update_progress(&state.pool, &job.id, job.bytes_total, None).await?;
                return Ok(Outcome::Done);
            }
            Err(e) if e.raw_os_error() == Some(copy::EXDEV) => { /* fall through */ }
            Err(e) => return Err(e.into()),
        }
    }

    // Progress counter seeded from durably recorded per-file offsets, so a
    // resumed job's bar picks up where it left off.
    let initial: u64 = files.iter().map(|f| f.bytes_done.max(0) as u64).sum();
    let counter = Arc::new(AtomicU64::new(initial));

    for f in &files {
        if f.done {
            continue;
        }
        if cancel.load(Ordering::SeqCst) {
            return Ok(Outcome::Canceled);
        }

        let source = src_parent.join(&f.rel_path);
        let dest = dst_dir.join(&f.rel_path);

        // TOCTOU: a file unplanned-for now exists at the destination. Pause the
        // whole job for a fresh decision rather than guessing.
        if !f.conflict && dest.exists() {
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
            // Canceling is terminal (not a pause), so drop the partial sidecar.
            let _ = fs::remove_file(copy::part_path(&dest));
            return Ok(Outcome::Canceled);
        }
        store::mark_file_done(&state.pool, &job.id, &f.rel_path).await?;

        if job.op == Op::Move {
            let _ = fs::remove_file(&source);
        }
    }

    store::update_progress(&state.pool, &job.id, job.bytes_total, None).await?;

    // A move leaves the source dirs behind; sweep the empties best-effort.
    if job.op == Op::Move && src_top.is_dir() {
        remove_empty_dirs(&src_top);
    }

    Ok(Outcome::Done)
}

/// Per-file override wins over the job-wide policy.
fn effective_resolution(f: &JobFile, policy: Option<Policy>) -> Option<Resolution> {
    f.resolution.or_else(|| policy.map(Policy::resolution))
}

/// Run one file's copy on a blocking thread while a ticker checkpoints progress
/// (job-wide + per-file) to the DB roughly twice a second.
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

    let ticker = {
        let pool = state.pool.clone();
        let id = job.id.clone();
        let rel = f.rel_path.clone();
        let counter = counter.clone();
        tokio::spawn(async move {
            let mut iv = tokio::time::interval(Duration::from_millis(500));
            iv.tick().await; // first tick is immediate; skip it
            loop {
                iv.tick().await;
                let c = counter.load(Ordering::Relaxed);
                let per_file = start_offset + c.saturating_sub(counter_at_start);
                let _ = store::update_progress(&pool, &id, c as i64, Some(&rel)).await;
                let _ = store::set_file_progress(&pool, &id, &rel, per_file as i64).await;
            }
        })
    };

    let res = {
        let source = source.to_path_buf();
        let dest = dest.to_path_buf();
        let counter = counter.clone();
        let cancel = cancel.clone();
        tokio::task::spawn_blocking(move || {
            copy::copy_file_resumable(&source, &dest, start_offset, &counter, &cancel)
        })
        .await
    };

    ticker.abort();

    let completed = res
        .map_err(|e| JobError::Io(io::Error::other(e)))??;

    // Final checkpoint for this file so a crash right after can't lose it.
    let c = counter.load(Ordering::Relaxed);
    let _ = store::update_progress(&state.pool, &job.id, c as i64, Some(&f.rel_path)).await;
    Ok(completed)
}

/// Remove now-empty directories bottom-up. Best-effort: non-empty dirs and
/// errors are ignored.
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
