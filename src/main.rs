use axum::Router;
use tower_http::services::ServeDir;
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    // ServeDir handles Range requests, ETags, conditional GET for you
    let app = Router::new()
        .nest_service("/files", ServeDir::new("./shared"))
        .layer(TraceLayer::new_for_http());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .unwrap();

    tracing::info!("listening on http://0.0.0.0:3000");
    axum::serve(listener, app).await.unwrap();
}
