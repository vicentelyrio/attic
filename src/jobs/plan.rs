use std::fs;
use std::path::Path;

/// One file to be copied. `rel_path` is relative to the destination directory
/// and includes the pasted item's top-level name (e.g. `movies/clip.mp4`).
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

/// Walk `src` into a flat file manifest, flagging each file whose destination
/// (`dst_dir/rel_path`) already exists. Empty directories, symlinks, and other
/// special files are not carried over.
pub fn build(src: &Path, dst_dir: &Path, base_name: &str) -> std::io::Result<Plan> {
    let mut files = Vec::new();
    walk(src, dst_dir, base_name.to_string(), &mut files)?;
    let bytes_total = files.iter().map(|f| f.size).sum();
    Ok(Plan { files, bytes_total })
}

fn walk(
    src: &Path,
    dst_dir: &Path,
    rel: String,
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
            walk(&entry.path(), dst_dir, child_rel, out)?;
        }
    } else if ft.is_file() {
        let conflict = dst_dir.join(&rel).exists();
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

        let plan = build(&dir.join("a.txt"), &dst, "a.txt").unwrap();

        assert_eq!(plan.files.len(), 1);
        assert_eq!(plan.files[0].rel_path, "a.txt");
        assert_eq!(plan.bytes_total, 2);
        assert!(!plan.has_conflicts());
        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn directory_tree_flags_existing_files() {
        let dir = tmp();
        let src = dir.join("movies");
        fs::create_dir_all(src.join("sub")).unwrap();
        fs::write(src.join("clip.mp4"), b"aaaa").unwrap();
        fs::write(src.join("sub/deep.mp4"), b"bb").unwrap();

        // Destination already holds movies/clip.mp4 → that one conflicts.
        let dst = dir.join("dest");
        fs::create_dir_all(dst.join("movies")).unwrap();
        fs::write(dst.join("movies/clip.mp4"), b"old").unwrap();

        let plan = build(&src, &dst, "movies").unwrap();

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
