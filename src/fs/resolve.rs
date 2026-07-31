use std::collections::HashMap;
use std::path::{Path, PathBuf};

use axum::http::StatusCode;

/// Why a path could not be resolved. `NoRoots` is a server misconfiguration —
/// nothing was discovered under `roots_dir` — and must not be reported as a
/// rejected path, which is something the caller did wrong.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum ResolveError {
    NoRoots,
    Rejected,
}

impl ResolveError {
    pub(crate) fn status(self) -> StatusCode {
        match self {
            ResolveError::NoRoots => StatusCode::SERVICE_UNAVAILABLE,
            ResolveError::Rejected => StatusCode::FORBIDDEN,
        }
    }

    pub(crate) fn message(self) -> &'static str {
        match self {
            ResolveError::NoRoots => "server has no drives configured; check roots_dir",
            ResolveError::Rejected => "path not found or outside root",
        }
    }

    pub(crate) fn api_error(self, rejected: &str) -> (StatusCode, String) {
        match self {
            ResolveError::NoRoots => (self.status(), self.message().to_string()),
            ResolveError::Rejected => (self.status(), rejected.to_string()),
        }
    }
}

impl From<ResolveError> for StatusCode {
    fn from(e: ResolveError) -> Self {
        e.status()
    }
}

/// Security boundary: canonicalize, then require the result to stay under the
/// named root. `..` components are rejected outright because the prefix check
/// alone is not enough when a root is `/`.
pub(crate) fn resolve_within_root(
    roots: &HashMap<String, PathBuf>,
    root_name: &str,
    user_path: &str,
) -> Result<PathBuf, ResolveError> {
    if roots.is_empty() {
        tracing::error!(
            "rejecting request for root '{root_name}': no drives were discovered under roots_dir"
        );
        return Err(ResolveError::NoRoots);
    }

    let root = roots.get(root_name).ok_or(ResolveError::Rejected)?;

    let candidate = Path::new(user_path);
    if candidate.is_absolute() {
        return Err(ResolveError::Rejected);
    }

    use std::path::Component;
    if candidate
        .components()
        .any(|c| !matches!(c, Component::Normal(_) | Component::CurDir))
    {
        return Err(ResolveError::Rejected);
    }

    let joined = root.join(candidate);
    let resolved = std::fs::canonicalize(&joined).map_err(|_| ResolveError::Rejected)?;

    if resolved.starts_with(root) {
        Ok(resolved)
    } else {
        Err(ResolveError::Rejected)
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
        assert_eq!(
            resolve_within_root(&roots(), "nope", ""),
            Err(ResolveError::Rejected)
        );
    }

    #[test]
    fn rejects_absolute_path() {
        assert_eq!(
            resolve_within_root(&roots(), "data", "/etc/passwd"),
            Err(ResolveError::Rejected)
        );
    }

    #[test]
    fn rejects_traversal() {
        assert_eq!(
            resolve_within_root(&roots(), "data", "../../etc/passwd"),
            Err(ResolveError::Rejected)
        );
    }

    #[test]
    fn accepts_root_itself() {
        assert!(resolve_within_root(&roots(), "data", "").is_ok());
    }

    #[test]
    fn reports_missing_roots_separately() {
        let empty = HashMap::new();
        let err = resolve_within_root(&empty, "data", "").unwrap_err();
        assert_eq!(err, ResolveError::NoRoots);
        assert_eq!(err.status(), StatusCode::SERVICE_UNAVAILABLE);
    }
}
