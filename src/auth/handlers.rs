use std::net::SocketAddr;

use axum::extract::{ConnectInfo, Path, Query, State};
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Json, Response};
use axum_extra::extract::CookieJar;
use serde::Deserialize;

use super::model::{AccountStatus, Role, User};
use super::{password, session, store, CurrentUser};
use crate::state::AppState;

type ApiError = (StatusCode, String);

const MIN_USERNAME: usize = 3;
const MAX_USERNAME: usize = 32;
const MIN_PASSWORD: usize = 8;
const MAX_PASSWORD: usize = 128;

fn bad_request(msg: &str) -> ApiError {
    (StatusCode::BAD_REQUEST, msg.to_string())
}

fn too_many_requests(msg: &str) -> ApiError {
    (StatusCode::TOO_MANY_REQUESTS, msg.to_string())
}

fn internal(e: impl std::fmt::Display) -> ApiError {
    tracing::error!("auth error: {e}");
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        "internal error".to_string(),
    )
}

fn validate_password(password: &str) -> Result<(), ApiError> {
    if password.len() < MIN_PASSWORD {
        return Err(bad_request("password must be at least 8 characters"));
    }
    if password.len() > MAX_PASSWORD {
        return Err(bad_request("password must be at most 128 characters"));
    }
    Ok(())
}

fn validate_credentials(username: &str, password: &str) -> Result<(), ApiError> {
    if username.len() < MIN_USERNAME {
        return Err(bad_request("username must be at least 3 characters"));
    }
    if username.len() > MAX_USERNAME {
        return Err(bad_request("username must be at most 32 characters"));
    }
    if username.contains(|c: char| c.is_whitespace()) {
        return Err(bad_request("username must not contain spaces"));
    }
    validate_password(password)
}

async fn hash_off_runtime(password: String) -> Result<String, ApiError> {
    tokio::task::spawn_blocking(move || password::hash(&password))
        .await
        .map_err(internal)?
        .map_err(internal)
}

async fn verify_off_runtime(password: String, phc: String) -> Result<bool, ApiError> {
    tokio::task::spawn_blocking(move || password::verify(&password, &phc))
        .await
        .map_err(internal)
}

#[derive(Deserialize)]
pub struct RegisterReq {
    username: String,
    password: String,
}

pub async fn register(
    State(state): State<AppState>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(req): Json<RegisterReq>,
) -> Result<Response, ApiError> {
    if !state.register_limiter.check(addr.ip()) {
        return Err(too_many_requests(
            "too many registration attempts; try again later",
        ));
    }

    let username = req.username.trim();
    validate_credentials(username, &req.password)?;
    state.register_limiter.record(addr.ip());

    let hash = hash_off_runtime(req.password).await?;
    let created = store::create_pending(&state.pool, username, &hash)
        .await
        .map_err(internal)?;

    match created {
        Some(user) => Ok((StatusCode::ACCEPTED, Json(user)).into_response()),
        None => Err((StatusCode::CONFLICT, "username already taken".to_string())),
    }
}

#[derive(Deserialize)]
pub struct LoginReq {
    username: String,
    password: String,
    #[serde(default)]
    remember: bool,
}

pub async fn login(
    State(state): State<AppState>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(req): Json<LoginReq>,
) -> Result<Response, ApiError> {
    let ip = addr.ip();
    if !state.login_limiter.check(ip) {
        return Err(too_many_requests(
            "too many sign-in attempts; try again later",
        ));
    }
    if req.password.len() > MAX_PASSWORD {
        return Err(bad_request("password must be at most 128 characters"));
    }

    let username = req.username.trim();
    let user = store::find_by_username(&state.pool, username)
        .await
        .map_err(internal)?;

    let phc = user
        .as_ref()
        .map(|u| u.password_hash.clone())
        .unwrap_or_else(|| password::DUMMY_HASH.clone());
    let verified = verify_off_runtime(req.password, phc).await?;

    let user = match user {
        Some(u) if verified => u,
        _ => {
            state.login_limiter.record(ip);
            return Err((StatusCode::UNAUTHORIZED, "invalid credentials".to_string()));
        }
    };

    match user.status {
        AccountStatus::Active => {}
        AccountStatus::Pending => {
            return Err((
                StatusCode::FORBIDDEN,
                "account is awaiting admin approval".to_string(),
            ));
        }
        AccountStatus::Disabled => {
            return Err((StatusCode::FORBIDDEN, "account is disabled".to_string()));
        }
    }

    let ttl_secs = if req.remember {
        state.auth.session_ttl_days * 86_400
    } else {
        session::SHORT_TTL_HOURS * 3_600
    };

    let token = session::generate_token();
    store::create_session(&state.pool, &session::hash_token(&token), &user.id, ttl_secs)
        .await
        .map_err(internal)?;
    state.login_limiter.clear(ip);

    if let Err(e) = store::sweep_expired_sessions(&state.pool).await {
        tracing::warn!("session sweep failed: {e}");
    }

    let persistent_cookie_secs = req.remember.then_some(ttl_secs);
    let mut resp = Json(user).into_response();
    resp.headers_mut().insert(
        header::SET_COOKIE,
        session::set_cookie(&token, persistent_cookie_secs, state.auth.secure_cookies),
    );
    Ok(resp)
}

