use std::ffi::OsString;
use std::fs::{self, File, OpenOptions};
use std::io::{self, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};

/// `EXDEV` — rename across filesystems/roots. Same value on Linux and macOS.
pub const EXDEV: i32 = 18;

const BUF_SIZE: usize = 1 << 20; // 1 MiB

/// The temporary sidecar we stream into before the atomic rename into place.
pub fn part_path(dst: &Path) -> PathBuf {
    let mut s: OsString = dst.as_os_str().to_owned();
    s.push(".part");
    PathBuf::from(s)
}

/// Copy `src` → `dst` crash-safely and resumably.
///
/// Bytes stream into `dst.part` (resuming from `start_offset`, truncating any
/// unsynced tail past it), get `fsync`'d, then atomically renamed onto `dst` —
/// so `dst` never exists in a half-written state, and an interrupted overwrite
/// leaves the original untouched. `counter` accumulates job-wide bytes copied
/// (for progress); `cancel` is polled between chunks.
///
/// Returns `Ok(true)` on completion, `Ok(false)` if canceled mid-copy.
pub fn copy_file_resumable(
    src: &Path,
    dst: &Path,
    start_offset: u64,
    counter: &AtomicU64,
    cancel: &AtomicBool,
) -> io::Result<bool> {
    if let Some(parent) = dst.parent() {
        fs::create_dir_all(parent)?;
    }

    let part = part_path(dst);
    let mut src_f = File::open(src)?;
    let src_len = src_f.metadata()?.len();

    let mut part_f = OpenOptions::new()
        .create(true)
        .read(true)
        .write(true)
        .open(&part)?;

    // Trust only what we durably recorded: clamp to the smaller of the recorded
    // offset and what's actually on disk, and discard anything beyond it.
    let part_len = part_f.metadata()?.len();
    let mut offset = start_offset.min(part_len).min(src_len);
    part_f.set_len(offset)?;
    part_f.seek(SeekFrom::Start(offset))?;
    src_f.seek(SeekFrom::Start(offset))?;

    let mut buf = vec![0u8; BUF_SIZE];
    while offset < src_len {
        if cancel.load(Ordering::SeqCst) {
            return Ok(false);
        }
        let n = src_f.read(&mut buf)?;
        if n == 0 {
            break;
        }
        part_f.write_all(&buf[..n])?;
        offset += n as u64;
        counter.fetch_add(n as u64, Ordering::Relaxed);
    }

    part_f.sync_all()?;
    drop(part_f);
    fs::rename(&part, dst)?;
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn tmp() -> PathBuf {
        let p = std::env::temp_dir().join(format!("files-copy-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&p).unwrap();
        p
    }

    fn counter() -> AtomicU64 {
        AtomicU64::new(0)
    }

    #[test]
    fn copies_a_whole_file() {
        let dir = tmp();
        let src = dir.join("src.bin");
        let dst = dir.join("out/dst.bin"); // nested → must create parent
        fs::write(&src, b"hello world").unwrap();

        let c = counter();
        let cancel = AtomicBool::new(false);
        let done = copy_file_resumable(&src, &dst, 0, &c, &cancel).unwrap();

        assert!(done);
        assert_eq!(fs::read(&dst).unwrap(), b"hello world");
        assert_eq!(c.load(Ordering::Relaxed), 11);
        assert!(!part_path(&dst).exists(), "no leftover .part");
        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn resumes_from_offset() {
        let dir = tmp();
        let src = dir.join("src.bin");
        let dst = dir.join("dst.bin");
        fs::write(&src, b"ABCDEFGHIJ").unwrap();
        // Pretend 4 bytes were already copied into the sidecar.
        fs::write(part_path(&dst), b"ABCD").unwrap();

        let c = counter();
        let cancel = AtomicBool::new(false);
        let done = copy_file_resumable(&src, &dst, 4, &c, &cancel).unwrap();

        assert!(done);
        assert_eq!(fs::read(&dst).unwrap(), b"ABCDEFGHIJ");
        // Only the remaining 6 bytes should have been counted.
        assert_eq!(c.load(Ordering::Relaxed), 6);
        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn cancel_stops_before_finishing() {
        let dir = tmp();
        let src = dir.join("src.bin");
        let dst = dir.join("dst.bin");
        fs::write(&src, vec![7u8; 4096]).unwrap();

        let c = counter();
        let cancel = AtomicBool::new(true); // canceled up front
        let done = copy_file_resumable(&src, &dst, 0, &c, &cancel).unwrap();

        assert!(!done);
        assert!(!dst.exists(), "destination not published on cancel");
        fs::remove_dir_all(&dir).ok();
    }
}
