use serde::Deserialize;
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Deserialize)]
pub struct Config {
    pub listen: String,
    pub roots: HashMap<String, PathBuf>,
    /// Where the SQLite job database lives. Relative paths resolve against the
    /// process working directory. Defaults to `attic.db` when omitted.
    #[serde(default = "default_db_path")]
    pub db_path: PathBuf,
    /// Authentication settings. Optional so pre-auth configs still parse, but the
    /// server refuses to serve without it (no anonymous access).
    pub auth: Option<AuthConfig>,
}

/// Owner bootstrap + session/cookie policy. The owner is seeded from here on
/// first boot (when the users table is empty), avoiding any first-signup race.
#[derive(Deserialize, Clone)]
pub struct AuthConfig {
    pub owner_username: String,
    /// Argon2id PHC hash of the owner password. Generate with
    /// `cargo run --bin hash-password`. Never store the plaintext. Overridable
    /// via the `VAULT_OWNER_PASSWORD_HASH` env var for container deploys.
    #[serde(default)]
    pub owner_password_hash: String,
    /// Set the `Secure` attribute on session cookies. Keep `true` in production
    /// (HTTPS); set `false` only for local plain-http development.
    #[serde(default = "default_secure_cookies")]
    pub secure_cookies: bool,
    /// Session lifetime in days. "Keep me signed in" uses this; a plain sign-in
    /// gets a shorter session (see `session::SHORT_TTL_HOURS`).
    #[serde(default = "default_session_ttl_days")]
    pub session_ttl_days: i64,
}

impl AuthConfig {
    /// The owner hash, preferring the env override when present.
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
