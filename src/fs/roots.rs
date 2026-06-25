use axum::{extract::State, response::Json};

use crate::state::AppState;

/// Return the names of all configured roots, sorted. The frontend uses this
/// to populate its root picker — roots are operator config, not hardcodable.
pub(super) async fn list_roots(State(state): State<AppState>) -> Json<Vec<String>> {
    let mut names: Vec<String> = state.roots.keys().cloned().collect();
    names.sort();
    Json(names)
}
