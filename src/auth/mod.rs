pub mod handlers;
pub mod model;
pub mod password;
pub mod rate_limit;
mod session;
pub mod store;

use axum::extract::{FromRequestParts, Request, State};
use axum::http::request::Parts;
use axum::http::StatusCode;
use axum::middleware::{self, Next};
use axum::response::Response;
use axum::routing::{delete, get, post};
use axum::Router;
use axum_extra::extract::CookieJar;

use crate::state::AppState;
use model::{AccountStatus, User};

#[derive(Clone)]
pub struct CurrentUser(pub User);

impl<S> FromRequestParts<S> for CurrentUser
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<CurrentUser>()
            .cloned()
            .ok_or(StatusCode::UNAUTHORIZED)
    }
}

pub fn public_routes() -> Router<AppState> {
    Router::new()
        .route("/api/auth/register", post(handlers::register))
        .route("/api/auth/login", post(handlers::login))
        .route("/api/auth/logout", post(handlers::logout))
}

pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/api/admin/users", get(handlers::list_users))
        .route("/api/admin/users/{id}/approve", post(handlers::approve))
        .route("/api/admin/users/{id}/disable", post(handlers::disable))
        .route(
            "/api/admin/users/{id}/reset-password",
            post(handlers::reset_password),
        )
        .route("/api/admin/users/{id}", delete(handlers::delete_user))
        .route_layer(middleware::from_fn(require_admin))
}

pub fn authed_routes() -> Router<AppState> {
    Router::new().route("/api/auth/me", get(handlers::me))
}

pub async fn require_auth(
    State(state): State<AppState>,
    jar: CookieJar,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let token = jar
        .get(session::COOKIE_NAME)
        .map(|c| c.value().to_string())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let user = store::session_user(&state.pool, &session::hash_token(&token))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if user.status != AccountStatus::Active {
        return Err(StatusCode::UNAUTHORIZED);
    }

    req.extensions_mut().insert(CurrentUser(user));
    Ok(next.run(req).await)
}

pub async fn require_admin(req: Request, next: Next) -> Result<Response, StatusCode> {
    let is_admin = req
        .extensions()
        .get::<CurrentUser>()
        .map(|u| u.0.role.is_admin())
        .unwrap_or(false);
    if !is_admin {
        return Err(StatusCode::FORBIDDEN);
    }
    Ok(next.run(req).await)
}
