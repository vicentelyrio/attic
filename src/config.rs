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
}

fn default_db_path() -> PathBuf {
    PathBuf::from("attic.db")
}

impl Config {
    pub fn load(path: &str) -> Self {
        let raw = std::fs::read_to_string(path)
            .unwrap_or_else(|e| panic!("failed to read {path}: {e}"));
        toml::from_str(&raw).unwrap_or_else(|e| panic!("failed to parse {path}: {e}"))
    }
}
