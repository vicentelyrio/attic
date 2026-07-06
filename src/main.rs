mod auth;
mod config;
mod db;
mod favorites;
mod fs;
mod jobs;
mod spa;
mod state;
mod util;

use std::net::SocketAddr;

use axum::middleware;
use state::AppState;
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    if std::env::args().nth(1).as_deref() == Some("hash-password") {
        hash_password();
        return;
    }

    tracing_subscriber::fmt::init();

    let config_path = std::env::var("CONFIG_PATH").unwrap_or_else(|_| "config.toml".to_string());
    let config = config::Config::load(&config_path);
    let listen = config.listen.clone();
    let state = AppState::new(config).await;

    tokio::spawn(jobs::worker::run(state.clone()));

    let protected = fs::routes()
        .merge(jobs::routes())
        .merge(favorites::routes())
        .merge(auth::authed_routes())
        .merge(auth::admin_routes())
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            auth::require_auth,
        ));

    let app = auth::public_routes()
        .merge(protected)
        .fallback(spa::handler)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(&listen).await.unwrap();
    tracing::info!("listening on http://{}", listen);
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await
    .unwrap();
}

fn hash_password() {
    use std::io::{self, Write};

    eprint!("Password: ");
    io::stderr().flush().expect("flush");

    let mut pw = String::new();
    io::stdin().read_line(&mut pw).expect("read password");
    let pw = pw.trim_end_matches(['\n', '\r']);

    if pw.len() < 8 {
        eprintln!("password must be at least 8 characters");
        std::process::exit(1);
    }

    println!("{}", auth::password::hash(pw).expect("hash password"));
}
