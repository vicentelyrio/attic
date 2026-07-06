use std::ffi::OsString;
use std::fs::{self, File, OpenOptions};
use std::io::{self, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};

// Rename across filesystems; same value on Linux and macOS.
pub const EXDEV: i32 = 18;

const BUF_SIZE: usize = 1 << 20;

pub fn part_path(dst: &Path) -> PathBuf {
    let mut s: OsString = dst.as_os_str().to_owned();
    s.push(".part");
    PathBuf::from(s)
}

/// Streams into a `.part` sidecar, fsyncs, then renames into place — `dst`
/// never exists half-written. Returns `Ok(false)` if canceled mid-copy.
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

    // No truncate on open: the resume offset decides how much survives.
    let mut part_f = OpenOptions::new()
        .create(true)
        .truncate(false)
        .read(true)
        .write(true)
        .open(&part)?;

    // Resume only from bytes that verifiably exist on both sides; discard any
    // unsynced tail past that point.
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
        let dst = dir.join("out/dst.bin");
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
        fs::write(part_path(&dst), b"ABCD").unwrap();

        let c = counter();
        let cancel = AtomicBool::new(false);
        let done = copy_file_resumable(&src, &dst, 4, &c, &cancel).unwrap();

        assert!(done);
        assert_eq!(fs::read(&dst).unwrap(), b"ABCDEFGHIJ");
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
        let cancel = AtomicBool::new(true);
        let done = copy_file_resumable(&src, &dst, 0, &c, &cancel).unwrap();

        assert!(!done);
        assert!(!dst.exists(), "destination not published on cancel");
        fs::remove_dir_all(&dir).ok();
    }
}
