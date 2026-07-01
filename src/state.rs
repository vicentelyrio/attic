use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};

use sqlx::SqlitePool;
use tokio::sync::Notify;

use crate::config::Config;

/// Per-job cancellation flags, shared between the cancel handler (which sets
/// them) and the worker (which polls them mid-copy). Keyed by job id.
pub type Cancels = Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>;

#[derive(Clone)]
pub struct AppState {
    pub roots: Arc<HashMap<String, PathBuf>>,
    pub pool: SqlitePool,
    /// Woken whenever a job becomes runnable so the worker stops idling.
    pub notify: Arc<Notify>,
    pub cancels: Cancels,
}

impl AppState {
    /// Canonicalize every configured root once (failing loudly on a bad one)
    /// and open the job database.
    pub async fn new(config: Config) -> Self {
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

        let pool = crate::db::connect(&config.db_path).await;

        AppState {
            roots: Arc::new(roots),
            pool,
            notify: Arc::new(Notify::new()),
            cancels: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}
