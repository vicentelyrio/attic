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

    if q.dl
        && let Some(name) = path.file_name().and_then(|n| n.to_str())
        && let Ok(value) = content_disposition(name).parse()
    {
        response.headers_mut().insert(header::CONTENT_DISPOSITION, value);
    }

    Ok(response)
}

// RFC 6266: a quoted ASCII `filename` for legacy clients (with quotes,
// backslashes, and control bytes neutralized so the name can't break out of the
// quoted-string), plus an RFC 5987 `filename*` that carries the exact UTF-8 name.
fn content_disposition(name: &str) -> String {
    let ascii: String = name
        .chars()
        .map(|c| if c.is_control() || c == '"' || c == '\\' { '_' } else { c })
        .collect();
    format!(
        "attachment; filename=\"{ascii}\"; filename*=UTF-8''{}",
        rfc5987_encode(name)
    )
}

fn rfc5987_encode(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        if b.is_ascii_alphanumeric() || matches!(b, b'-' | b'.' | b'_' | b'~') {
            out.push(b as char);
        } else {
            out.push('%');
            out.push_str(&format!("{b:02X}"));
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn neutralizes_quotes_in_ascii_fallback() {
        let v = content_disposition("ev\"il.txt");
        assert!(v.contains("filename=\"ev_il.txt\""));
    }

    #[test]
    fn star_form_percent_encodes_unicode_and_spaces() {
        let v = content_disposition("na me é.txt");
        assert!(v.contains("filename*=UTF-8''na%20me%20%C3%A9.txt"));
    }

    #[test]
    fn control_bytes_cannot_reach_header() {
        assert!(content_disposition("a\nb").parse::<axum::http::HeaderValue>().is_ok());
    }
}
