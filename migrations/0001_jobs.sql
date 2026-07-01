-- Durable copy/move jobs. A job is the unit that survives restarts: the worker
-- reconciles anything left mid-flight against these rows on startup.
CREATE TABLE jobs (
  id           TEXT PRIMARY KEY,
  user_id      TEXT,                 -- nullable; FK target in the auth follow-up
  op           TEXT NOT NULL,        -- 'copy' | 'move'
  src_root     TEXT NOT NULL,
  src_path     TEXT NOT NULL,
  dst_root     TEXT NOT NULL,
  dst_dir      TEXT NOT NULL,
  status       TEXT NOT NULL,        -- planning|needs_resolution|queued|running|done|failed|canceled
  policy       TEXT,                 -- overwrite_all | skip_all | null
  bytes_total  INTEGER NOT NULL DEFAULT 0,
  bytes_done   INTEGER NOT NULL DEFAULT 0,
  current_file TEXT,
  error        TEXT,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

-- One row per source file (the manifest). Lets a directory tree resume at the
-- exact file it died on, and carries the per-file collision resolution.
CREATE TABLE job_files (
  job_id     TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  rel_path   TEXT NOT NULL,
  size       INTEGER NOT NULL,
  bytes_done INTEGER NOT NULL DEFAULT 0,
  conflict   INTEGER NOT NULL DEFAULT 0,   -- destination existed at plan time
  resolution TEXT,                          -- overwrite | skip | null
  done       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (job_id, rel_path)
);

CREATE INDEX idx_jobs_status ON jobs(status);
