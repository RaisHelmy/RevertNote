import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { backupSchema, changePasswordSchema, putEntrySchema, storySchema, updateMeSchema } from '../../shared/schemas';
import { createSession, rateLimit, requireAuth, revokeAllSessions, toPublicUser } from '../auth';
import { hashPassword, verifyPassword } from '../crypto';
import { exportBackup, getEntry, importBackup, listEntryMetas, parseDay, upsertEntry } from '../entries';
import type { AppEnv } from '../env';
import { body } from '../validate';

export const meRoutes = new Hono<AppEnv>();
meRoutes.use(requireAuth);

meRoutes.get('/', (c) => c.json({ user: toPublicUser(c.get('user')) }));

meRoutes.patch('/', async (c) => {
  const input = await body(c, updateMeSchema);
  const user = c.get('user');
  const next = {
    ...user,
    display_name: input.displayName ?? user.display_name,
    welcomed: input.welcomed === undefined ? user.welcomed : input.welcomed ? 1 : 0,
    last_day: input.lastDay ?? user.last_day,
    updated_at: Date.now(),
  };
  await c.env.DB.prepare('UPDATE users SET display_name = ?, welcomed = ?, last_day = ?, updated_at = ? WHERE id = ?')
    .bind(next.display_name, next.welcomed, next.last_day, next.updated_at, user.id)
    .run();
  return c.json({ user: toPublicUser(next) });
});

meRoutes.post('/password', async (c) => {
  const input = await body(c, changePasswordSchema);
  const user = c.get('user');
  await rateLimit(c, 'password', user.id);
  if (!(await verifyPassword(input.currentPassword, user.password_hash))) {
    throw new HTTPException(400, { message: 'Current password is incorrect' });
  }
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').bind(
      await hashPassword(input.newPassword),
      Date.now(),
      user.id,
    ),
    revokeAllSessions(c.env.DB, user.id),
  ]);
  // Every other device is signed out; keep this one signed in.
  await createSession(c, user.id);
  return c.json({ ok: true });
});

meRoutes.get('/entries', async (c) => c.json({ entries: await listEntryMetas(c.env.DB, c.get('user').id) }));

meRoutes.get('/entries/export', async (c) => {
  const user = c.get('user');
  const data = await exportBackup(c.env.DB, user.id, user.display_name);
  const date = new Date().toISOString().slice(0, 10);
  c.header('Content-Disposition', `attachment; filename="welcome-home-journal-${date}.json"`);
  return c.json(data);
});

meRoutes.post('/entries/import', async (c) => {
  const backup = await body(c, backupSchema);
  const restored = await importBackup(c.env.DB, c.get('user').id, backup);
  return c.json({ restored });
});

meRoutes.get('/entries/:day', async (c) => {
  const day = parseDay(c.req.param('day'));
  if (!day) throw new HTTPException(404, { message: 'No such day' });
  return c.json({ entry: await getEntry(c.env.DB, c.get('user').id, day) });
});

meRoutes.put('/entries/:day', async (c) => {
  const day = parseDay(c.req.param('day'));
  if (!day) throw new HTTPException(404, { message: 'No such day' });
  const patch = await body(c, putEntrySchema);
  const updatedAt = Date.now();
  await upsertEntry(c.env.DB, c.get('user').id, day, patch, updatedAt).run();
  return c.json({ ok: true, updatedAt });
});

meRoutes.get('/story', async (c) => {
  const r = await c.env.DB.prepare('SELECT data, updated_at FROM stories WHERE user_id = ?')
    .bind(c.get('user').id)
    .first<{ data: string; updated_at: number }>();
  const story = storySchema.parse(r ? JSON.parse(r.data) : {});
  return c.json({ story, updatedAt: r?.updated_at ?? 0 });
});

meRoutes.put('/story', async (c) => {
  const story = await body(c, storySchema);
  const updatedAt = Date.now();
  await c.env.DB.prepare(
    `INSERT INTO stories (user_id, data, updated_at) VALUES (?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
  )
    .bind(c.get('user').id, JSON.stringify(story), updatedAt)
    .run();
  return c.json({ ok: true, updatedAt });
});
