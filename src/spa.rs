use axum::body::Body;
use axum::http::{header, StatusCode, Uri};
use axum::response::{IntoResponse, Response};
use rust_embed::{EmbeddedFile, RustEmbed};

#[derive(RustEmbed)]
#[folder = "web/dist"]
struct Assets;

pub async fn handler(uri: Uri) -> Response {
    let path = uri.path().trim_start_matches('/');
    let path = if path.is_empty() { "index.html" } else { path };

    match Assets::get(path) {
        Some(file) => serve(path, file),
        None if std::path::Path::new(path).extension().is_some() => {
            StatusCode::NOT_FOUND.into_response()
        }
        None => match Assets::get("index.html") {
            Some(file) => serve("index.html", file),
            None => StatusCode::NOT_FOUND.into_response(),
        },
    }
}

fn serve(path: &str, file: EmbeddedFile) -> Response {
    let mime = file.metadata.mimetype().to_string();
    let mut builder = Response::builder().header(header::CONTENT_TYPE, mime);
    if path.starts_with("assets/") {
        builder = builder.header(header::CACHE_CONTROL, "public, max-age=31536000, immutable");
    }
    builder.body(Body::from(file.data)).unwrap()
}
