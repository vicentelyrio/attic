use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};

use sqlx::SqlitePool;
use tokio::sync::Notify;

use crate::config::{AuthConfig, Config};

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
    /// Owner bootstrap + session/cookie policy. Required — the server refuses to
    /// serve anonymously.
    pub auth: Arc<AuthConfig>,
}

impl AppState {
    /// Canonicalize every configured root once (failing loudly on a bad one),
    /// open the job database, and seed the owner account when the DB is fresh.
    pub async fn new(config: Config) -> Self {
        let auth = config.auth.clone().unwrap_or_else(|| {
            panic!("config is missing the [auth] section; the server won't serve anonymously")
        });

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
        crate::auth::store::seed_owner_if_empty(&pool, &auth).await;

        AppState {
            roots: Arc::new(roots),
            pool,
            notify: Arc::new(Notify::new()),
            cancels: Arc::new(Mutex::new(HashMap::new())),
            auth: Arc::new(auth),
        }
    }
}
