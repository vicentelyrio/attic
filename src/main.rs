use axum::{
    body::Body,
    extract::{Query, Request, State},
    http::{header, StatusCode},
    response::{IntoResponse, Json, Response},
    routing::get,
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tower::ServiceExt;
use tower_http::services::ServeFile;
use tower_http::trace::TraceLayer;

// ---- Config -------------------------------------------------------------

// Parsed from config.toml. The operator decides what roots exist and where
// they point — could be /mnt/raid, /home/user, or / if they choose.
#[derive(Deserialize)]
struct Config {
    listen: String,
    // name -> filesystem path, e.g. media = "/mnt/raid/media"
    roots: HashMap<String, PathBuf>,
}

// ---- Runtime state ------------------------------------------------------

// Each configured root, canonicalized once at startup. Every request is
// validated against the canonical form.
#[derive(Clone)]
struct AppState {
    roots: Arc<HashMap<String, PathBuf>>,
}

#[derive(Deserialize)]
struct ListQuery {
    root: String,
    #[serde(default)]
    path: String,
}

#[derive(Deserialize)]
struct DownloadQuery {
    root: String,
    #[serde(default)]
    path: String,
    // ?dl=true forces a download dialog; default streams inline (for video/audio/images)
    #[serde(default)]
    dl: bool,
}

#[derive(Serialize)]
struct Entry {
    name: String,
    is_dir: bool,
    size: u64,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    // Load config.toml from the working directory.
    let raw = std::fs::read_to_string("config.toml")
        .expect("config.toml must exist");
    let config: Config = toml::from_str(&raw)
        .expect("config.toml must be valid");

    // Canonicalize every configured root once, failing loudly if one is bad.
    // A misconfigured root should stop startup, not silently 404 later.
    let mut roots = HashMap::new();
    for (name, path) in config.roots {
        match std::fs::canonicalize(&path) {
            Ok(canon) => {
                tracing::info!("root '{}' -> {}", name, canon.display());
                roots.insert(name, canon);
            }
            Err(e) => panic!("root '{}' ({}) is unusable: {}", name, path.display(), e),
        }
    }

    let state = AppState { roots: Arc::new(roots) };

    let app = Router::new()
        .route("/api/list", get(list_dir))
        .route("/api/download", get(download))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(&config.listen)
        .await
        .unwrap();

    tracing::info!("listening on http://{}", config.listen);
    axum::serve(listener, app).await.unwrap();
}

// ---- Path resolution ----------------------------------------------------

// Resolve a (root_name, relative_path) pair to a real path, refusing anything
// that escapes the named root. Same canonicalize-then-check-prefix guard as
// before — the only change is that `root` is now looked up by name.
fn resolve_within_root(
    roots: &HashMap<String, PathBuf>,
    root_name: &str,
    user_path: &str,
) -> Option<PathBuf> {
    let root = roots.get(root_name)?; // unknown root name -> rejected

    let candidate = Path::new(user_path);
    if candidate.is_absolute() {
        return None;
    }

    let joined = root.join(candidate);
    let resolved = std::fs::canonicalize(&joined).ok()?;

    if resolved.starts_with(root) {
        Some(resolved)
    } else {
        None
    }
}

// ---- Handler ------------------------------------------------------------

async fn list_dir(
    State(state): State<AppState>,
    Query(q): Query<ListQuery>,
) -> Result<Json<Vec<Entry>>, StatusCode> {
    let dir = resolve_within_root(&state.roots, &q.root, &q.path)
        .ok_or(StatusCode::FORBIDDEN)?;

    let mut read_dir = tokio::fs::read_dir(&dir)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    let mut entries = Vec::new();
    while let Some(item) = read_dir
        .next_entry()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    {
        let meta = match item.metadata().await {
            Ok(m) => m,
            Err(_) => continue,
        };
        entries.push(Entry {
            name: item.file_name().to_string_lossy().into_owned(),
            is_dir: meta.is_dir(),
            size: meta.len(),
        });
    }

    entries.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(Json(entries))
}

/// Download a file.
async fn download(
    State(state): State<AppState>,
    Query(q): Query<DownloadQuery>,
    req: Request<Body>,
) -> Result<Response, StatusCode> {
    // Same resolver, same security boundary as listing.
    let path = resolve_within_root(&state.roots, &q.root, &q.path)
        .ok_or(StatusCode::FORBIDDEN)?;

    // This endpoint serves file bytes only — reject directories.
    let meta = tokio::fs::metadata(&path)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;
    if meta.is_dir() {
        return Err(StatusCode::BAD_REQUEST);
    }

    // ServeFile does NO path resolution — it serves exactly the file we hand it.
    // All safety already happened in resolve_within_root; ServeFile is purely an
    // HTTP-semantics helper: Range, ETag, conditional GET, content-type sniffing.
    // Clean division — our resolver owns security, ServeFile owns protocol.
    let mut response = ServeFile::new(&path)
        .oneshot(req)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .into_response();

    // Optional: force "save as" instead of inline rendering.
    if q.dl {
        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            if let Ok(value) = format!("attachment; filename=\"{}\"", name).parse() {
                response
                    .headers_mut()
                    .insert(header::CONTENT_DISPOSITION, value);
            }
        }
    }

    Ok(response)
}
