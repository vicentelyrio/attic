use serde::Serialize;

pub use crate::util::now;

#[derive(Debug, Clone, Serialize)]
pub struct Favorite {
    pub id: String,
    pub root: String,
    pub path: String,
    pub name: String,
    pub created_at: i64,
}
