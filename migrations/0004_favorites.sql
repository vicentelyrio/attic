-- Per-user favorite folders for the Finder-style sidebar shortcuts. A favorite
-- points at a directory by (root, path); the unique constraint makes "add"
-- idempotent so the same folder can't be pinned twice. Rows are removed with the
-- owning user via the FK cascade.
CREATE TABLE favorites (
  id         TEXT PRIMARY KEY,               -- uuid v4
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  root       TEXT NOT NULL,
  path       TEXT NOT NULL,                  -- relative to the root, '' for the root itself
  name       TEXT NOT NULL,                  -- display label (last path segment)
  created_at INTEGER NOT NULL,
  UNIQUE (user_id, root, path)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
