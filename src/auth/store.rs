use std::time::{SystemTime, UNIX_EPOCH};

use sqlx::sqlite::SqliteRow;
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

use super::model::{AccountStatus, Role, User};
use crate::config::AuthConfig;

fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn row_to_user(row: &SqliteRow) -> User {
    User {
        id: row.get("id"),
        username: row.get("username"),
        password_hash: row.get("password_hash"),
        role: Role::parse(&row.get::<String, _>("role")).unwrap_or(Role::User),
        status: AccountStatus::parse(&row.get::<String, _>("status"))
            .unwrap_or(AccountStatus::Disabled),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

pub async fn find_by_username(
    pool: &SqlitePool,
    username: &str,
) -> Result<Option<User>, sqlx::Error> {
    let row = sqlx::query("SELECT * FROM users WHERE username = ? COLLATE NOCASE")
        .bind(username)
        .fetch_optional(pool)
        .await?;
    Ok(row.as_ref().map(row_to_user))
}

pub async fn find_by_id(pool: &SqlitePool, id: &str) -> Result<Option<User>, sqlx::Error> {
    let row = sqlx::query("SELECT * FROM users WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(row.as_ref().map(row_to_user))
}

/// Create a `pending` user. Returns `Ok(None)` when the username is already
/// taken (unique violation) so the caller can answer 409 without leaking detail.
pub async fn create_pending(
    pool: &SqlitePool,
    username: &str,
    password_hash: &str,
) -> Result<Option<User>, sqlx::Error> {
    let ts = now();
    let id = Uuid::new_v4().to_string();
    let res = sqlx::query(
        "INSERT INTO users (id, username, password_hash, role, status, created_at, updated_at) \
         VALUES (?, ?, ?, 'user', 'pending', ?, ?)",
    )
    .bind(&id)
    .bind(username)
    .bind(password_hash)
    .bind(ts)
    .bind(ts)
    .execute(pool)
    .await;

    match res {
        Ok(_) => Ok(find_by_id(pool, &id).await?),
        Err(sqlx::Error::Database(db)) if db.is_unique_violation() => Ok(None),
        Err(e) => Err(e),
    }
}

pub async fn list_users(
    pool: &SqlitePool,
    status: Option<AccountStatus>,
) -> Result<Vec<User>, sqlx::Error> {
    let rows = match status {
        Some(s) => {
            sqlx::query("SELECT * FROM users WHERE status = ? ORDER BY created_at")
                .bind(s.as_str())
                .fetch_all(pool)
                .await?
        }
        None => {
            sqlx::query("SELECT * FROM users ORDER BY created_at")
                .fetch_all(pool)
                .await?
        }
    };
    Ok(rows.iter().map(row_to_user).collect())
}

pub async fn set_status(
    pool: &SqlitePool,
    id: &str,
    status: AccountStatus,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE users SET status = ?, updated_at = ? WHERE id = ?")
        .bind(status.as_str())
        .bind(now())
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn set_password(
    pool: &SqlitePool,
    id: &str,
    password_hash: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
        .bind(password_hash)
        .bind(now())
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn delete_user(pool: &SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM users WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

/// Number of remaining owners — used to refuse removing/disabling the last one.
pub async fn owner_count(pool: &SqlitePool) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE role = 'owner' AND status = 'active'")
        .fetch_one(pool)
        .await
}

/* ---------------------------------------------------------------- */
/* Sessions                                                         */
/* ---------------------------------------------------------------- */

pub async fn create_session(
    pool: &SqlitePool,
    token_hash: &str,
    user_id: &str,
    ttl_secs: i64,
) -> Result<(), sqlx::Error> {
    let ts = now();
    sqlx::query(
        "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    )
    .bind(token_hash)
    .bind(user_id)
    .bind(ts)
    .bind(ts + ttl_secs)
    .execute(pool)
    .await?;
    Ok(())
}

/// Resolve a session token hash to its (unexpired) user. Expired sessions are
/// treated as absent and swept.
pub async fn session_user(
    pool: &SqlitePool,
    token_hash: &str,
) -> Result<Option<User>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id \
         WHERE s.token_hash = ? AND s.expires_at > ?",
    )
    .bind(token_hash)
    .bind(now())
    .fetch_optional(pool)
    .await?;
    Ok(row.as_ref().map(row_to_user))
}

pub async fn delete_session(pool: &SqlitePool, token_hash: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM sessions WHERE token_hash = ?")
        .bind(token_hash)
        .execute(pool)
        .await?;
    Ok(())
}

/// Revoke every live session for a user (logout everywhere) — used on disable,
/// remove, and password reset.
pub async fn delete_user_sessions(pool: &SqlitePool, user_id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM sessions WHERE user_id = ?")
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}

/* ---------------------------------------------------------------- */
/* Owner bootstrap                                                  */
/* ---------------------------------------------------------------- */

/// Seed the owner from config when the users table is empty. Called once at
/// startup; panics loudly on a missing/invalid owner hash so a fresh deploy
/// can't come up with no way in.
pub async fn seed_owner_if_empty(pool: &SqlitePool, cfg: &AuthConfig) {
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
        .fetch_one(pool)
        .await
        .expect("failed to count users");
    if count > 0 {
        return;
    }

    let hash = cfg.resolved_owner_hash();
    if hash.is_empty() {
        panic!(
            "no users exist and [auth].owner_password_hash is empty; \
             generate one with `cargo run --bin hash-password`"
        );
    }

    let ts = now();
    sqlx::query(
        "INSERT INTO users (id, username, password_hash, role, status, created_at, updated_at) \
         VALUES (?, ?, ?, 'owner', 'active', ?, ?)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&cfg.owner_username)
    .bind(&hash)
    .bind(ts)
    .bind(ts)
    .execute(pool)
    .await
    .expect("failed to seed owner account");

    tracing::info!("seeded owner account '{}'", cfg.owner_username);
}
