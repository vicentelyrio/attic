use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use sqlx::SqlitePool;
use tokio::sync::Notify;

use crate::auth::rate_limit::RateLimiter;
use crate::config::{AuthConfig, Config};

pub type Cancels = Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>;

const LOGIN_ATTEMPTS_PER_WINDOW: u32 = 10;
const LOGIN_WINDOW: Duration = Duration::from_secs(15 * 60);
const REGISTRATIONS_PER_WINDOW: u32 = 5;
const REGISTRATION_WINDOW: Duration = Duration::from_secs(60 * 60);

#[derive(Clone)]
pub struct AppState {
    pub roots: Arc<HashMap<String, PathBuf>>,
    pub pool: SqlitePool,
    pub notify: Arc<Notify>,
    pub cancels: Cancels,
    pub auth: Arc<AuthConfig>,
    pub login_limiter: Arc<RateLimiter>,
    pub register_limiter: Arc<RateLimiter>,
    pub max_upload_bytes: u64,
}

impl AppState {
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
            login_limiter: Arc::new(RateLimiter::new(LOGIN_ATTEMPTS_PER_WINDOW, LOGIN_WINDOW)),
            register_limiter: Arc::new(RateLimiter::new(
                REGISTRATIONS_PER_WINDOW,
                REGISTRATION_WINDOW,
            )),
            max_upload_bytes: config.max_upload_bytes,
        }
    }
}
