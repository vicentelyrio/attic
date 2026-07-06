-- Accounts and sessions for the auth follow-up. New users self-register into
-- `pending` and an owner/admin approves them; the owner is seeded from config on
-- first boot. `jobs.user_id` (added nullable in 0001) becomes the id of the
-- creating user; SQLite can't add the FK after the fact, so it's enforced in code.
CREATE TABLE users (
  id            TEXT PRIMARY KEY,               -- uuid v4
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,                  -- argon2id PHC string
  role          TEXT NOT NULL DEFAULT 'user',   -- 'owner' | 'admin' | 'user'
  status        TEXT NOT NULL DEFAULT 'pending',-- 'pending' | 'active' | 'disabled'
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

-- Server-side sessions. Only the sha256 of the opaque cookie value is stored, so
-- a database leak doesn't hand over live sessions. Rows are deleted on logout,
-- account disable/remove, and password reset for immediate revocation.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,                  -- sha256(cookie value), hex
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
