mod config;
mod fs;
mod state;

use state::AppState;
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let config = config::Config::load("config.toml");
    let listen = config.listen.clone();
    let state = AppState::from_config(config);

    let app = fs::routes()
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(&listen).await.unwrap();
    tracing::info!("listening on http://{}", listen);
    axum::serve(listener, app).await.unwrap();
}
