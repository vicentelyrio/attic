use std::fs;
use std::path::Path;

pub struct PlannedFile {
    pub rel_path: String,
    pub size: i64,
    pub conflict: bool,
}

pub struct Plan {
    pub files: Vec<PlannedFile>,
    pub bytes_total: i64,
}

impl Plan {
    pub fn has_conflicts(&self) -> bool {
        self.files.iter().any(|f| f.conflict)
    }
}

/// Rewrites the first path segment of `rel` from `from` to `to`; a no-op when
/// they match.
pub(super) fn replace_top(rel: &str, from: &str, to: &str) -> String {
    if from == to {
        return rel.to_string();
    }
    match rel.strip_prefix(from) {
        Some(rest) if rest.is_empty() || rest.starts_with('/') => format!("{to}{rest}"),
        _ => rel.to_string(),
    }
}

/// Walks `src` into a flat file manifest, flagging files whose destination
/// already exists. Empty directories, symlinks, and other special files are
/// not carried over.
pub fn build(
    src: &Path,
    dst_dir: &Path,
    src_base: &str,
    dst_base: &str,
) -> std::io::Result<Plan> {
    let mut files = Vec::new();
    walk(src, dst_dir, src_base.to_string(), src_base, dst_base, &mut files)?;
    let bytes_total = files.iter().map(|f| f.size).sum();
    Ok(Plan { files, bytes_total })
}

fn walk(
    src: &Path,
    dst_dir: &Path,
    rel: String,
    src_base: &str,
    dst_base: &str,
    out: &mut Vec<PlannedFile>,
) -> std::io::Result<()> {
    let meta = fs::symlink_metadata(src)?;
    let ft = meta.file_type();

    if ft.is_dir() {
        let mut entries: Vec<_> = fs::read_dir(src)?.filter_map(Result::ok).collect();
        entries.sort_by_key(|e| e.file_name());
        for entry in entries {
            let name = entry.file_name();
            let child_rel = format!("{rel}/{}", name.to_string_lossy());
            walk(&entry.path(), dst_dir, child_rel, src_base, dst_base, out)?;
        }
    } else if ft.is_file() {
        let dst_rel = replace_top(&rel, src_base, dst_base);
        let conflict = dst_dir.join(&dst_rel).exists();
        out.push(PlannedFile { rel_path: rel, size: meta.len() as i64, conflict });
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn tmp() -> PathBuf {
        let p = std::env::temp_dir().join(format!("files-plan-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&p).unwrap();
        p
    }

    #[test]
    fn single_file_no_conflict() {
        let dir = tmp();
        fs::write(dir.join("a.txt"), b"hi").unwrap();
        let dst = dir.join("dest");
        fs::create_dir_all(&dst).unwrap();

        let plan = build(&dir.join("a.txt"), &dst, "a.txt", "a.txt").unwrap();

        assert_eq!(plan.files.len(), 1);
        assert_eq!(plan.files[0].rel_path, "a.txt");
        assert_eq!(plan.bytes_total, 2);
        assert!(!plan.has_conflicts());
        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn duplicate_into_same_dir_has_no_conflict() {
        let dir = tmp();
        fs::write(dir.join("a.txt"), b"hi").unwrap();

        let plan = build(&dir.join("a.txt"), &dir, "a.txt", "a copy.txt").unwrap();

        assert_eq!(plan.files.len(), 1);
        assert_eq!(plan.files[0].rel_path, "a.txt");
        assert!(!plan.has_conflicts());
        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn replace_top_rewrites_only_first_segment() {
        assert_eq!(replace_top("a.txt", "a.txt", "a copy.txt"), "a copy.txt");
        assert_eq!(replace_top("movies/clip.mp4", "movies", "movies copy"), "movies copy/clip.mp4");
        assert_eq!(replace_top("movies/clip.mp4", "movies", "movies"), "movies/clip.mp4");
    }

    #[test]
    fn directory_tree_flags_existing_files() {
        let dir = tmp();
        let src = dir.join("movies");
        fs::create_dir_all(src.join("sub")).unwrap();
        fs::write(src.join("clip.mp4"), b"aaaa").unwrap();
        fs::write(src.join("sub/deep.mp4"), b"bb").unwrap();

        let dst = dir.join("dest");
        fs::create_dir_all(dst.join("movies")).unwrap();
        fs::write(dst.join("movies/clip.mp4"), b"old").unwrap();

        let plan = build(&src, &dst, "movies", "movies").unwrap();

        assert_eq!(plan.files.len(), 2);
        assert_eq!(plan.bytes_total, 6);
        let clip = plan
            .files
            .iter()
            .find(|f| f.rel_path == "movies/clip.mp4")
            .unwrap();
        let deep = plan
            .files
            .iter()
            .find(|f| f.rel_path == "movies/sub/deep.mp4")
            .unwrap();
        assert!(clip.conflict);
        assert!(!deep.conflict);
        fs::remove_dir_all(&dir).ok();
    }
}
