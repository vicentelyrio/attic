use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::Json;
use serde::Deserialize;
use uuid::Uuid;

use super::model::{Favorite, now};
use super::store;
use crate::auth::CurrentUser;
use crate::state::AppState;

type ApiError = (StatusCode, String);

fn forbidden(msg: &str) -> ApiError {
    (StatusCode::FORBIDDEN, msg.to_string())
}

fn bad_request(msg: &str) -> ApiError {
    (StatusCode::BAD_REQUEST, msg.to_string())
}

fn internal(e: impl std::fmt::Display) -> ApiError {
    tracing::error!("favorites error: {e}");
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        "internal error".to_string(),
    )
}

pub async fn list(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
) -> Result<Json<Vec<Favorite>>, ApiError> {
    let favorites = store::list_for_user(&state.pool, &user.id)
        .await
        .map_err(internal)?;
    Ok(Json(favorites))
}

#[derive(Deserialize)]
pub struct AddReq {
    root: String,
    #[serde(default)]
    path: String,
}

pub async fn add(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Json(req): Json<AddReq>,
) -> Result<Json<Favorite>, ApiError> {
    let resolved = crate::fs::resolve_within_root(&state.roots, &req.root, &req.path)
        .ok_or_else(|| forbidden("folder not found or outside root"))?;

    if !resolved.is_dir() {
        return Err(bad_request("favorite must be a folder"));
    }

    // Label from the last path segment so it matches what the user sees; fall
    // back to the root name when the favorite is the root directory itself.
    let name = req
        .path
        .rsplit('/')
        .find(|s| !s.is_empty())
        .map(String::from)
        .unwrap_or_else(|| req.root.clone());

    let fav = Favorite {
        id: Uuid::new_v4().to_string(),
        root: req.root,
        path: req.path,
        name,
        created_at: now(),
    };

    store::add(&state.pool, &user.id, &fav)
        .await
        .map_err(internal)?;

    // Re-read so a repeat "add" returns the existing row (with its original id)
    // rather than the one we just discarded on conflict.
    let saved = store::find_for_user(&state.pool, &user.id, &fav.root, &fav.path)
        .await
        .map_err(internal)?
        .ok_or_else(|| internal("favorite missing after insert"))?;

    Ok(Json(saved))
}

pub async fn remove(
    State(state): State<AppState>,
    CurrentUser(user): CurrentUser,
    Path(id): Path<String>,
) -> Result<StatusCode, ApiError> {
    store::remove(&state.pool, &user.id, &id)
        .await
        .map_err(internal)?;
    Ok(StatusCode::NO_CONTENT)
}
