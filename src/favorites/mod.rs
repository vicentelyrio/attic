mod handlers;
pub mod model;
pub mod store;

use axum::routing::{delete, get};
use axum::Router;

use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/api/favorites", get(handlers::list).post(handlers::add))
        .route("/api/favorites/{id}", delete(handlers::remove))
}
