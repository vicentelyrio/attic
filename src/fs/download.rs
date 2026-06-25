use axum::{
    body::Body,
    extract::{Query, Request, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
};
use serde::Deserialize;
use tower::ServiceExt;
use tower_http::services::ServeFile;

use crate::fs::resolve_within_root;
use crate::state::AppState;

#[derive(Deserialize)]
pub(super) struct DownloadQuery {
    root: String,
    #[serde(default)]
    path: String,
    #[serde(default)]
    dl: bool,
}

pub(super) async fn download(
    State(state): State<AppState>,
    Query(q): Query<DownloadQuery>,
    req: Request<Body>,
) -> Result<Response, StatusCode> {
    let path = resolve_within_root(&state.roots, &q.root, &q.path).ok_or(StatusCode::FORBIDDEN)?;

    let meta = tokio::fs::metadata(&path).await.map_err(|_| StatusCode::NOT_FOUND)?;
    if meta.is_dir() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let mut response = ServeFile::new(&path)
        .oneshot(req)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .into_response();

    if q.dl {
        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            if let Ok(value) = format!("attachment; filename=\"{}\"", name).parse() {
                response.headers_mut().insert(header::CONTENT_DISPOSITION, value);
            }
        }
    }

    Ok(response)
}