pub async fn logout(
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<Response, ApiError> {
    if let Some(cookie) = jar.get(session::COOKIE_NAME) {
        store::delete_session(&state.pool, &session::hash_token(cookie.value()))
            .await
            .map_err(internal)?;
    }

    let mut resp = StatusCode::NO_CONTENT.into_response();
    resp.headers_mut().insert(
        header::SET_COOKIE,
        session::clear_cookie(state.auth.secure_cookies),
    );
    Ok(resp)
}

pub async fn me(CurrentUser(user): CurrentUser) -> Json<User> {
    Json(user)
}

#[derive(Deserialize)]
pub struct ListQuery {
    status: Option<String>,
}

pub async fn list_users(
    State(state): State<AppState>,
    Query(q): Query<ListQuery>,
) -> Result<Json<Vec<User>>, ApiError> {
    let status = match q.status.as_deref() {
        Some(s) => Some(AccountStatus::parse(s).ok_or_else(|| bad_request("invalid status"))?),
        None => None,
    };
    let users = store::list_users(&state.pool, status)
        .await
        .map_err(internal)?;
    Ok(Json(users))
}

async fn load_user(state: &AppState, id: &str) -> Result<User, ApiError> {
    store::find_by_id(&state.pool, id)
        .await
        .map_err(internal)?
        .ok_or((StatusCode::NOT_FOUND, "user not found".to_string()))
}

pub async fn approve(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<User>, ApiError> {
    let user = load_user(&state, &id).await?;
    if user.status == AccountStatus::Active {
        return Err(bad_request("user is already active"));
    }
    store::set_status(&state.pool, &id, AccountStatus::Active)
        .await
        .map_err(internal)?;
    Ok(Json(load_user(&state, &id).await?))
}

pub async fn disable(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<User>, ApiError> {
    let user = load_user(&state, &id).await?;
    guard_last_owner(&state, &user).await?;
    store::set_status(&state.pool, &id, AccountStatus::Disabled)
        .await
        .map_err(internal)?;
    store::delete_user_sessions(&state.pool, &id)
        .await
        .map_err(internal)?;
    Ok(Json(load_user(&state, &id).await?))
}

#[derive(Deserialize)]
pub struct ResetPasswordReq {
    password: String,
}

pub async fn reset_password(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(req): Json<ResetPasswordReq>,
) -> Result<StatusCode, ApiError> {
    validate_password(&req.password)?;
    load_user(&state, &id).await?;
    let hash = hash_off_runtime(req.password).await?;
    store::set_password(&state.pool, &id, &hash)
        .await
        .map_err(internal)?;
    store::delete_user_sessions(&state.pool, &id)
        .await
        .map_err(internal)?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn delete_user(
    State(state): State<AppState>,
    CurrentUser(actor): CurrentUser,
    Path(id): Path<String>,
) -> Result<StatusCode, ApiError> {
    if actor.id == id {
        return Err(bad_request("cannot remove your own account"));
    }
    let user = load_user(&state, &id).await?;
    guard_last_owner(&state, &user).await?;
    store::delete_user(&state.pool, &id)
        .await
        .map_err(internal)?;
    Ok(StatusCode::NO_CONTENT)
}

async fn guard_last_owner(state: &AppState, user: &User) -> Result<(), ApiError> {
    let is_active_owner = user.role == Role::Owner && user.status == AccountStatus::Active;
    if is_active_owner && store::owner_count(&state.pool).await.map_err(internal)? <= 1 {
        return Err(bad_request("cannot remove the last owner"));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_short_username() {
        assert!(validate_credentials("ab", "password1").is_err());
    }

    #[test]
    fn rejects_long_username() {
        assert!(validate_credentials(&"a".repeat(33), "password1").is_err());
    }

    #[test]
    fn rejects_whitespace_username() {
        assert!(validate_credentials("a b", "password1").is_err());
    }

    #[test]
    fn rejects_short_password() {
        assert!(validate_credentials("alice", "short").is_err());
    }

    #[test]
    fn rejects_oversized_password() {
        assert!(validate_credentials("alice", &"p".repeat(129)).is_err());
    }

    #[test]
    fn accepts_valid_credentials() {
        assert!(validate_credentials("alice", "password1").is_ok());
    }
}
