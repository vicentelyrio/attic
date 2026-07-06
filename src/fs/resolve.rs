use std::collections::HashMap;
use std::path::{Path, PathBuf};

/// Security boundary: canonicalize, then require the result to stay under the
/// named root. `..` components are rejected outright because the prefix check
/// alone is not enough when a root is `/`.
pub(crate) fn resolve_within_root(
    roots: &HashMap<String, PathBuf>,
    root_name: &str,
    user_path: &str,
) -> Option<PathBuf> {
    let root = roots.get(root_name)?;

    let candidate = Path::new(user_path);
    if candidate.is_absolute() {
        return None;
    }

    use std::path::Component;
    if candidate
        .components()
        .any(|c| !matches!(c, Component::Normal(_) | Component::CurDir))
    {
        return None;
    }

    let joined = root.join(candidate);
    let resolved = std::fs::canonicalize(&joined).ok()?;

    if resolved.starts_with(root) {
        Some(resolved)
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn roots() -> HashMap<String, PathBuf> {
        let base = std::fs::canonicalize(std::env::temp_dir()).unwrap();
        let mut m = HashMap::new();
        m.insert("data".to_string(), base);
        m
    }

    #[test]
    fn rejects_unknown_root() {
        assert!(resolve_within_root(&roots(), "nope", "").is_none());
    }

    #[test]
    fn rejects_absolute_path() {
        assert!(resolve_within_root(&roots(), "data", "/etc/passwd").is_none());
    }

    #[test]
    fn rejects_traversal() {
        assert!(resolve_within_root(&roots(), "data", "../../etc/passwd").is_none());
    }

    #[test]
    fn accepts_root_itself() {
        assert!(resolve_within_root(&roots(), "data", "").is_some());
    }
}
