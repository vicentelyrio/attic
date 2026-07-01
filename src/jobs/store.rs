use sqlx::sqlite::SqliteRow;
use sqlx::{Row, SqlitePool};

use super::model::{Job, JobFile, Op, Policy, Resolution, Status, now};

fn row_to_job(row: &SqliteRow) -> Job {
    Job {
        id: row.get("id"),
        op: Op::parse(&row.get::<String, _>("op")).unwrap_or(Op::Copy),
        src_root: row.get("src_root"),
        src_path: row.get("src_path"),
        dst_root: row.get("dst_root"),
        dst_dir: row.get("dst_dir"),
        status: Status::parse(&row.get::<String, _>("status")).unwrap_or(Status::Failed),
        policy: row
            .get::<Option<String>, _>("policy")
            .and_then(|s| Policy::parse(&s)),
        bytes_total: row.get("bytes_total"),
        bytes_done: row.get("bytes_done"),
        current_file: row.get("current_file"),
        error: row.get("error"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

fn row_to_file(row: &SqliteRow) -> JobFile {
    JobFile {
        rel_path: row.get("rel_path"),
        size: row.get("size"),
        bytes_done: row.get("bytes_done"),
        conflict: row.get::<i64, _>("conflict") != 0,
        resolution: row
            .get::<Option<String>, _>("resolution")
            .and_then(|s| Resolution::parse(&s)),
        done: row.get::<i64, _>("done") != 0,
    }
}

/// Insert a job and its file manifest in one transaction.
pub async fn create_job(
    pool: &SqlitePool,
    job: &Job,
    files: &[JobFile],
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    sqlx::query(
        "INSERT INTO jobs \
         (id, user_id, op, src_root, src_path, dst_root, dst_dir, status, policy, \
          bytes_total, bytes_done, current_file, error, created_at, updated_at) \
         VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&job.id)
    .bind(job.op.as_str())
    .bind(&job.src_root)
    .bind(&job.src_path)
    .bind(&job.dst_root)
    .bind(&job.dst_dir)
    .bind(job.status.as_str())
    .bind(job.policy.map(|p| p.as_str()))
    .bind(job.bytes_total)
    .bind(job.bytes_done)
    .bind(&job.current_file)
    .bind(&job.error)
    .bind(job.created_at)
    .bind(job.updated_at)
    .execute(&mut *tx)
    .await?;

    for f in files {
        sqlx::query(
            "INSERT INTO job_files \
             (job_id, rel_path, size, bytes_done, conflict, resolution, done) \
             VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&job.id)
        .bind(&f.rel_path)
        .bind(f.size)
        .bind(f.bytes_done)
        .bind(f.conflict as i64)
        .bind(f.resolution.map(|r| r.as_str()))
        .bind(f.done as i64)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(())
}

pub async fn get_job(pool: &SqlitePool, id: &str) -> Result<Option<Job>, sqlx::Error> {
    let row = sqlx::query("SELECT * FROM jobs WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(row.as_ref().map(row_to_job))
}

pub async fn get_job_files(pool: &SqlitePool, id: &str) -> Result<Vec<JobFile>, sqlx::Error> {
    let rows = sqlx::query("SELECT * FROM job_files WHERE job_id = ? ORDER BY rel_path")
        .bind(id)
        .fetch_all(pool)
        .await?;
    Ok(rows.iter().map(row_to_file).collect())
}

/// Active and recent jobs for the transfers panel, newest activity first.
pub async fn list_jobs(pool: &SqlitePool, limit: i64) -> Result<Vec<Job>, sqlx::Error> {
    let rows = sqlx::query("SELECT * FROM jobs ORDER BY updated_at DESC LIMIT ?")
        .bind(limit)
        .fetch_all(pool)
        .await?;
    Ok(rows.iter().map(row_to_job).collect())
}

/// The oldest runnable job, if any. Drives the worker loop.
pub async fn next_queued(pool: &SqlitePool) -> Result<Option<Job>, sqlx::Error> {
    let row = sqlx::query("SELECT * FROM jobs WHERE status = 'queued' ORDER BY created_at LIMIT 1")
        .fetch_optional(pool)
        .await?;
    Ok(row.as_ref().map(row_to_job))
}

pub async fn set_status(
    pool: &SqlitePool,
    id: &str,
    status: Status,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?")
        .bind(status.as_str())
        .bind(now())
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn set_failed(pool: &SqlitePool, id: &str, error: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE jobs SET status = 'failed', error = ?, updated_at = ? WHERE id = ?")
        .bind(error)
        .bind(now())
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

/// Apply the user's collision decision: a job-wide policy plus per-file
/// overrides, then flip the job back to `queued`.
pub async fn apply_resolution(
    pool: &SqlitePool,
    id: &str,
    policy: Option<Policy>,
    overrides: &[(String, Resolution)],
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    sqlx::query("UPDATE jobs SET policy = ?, status = 'queued', updated_at = ? WHERE id = ?")
        .bind(policy.map(|p| p.as_str()))
        .bind(now())
        .bind(id)
        .execute(&mut *tx)
        .await?;

    for (rel, res) in overrides {
        sqlx::query("UPDATE job_files SET resolution = ? WHERE job_id = ? AND rel_path = ?")
            .bind(res.as_str())
            .bind(id)
            .bind(rel)
            .execute(&mut *tx)
            .await?;
    }

    tx.commit().await?;
    Ok(())
}

/// Record job-level progress (bytes copied so far + which file is in flight).
pub async fn update_progress(
    pool: &SqlitePool,
    id: &str,
    bytes_done: i64,
    current_file: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE jobs SET bytes_done = ?, current_file = ?, updated_at = ? WHERE id = ?",
    )
    .bind(bytes_done)
    .bind(current_file)
    .bind(now())
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn set_file_progress(
    pool: &SqlitePool,
    id: &str,
    rel: &str,
    bytes_done: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE job_files SET bytes_done = ? WHERE job_id = ? AND rel_path = ?")
        .bind(bytes_done)
        .bind(id)
        .bind(rel)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn mark_file_done(pool: &SqlitePool, id: &str, rel: &str) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE job_files SET done = 1, bytes_done = size WHERE job_id = ? AND rel_path = ?",
    )
    .bind(id)
    .bind(rel)
    .execute(pool)
    .await?;
    Ok(())
}

/// Flag a file that turned out to already exist at copy time (TOCTOU); the
/// worker uses this to pause the job for a fresh resolution.
pub async fn flag_conflict(pool: &SqlitePool, id: &str, rel: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE job_files SET conflict = 1 WHERE job_id = ? AND rel_path = ?")
        .bind(id)
        .bind(rel)
        .execute(pool)
        .await?;
    Ok(())
}

/// On startup, anything left `running` from a previous process is requeued so
/// the worker resumes it from the recorded per-file offsets.
pub async fn requeue_running(pool: &SqlitePool) -> Result<u64, sqlx::Error> {
    let res = sqlx::query(
        "UPDATE jobs SET status = 'queued', updated_at = ? WHERE status = 'running'",
    )
    .bind(now())
    .execute(pool)
    .await?;
    Ok(res.rows_affected())
}
