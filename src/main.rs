mod auth;
mod config;
mod db;
mod fs;
mod jobs;
mod state;

use axum::middleware;
use state::AppState;
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() {
    // Load secrets from an (uncommitted) .env before anything reads the
    // environment. Absent .env is fine — real env vars still win.
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt::init();

    let config = config::Config::load("config.toml");
    let listen = config.listen.clone();
    let state = AppState::new(config).await;

    tokio::spawn(jobs::worker::run(state.clone()));

    // Default-deny: everything except the public auth endpoints sits behind
    // `require_auth`; the admin routes carry an extra role gate of their own.
    let protected = fs::routes()
        .merge(jobs::routes())
        .merge(auth::authed_routes())
        .merge(auth::admin_routes())
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            auth::require_auth,
        ));

    let app = auth::public_routes()
        .merge(protected)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(&listen).await.unwrap();
    tracing::info!("listening on http://{}", listen);
    axum::serve(listener, app).await.unwrap();
}
