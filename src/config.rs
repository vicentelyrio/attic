use serde::Deserialize;
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Deserialize)]
pub struct Config {
    pub listen: String,
    pub roots: HashMap<String, PathBuf>,
    #[serde(default = "default_db_path")]
    pub db_path: PathBuf,
    pub auth: Option<AuthConfig>,
}

#[derive(Deserialize, Clone)]
pub struct AuthConfig {
    pub owner_username: String,
    #[serde(default)]
    pub owner_password_hash: String,
    #[serde(default = "default_secure_cookies")]
    pub secure_cookies: bool,
    #[serde(default = "default_session_ttl_days")]
    pub session_ttl_days: i64,
}

impl AuthConfig {
    pub fn resolved_owner_hash(&self) -> String {
        std::env::var("VAULT_OWNER_PASSWORD_HASH")
            .unwrap_or_else(|_| self.owner_password_hash.clone())
    }
}

fn default_db_path() -> PathBuf {
    PathBuf::from("attic.db")
}

fn default_secure_cookies() -> bool {
    true
}

fn default_session_ttl_days() -> i64 {
    7
}

impl Config {
    pub fn load(path: &str) -> Self {
        let raw = std::fs::read_to_string(path)
            .unwrap_or_else(|e| panic!("failed to read {path}: {e}"));
        toml::from_str(&raw).unwrap_or_else(|e| panic!("failed to parse {path}: {e}"))
    }
}
