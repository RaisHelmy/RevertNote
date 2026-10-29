-- Accounts. username/email are case-insensitive unique; phone is stored as E.164.
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phone         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL DEFAULT '',
  welcomed      INTEGER NOT NULL DEFAULT 0,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  last_day      INTEGER NOT NULL DEFAULT 1 CHECK (last_day BETWEEN 1 AND 40),
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  last_login_at INTEGER
);

-- Session id is the SHA-256 of the cookie token, so a DB leak does not leak live sessions.
CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  user_agent TEXT
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- One row per user per journal day. sketch is a JPEG data URL.
CREATE TABLE entries (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day        INTEGER NOT NULL CHECK (day BETWEEN 1 AND 40),
  text       TEXT NOT NULL DEFAULT '',
  sketch     TEXT,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, day)
);

CREATE TABLE audit_log (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id       TEXT NOT NULL,
  action         TEXT NOT NULL,
  target_user_id TEXT,
  meta           TEXT,
  created_at     INTEGER NOT NULL
);
CREATE INDEX idx_audit_target ON audit_log(target_user_id);
