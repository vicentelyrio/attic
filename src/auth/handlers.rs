use axum::extract::{Path, Query, State};
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Json, Response};
use axum_extra::extract::CookieJar;
use serde::Deserialize;

use super::model::{AccountStatus, User};
use super::{password, session, store, CurrentUser};
use crate::state::AppState;

type ApiError = (StatusCode, String);

fn bad_request(msg: &str) -> ApiError {
    (StatusCode::BAD_REQUEST, msg.to_string())
}

/// Log the real error server-side; hand the client a generic message.
fn internal(e: impl std::fmt::Display) -> ApiError {
    tracing::error!("auth error: {e}");
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        "internal error".to_string(),
    )
}

const MIN_USERNAME: usize = 3;
const MIN_PASSWORD: usize = 8;

fn validate_credentials(username: &str, password: &str) -> Result<(), ApiError> {
    if username.len() < MIN_USERNAME {
        return Err(bad_request("username must be at least 3 characters"));
    }
    if username.contains(|c: char| c.is_whitespace()) {
        return Err(bad_request("username must not contain spaces"));
    }
    if password.len() < MIN_PASSWORD {
        return Err(bad_request("password must be at least 8 characters"));
    }
    Ok(())
}

#[derive(Deserialize)]
pub struct RegisterReq {
    username: String,
    password: String,
}

/// Self-service registration. Creates a `pending` account that an admin must
/// approve before it can sign in.
pub async fn register(
    State(state): State<AppState>,
    Json(req): Json<RegisterReq>,
) -> Result<Response, ApiError> {
    let username = req.username.trim();
    validate_credentials(username, &req.password)?;

    let hash = password::hash(&req.password).map_err(internal)?;
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

/// Verify credentials and, on success for an active account, mint a session and
/// set the cookie. Unknown user and wrong password are indistinguishable (401).
pub async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginReq>,
) -> Result<Response, ApiError> {
    let username = req.username.trim();
    let user = store::find_by_username(&state.pool, username)
        .await
        .map_err(internal)?;

    let user = match user {
        Some(u) if password::verify(&req.password, &u.password_hash) => u,
        _ => return Err((StatusCode::UNAUTHORIZED, "invalid credentials".to_string())),
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

    let mut resp = Json(user).into_response();
    resp.headers_mut().insert(
        header::SET_COOKIE,
        session::set_cookie(&token, ttl_secs, state.auth.secure_cookies),
    );
    Ok(resp)
}

/// Destroy the current session (server-side row + cookie).
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

/// The authenticated user behind the current session. Drives the frontend guard.
pub async fn me(CurrentUser(user): CurrentUser) -> Json<User> {
    Json(user)
}

/* ---------------------------------------------------------------- */
/* Admin — behind require_admin                                     */
/* ---------------------------------------------------------------- */

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

/// Activate an account: approve a pending signup or re-enable a disabled user.
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
    if req.password.len() < MIN_PASSWORD {
        return Err(bad_request("password must be at least 8 characters"));
    }
    load_user(&state, &id).await?;
    let hash = password::hash(&req.password).map_err(internal)?;
    store::set_password(&state.pool, &id, &hash)
        .await
        .map_err(internal)?;
    // Force re-login everywhere with the new password.
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

/// Refuse to disable/remove the final active owner, which would lock everyone
/// out of administration.
async fn guard_last_owner(state: &AppState, user: &User) -> Result<(), ApiError> {
    let is_active_owner =
        user.role == super::model::Role::Owner && user.status == AccountStatus::Active;
    if is_active_owner && store::owner_count(&state.pool).await.map_err(internal)? <= 1 {
        return Err(bad_request("cannot remove the last owner"));
    }
    Ok(())
}
