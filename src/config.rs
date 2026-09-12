use serde::Deserialize;
use std::path::PathBuf;

#[derive(Deserialize)]
pub struct Config {
    pub listen: String,
    pub roots_dir: PathBuf,
    #[serde(default = "default_db_path")]
    pub db_path: PathBuf,
    #[serde(default = "default_thumbs_dir")]
    pub thumbs_dir: PathBuf,
    // Not derived from the host's CPU count: `available_parallelism` reads
    // the machine's core count, not the container's cgroup quota, so on a
    // throttled container it would size this far past what can actually run
    // and thrash the box generating thumbnails for even a small folder.
    #[serde(default = "default_thumbnail_concurrency")]
    pub thumbnail_concurrency: usize,
    // Video thumbnails run a full ffmpeg process per request (much heavier
    // than an image resize, and vulnerable to slow-seeking files whose index
    // sits at the end of the file), so they get their own — smaller — cap,
    // separate from `thumbnail_concurrency`, so a run of slow video probes
    // can't starve image thumbnails behind the same permits.
    #[serde(default = "default_video_thumbnail_concurrency")]
    pub video_thumbnail_concurrency: usize,
    #[serde(default = "default_max_upload_bytes")]
    pub max_upload_bytes: u64,
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

fn default_thumbs_dir() -> PathBuf {
    PathBuf::from("thumbs")
}

fn default_thumbnail_concurrency() -> usize {
    2
}

fn default_video_thumbnail_concurrency() -> usize {
    1
}

fn default_max_upload_bytes() -> u64 {
    50 * 1024 * 1024 * 1024
}

fn default_secure_cookies() -> bool {
    true
}

fn default_session_ttl_days() -> i64 {
    7
}

impl Config {
    pub fn load(path: &str) -> Self {
        let raw =
            std::fs::read_to_string(path).unwrap_or_else(|e| panic!("failed to read {path}: {e}"));
        toml::from_str(&raw).unwrap_or_else(|e| panic!("failed to parse {path}: {e}"))
    }
}
