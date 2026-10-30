-- "My Shahadah Story" page: one JSON document of free-text fields per user.
CREATE TABLE stories (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data       TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
