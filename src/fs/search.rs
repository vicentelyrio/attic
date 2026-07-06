use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};

const MAX_VISITED: usize = 20_000;
const DEFAULT_LIMIT: usize = 50;
const MAX_LIMIT: usize = 200;

#[derive(Deserialize)]
pub(super) struct SearchQuery {
    q: String,
    #[serde(default)]
    root: Option<String>,
    #[serde(default)]
    limit: Option<usize>,
}

#[derive(Serialize)]
pub(super) struct Hit {
    root: String,
    path: String,
    name: String,
    parent: String,
    is_dir: bool,
    size: u64,
    modified: Option<i64>,
}

struct Candidate {
    root: String,
    path: String,
    name: String,
    parent: String,
    abs: PathBuf,
}

fn to_epoch(t: std::io::Result<SystemTime>) -> Option<i64> {
    t.ok()
        .and_then(|st| st.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
}

const NOISE_DIRS: &[&str] = &[
    "node_modules",
    "vendor",
    "target",
    "dist",
    "build",
    "Pods",
    "site-packages",
    "__pycache__",
    "DerivedData",
    "Library",
];

fn match_rank(name_lower: &str, needle: &str) -> u8 {
    if name_lower == needle {
        0
    } else if name_lower.starts_with(needle) {
        1
    } else {
        2
    }
}

fn is_noise(path: &str) -> bool {
    path.split('/').any(|seg| NOISE_DIRS.contains(&seg))
}

fn sort_key(c: &Candidate, needle: &str) -> (bool, u8, usize, String) {
    let name_lower = c.name.to_lowercase();
    (
        is_noise(&c.path),
        match_rank(&name_lower, needle),
        c.path.matches('/').count(),
        name_lower,
    )
}

fn candidate_from(root_name: &str, root: &Path, abs: PathBuf, needle: &str) -> Option<Candidate> {
    let rel = abs.strip_prefix(root).ok()?;
    let has_hidden_segment = rel
        .components()
        .any(|c| c.as_os_str().to_string_lossy().starts_with('.'));
    if has_hidden_segment {
        return None;
    }
    let name = abs.file_name()?.to_string_lossy().into_owned();
    if !name.to_lowercase().contains(needle) {
        return None;
    }
    let path = rel.to_string_lossy().replace('\\', "/");
    let parent = rel
        .parent()
        .map(|p| p.to_string_lossy().replace('\\', "/"))
        .unwrap_or_default();
    Some(Candidate { root: root_name.to_string(), path, name, parent, abs })
}

/// Queries the Spotlight index; returns `false` only if `mdfind` can't be
/// spawned, so the caller falls back to a walk.
#[cfg(target_os = "macos")]
async fn collect_indexed(
    root_name: &str,
    root: &Path,
    query: &str,
    needle: &str,
    out: &mut Vec<Candidate>,
) -> bool {
    let output = tokio::process::Command::new("mdfind")
        .arg("-onlyin")
        .arg(root)
        .arg("-name")
        .arg(query)
        .output()
        .await;
    let output = match output {
        Ok(o) => o,
        Err(_) => return false,
    };
    for line in String::from_utf8_lossy(&output.stdout).lines() {
        if let Some(c) = candidate_from(root_name, root, PathBuf::from(line), needle) {
            out.push(c);
        }
    }
    true
}

async fn collect_walk(
    root_name: &str,
    root: &Path,
    needle: &str,
    out: &mut Vec<Candidate>,
    visited: &mut usize,
) {
    let mut stack = vec![root.to_path_buf()];
    while let Some(dir) = stack.pop() {
        let mut rd = match tokio::fs::read_dir(&dir).await {
            Ok(rd) => rd,
            Err(_) => continue,
        };
        while let Ok(Some(entry)) = rd.next_entry().await {
            if *visited >= MAX_VISITED {
                return;
            }
            *visited += 1;

            let name = entry.file_name().to_string_lossy().into_owned();
            if name.starts_with('.') {
                continue;
            }
            let is_dir = matches!(entry.file_type().await, Ok(ft) if ft.is_dir());
            let abs = entry.path();
            if is_dir {
                stack.push(abs.clone());
            }
            if let Some(c) = candidate_from(root_name, root, abs, needle) {
                out.push(c);
            }
        }
    }
}

pub(super) async fn search(
    State(state): State<crate::state::AppState>,
    Query(q): Query<SearchQuery>,
) -> Result<Json<Vec<Hit>>, StatusCode> {
    let query = q.q.trim().to_string();
    if query.is_empty() {
        return Ok(Json(Vec::new()));
    }
    let needle = query.to_lowercase();
    let limit = q.limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT);

    let targets: Vec<(&String, &PathBuf)> = match &q.root {
        Some(name) => {
            let path = state.roots.get(name).ok_or(StatusCode::NOT_FOUND)?;
            vec![(name, path)]
        }
        None => state.roots.iter().collect(),
    };

    let mut candidates: Vec<Candidate> = Vec::new();
    let mut visited = 0usize;
    for (name, path) in targets {
        let indexed = {
            #[cfg(target_os = "macos")]
            {
                collect_indexed(name, path, &query, &needle, &mut candidates).await
            }
            #[cfg(not(target_os = "macos"))]
            {
                false
            }
        };
        if !indexed {
            if visited >= MAX_VISITED {
                break;
            }
            collect_walk(name, path, &needle, &mut candidates, &mut visited).await;
        }
    }

    candidates.sort_by_cached_key(|c| sort_key(c, &needle));
    candidates.truncate(limit);

    let mut hits = Vec::with_capacity(candidates.len());
    for c in candidates {
        let meta = tokio::fs::symlink_metadata(&c.abs).await.ok();
        let is_dir = meta.as_ref().is_some_and(|m| m.is_dir());
        hits.push(Hit {
            root: c.root,
            path: c.path,
            name: c.name,
            parent: c.parent,
            is_dir,
            size: match &meta {
                Some(m) if !is_dir => m.len(),
                _ => 0,
            },
            modified: meta.and_then(|m| to_epoch(m.modified())),
        });
    }

    Ok(Json(hits))
}
