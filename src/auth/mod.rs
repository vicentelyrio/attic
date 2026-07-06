pub mod handlers;
pub mod model;
mod password;
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

/// The authenticated user for the current request, inserted by `require_auth`
/// and pulled from request extensions. Handlers behind the auth middleware can
/// take this as an argument.
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

/// Public auth endpoints — the only routes reachable without a session.
pub fn public_routes() -> Router<AppState> {
    Router::new()
        .route("/api/auth/register", post(handlers::register))
        .route("/api/auth/login", post(handlers::login))
        .route("/api/auth/logout", post(handlers::logout))
}

/// Admin endpoints, gated on an admin/owner role in addition to `require_auth`.
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

/// Authenticated routes that every signed-in user gets (e.g. `/api/auth/me`),
/// so they're behind `require_auth` but not `require_admin`.
pub fn authed_routes() -> Router<AppState> {
    Router::new().route("/api/auth/me", get(handlers::me))
}

/// Default-deny gate: resolve the session cookie to an active user and stash it
/// in extensions, or reject with 401. Applied to every non-public route.
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

/// Require the request's `CurrentUser` to be an owner/admin. Runs after
/// `require_auth`, which populates the extension.
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
