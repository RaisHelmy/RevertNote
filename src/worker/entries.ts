import type { z } from 'zod';
import { DAY_COUNT, type Entry, type EntryMeta, type backupSchema } from '../shared/schemas';

interface EntryRow {
  day: number;
  text: string;
  sketch?: string | null;
  has_sketch?: number;
  updated_at: number;
}

export async function listEntryMetas(db: D1Database, userId: string): Promise<EntryMeta[]> {
  const { results } = await db
    .prepare(
      `SELECT day, text, sketch IS NOT NULL AS has_sketch, updated_at
         FROM entries WHERE user_id = ? ORDER BY day`,
    )
    .bind(userId)
    .all<EntryRow>();
  return results.map((r) => ({ day: r.day, text: r.text, hasSketch: !!r.has_sketch, updatedAt: r.updated_at }));
}

export async function getEntry(db: D1Database, userId: string, day: number): Promise<Entry> {
  const r = await db
    .prepare('SELECT day, text, sketch, updated_at FROM entries WHERE user_id = ? AND day = ?')
    .bind(userId, day)
    .first<EntryRow>();
  if (!r) return { day, text: '', sketch: null, hasSketch: false, updatedAt: 0 };
  return { day, text: r.text, sketch: r.sketch ?? null, hasSketch: r.sketch != null, updatedAt: r.updated_at };
}

/** Upserts only the fields given; `sketch: null` removes the drawing. */
export function upsertEntry(
  db: D1Database,
  userId: string,
  day: number,
  patch: { text?: string; sketch?: string | null },
  updatedAt = Date.now(),
): D1PreparedStatement {
  const hasText = patch.text !== undefined ? 1 : 0;
  const hasSketch = patch.sketch !== undefined ? 1 : 0;
  return db
    .prepare(
      `INSERT INTO entries (user_id, day, text, sketch, updated_at)
       VALUES (?1, ?2, COALESCE(?3, ''), ?4, ?5)
       ON CONFLICT (user_id, day) DO UPDATE SET
         text = CASE WHEN ?6 THEN COALESCE(?3, '') ELSE text END,
         sketch = CASE WHEN ?7 THEN ?4 ELSE sketch END,
         updated_at = ?5`,
    )
    .bind(userId, day, patch.text ?? null, patch.sketch ?? null, updatedAt, hasText, hasSketch);
}

export function parseDay(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= DAY_COUNT ? n : null;
}

/** Writes a backup's days for a user. Returns how many days were restored. */
export async function importBackup(
  db: D1Database,
  userId: string,
  backup: z.output<typeof backupSchema>,
): Promise<number> {
  const stmts: D1PreparedStatement[] = [];
  for (const [key, v] of Object.entries(backup.days)) {
    const day = parseDay(key);
    if (!day) continue;
    const sketch = typeof v.sketch === 'string' && v.sketch.startsWith('data:image/') ? v.sketch : null;
    stmts.push(upsertEntry(db, userId, day, { text: v.text ?? '', sketch }, v.updatedAt || Date.now()));
  }
  const name = backup.profile?.name?.trim().slice(0, 40);
  if (name) {
    stmts.push(
      // Only fill in a missing name; never overwrite one the user already chose.
      db
        .prepare(
          `UPDATE users SET display_name = CASE WHEN display_name = '' THEN ? ELSE display_name END,
                            welcomed = 1, updated_at = ? WHERE id = ?`,
        )
        .bind(name, Date.now(), userId),
    );
  }
  if (stmts.length) await db.batch(stmts);
  return Object.keys(backup.days).filter((k) => parseDay(k)).length;
}

export async function exportBackup(db: D1Database, userId: string, displayName: string) {
  const { results } = await db
    .prepare('SELECT day, text, sketch, updated_at FROM entries WHERE user_id = ? ORDER BY day')
    .bind(userId)
    .all<EntryRow>();
  const days: Record<string, { text: string; updatedAt: number; sketch: string | null }> = {};
  for (const r of results) {
    if (!r.text.trim() && !r.sketch) continue;
    days[r.day] = { text: r.text, updatedAt: r.updated_at, sketch: r.sketch ?? null };
  }
  return {
    app: 'welcome-home-journal' as const,
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: { name: displayName },
    days,
  };
}
