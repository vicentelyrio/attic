use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;

use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub roots: Arc<HashMap<String, PathBuf>>,
}

impl AppState {
    /// Canonicalize every configured root once, failing loudly on a bad one.
    pub fn from_config(config: Config) -> Self {
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
        AppState { roots: Arc::new(roots) }
    }
}
