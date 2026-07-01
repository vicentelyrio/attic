mod copy;
mod handlers;
pub mod model;
mod plan;
pub mod store;
pub mod worker;

use axum::routing::{get, post};
use axum::Router;

use crate::state::AppState;

/// All job-facing routes, merged into the app router alongside `fs::routes()`.
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/api/paste", post(handlers::paste))
        .route("/api/jobs", get(handlers::list))
        .route("/api/jobs/{id}", get(handlers::get))
        .route("/api/jobs/{id}/resolve", post(handlers::resolve))
        .route("/api/jobs/{id}/cancel", post(handlers::cancel))
}
