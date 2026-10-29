import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  adminCreateUserSchema,
  adminResetPasswordSchema,
  adminUpdateUserSchema,
  type AdminUserRow,
} from '../../shared/schemas';
import { requireAdmin, requireAuth, revokeAllSessions, toPublicUser } from '../auth';
import { generatePassword, hashPassword } from '../crypto';
import { getEntry, listEntryMetas, parseDay } from '../entries';
import type { AppEnv, UserRow } from '../env';
import { assertUnique, audit, insertUser, requirePhone } from '../users';
import { body } from '../validate';

export const adminRoutes = new Hono<AppEnv>();
adminRoutes.use(requireAuth, requireAdmin);

const PAGE_SIZE = 25;
const LIT = `(SELECT COUNT(*) FROM entries e WHERE e.user_id = u.id AND (TRIM(e.text) != '' OR e.sketch IS NOT NULL))`;

async function loadUser(db: D1Database, id: string): Promise<UserRow> {
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
  if (!user) throw new HTTPException(404, { message: 'User not found' });
  return user;
}

async function countActiveAdmins(db: D1Database): Promise<number> {
  const r = await db
    .prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND status = 'active'`)
    .first<{ n: number }>();
  return r?.n ?? 0;
}

adminRoutes.get('/users', async (c) => {
  const q = (c.req.query('q') ?? '').trim();
  const page = Math.max(1, Number(c.req.query('page')) || 1);
  const like = `%${q.replace(/[%_\\]/g, (m) => '\\' + m)}%`;
  const where = q
    ? `WHERE u.username LIKE ?1 ESCAPE '\\' OR u.email LIKE ?1 ESCAPE '\\' OR u.phone LIKE ?1 ESCAPE '\\'
          OR u.display_name LIKE ?1 ESCAPE '\\'`
    : 'WHERE ?1 IS NOT NULL';
  const [rows, total] = await Promise.all([
    c.env.DB.prepare(
      `SELECT u.*, ${LIT} AS days_lit FROM users u ${where} ORDER BY u.created_at DESC LIMIT ?2 OFFSET ?3`,
    )
      .bind(like, PAGE_SIZE, (page - 1) * PAGE_SIZE)
      .all<UserRow & { days_lit: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) AS n FROM users u ${where}`).bind(like).first<{ n: number }>(),
  ]);
  const users: AdminUserRow[] = rows.results.map((r) => ({ ...toPublicUser(r), daysLit: r.days_lit }));
  return c.json({ users, total: total?.n ?? 0, page, pageSize: PAGE_SIZE });
});

adminRoutes.post('/users', async (c) => {
  const input = await body(c, adminCreateUserSchema);
  const user = await insertUser(c.env.DB, {
    ...input,
    phone: requirePhone(input.phone, input.phoneCountry),
  });
  await audit(c.env.DB, c.get('user').id, 'user.create', user.id, { username: user.username, role: user.role });
  return c.json({ user: toPublicUser(user) }, 201);
});

adminRoutes.get('/users/:id', async (c) => {
  const user = await loadUser(c.env.DB, c.req.param('id'));
  const [entries, sessions, log] = await Promise.all([
    listEntryMetas(c.env.DB, user.id),
    c.env.DB.prepare(
      'SELECT created_at, expires_at, user_agent FROM sessions WHERE user_id = ? AND expires_at > ? ORDER BY created_at DESC',
    )
      .bind(user.id, Date.now())
      .all<{ created_at: number; expires_at: number; user_agent: string | null }>(),
    c.env.DB.prepare(
      `SELECT a.action, a.meta, a.created_at, u.username AS admin_username
         FROM audit_log a LEFT JOIN users u ON u.id = a.admin_id
        WHERE a.target_user_id = ? ORDER BY a.created_at DESC LIMIT 20`,
    )
      .bind(user.id)
      .all<{ action: string; meta: string | null; created_at: number; admin_username: string | null }>(),
  ]);
  return c.json({
    user: toPublicUser(user),
    entries,
    sessions: sessions.results.map((s) => ({
      createdAt: s.created_at,
      expiresAt: s.expires_at,
      userAgent: s.user_agent,
    })),
    audit: log.results.map((a) => ({
      action: a.action,
      meta: a.meta ? JSON.parse(a.meta) : null,
      createdAt: a.created_at,
      admin: a.admin_username,
    })),
  });
});

adminRoutes.get('/users/:id/entries/:day', async (c) => {
  const user = await loadUser(c.env.DB, c.req.param('id'));
  const day = parseDay(c.req.param('day'));
  if (!day) throw new HTTPException(404, { message: 'No such day' });
  return c.json({ entry: await getEntry(c.env.DB, user.id, day) });
});

adminRoutes.patch('/users/:id', async (c) => {
  const input = await body(c, adminUpdateUserSchema);
  const admin = c.get('user');
  const user = await loadUser(c.env.DB, c.req.param('id'));

  const isSelf = user.id === admin.id;
  if (isSelf && ((input.role && input.role !== 'admin') || input.status === 'disabled')) {
    throw new HTTPException(400, { message: 'You cannot remove your own admin access or disable yourself' });
  }
  const losesAdmin =
    user.role === 'admin' && user.status === 'active' && (input.role === 'user' || input.status === 'disabled');
  if (losesAdmin && (await countActiveAdmins(c.env.DB)) <= 1) {
    throw new HTTPException(400, { message: 'There must be at least one active admin' });
  }

  const phone = input.phone !== undefined ? requirePhone(input.phone, input.phoneCountry) : undefined;
  const email = input.email?.toLowerCase();
  await assertUnique(c.env.DB, { username: input.username, email, phone }, user.id);

  const next: UserRow = {
    ...user,
    username: input.username ?? user.username,
    email: email ?? user.email,
    phone: phone ?? user.phone,
    display_name: input.displayName ?? user.display_name,
    role: input.role ?? user.role,
    status: input.status ?? user.status,
    updated_at: Date.now(),
  };
  const stmts = [
    c.env.DB.prepare(
      `UPDATE users SET username = ?, email = ?, phone = ?, display_name = ?, role = ?, status = ?, updated_at = ?
        WHERE id = ?`,
    ).bind(next.username, next.email, next.phone, next.display_name, next.role, next.status, next.updated_at, user.id),
  ];
  if (next.status === 'disabled') stmts.push(revokeAllSessions(c.env.DB, user.id));
  await c.env.DB.batch(stmts);

  const changed = Object.fromEntries(
    (['username', 'email', 'phone', 'display_name', 'role', 'status'] as const)
      .filter((k) => next[k] !== user[k])
      .map((k) => [k, { from: user[k], to: next[k] }]),
  );
  await audit(c.env.DB, admin.id, 'user.update', user.id, changed);
  return c.json({ user: toPublicUser(next) });
});

adminRoutes.post('/users/:id/reset-password', async (c) => {
  const input = await body(c, adminResetPasswordSchema);
  const user = await loadUser(c.env.DB, c.req.param('id'));
  const password = input.password ?? generatePassword();
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').bind(
      await hashPassword(password),
      Date.now(),
      user.id,
    ),
    revokeAllSessions(c.env.DB, user.id),
  ]);
  await audit(c.env.DB, c.get('user').id, 'user.reset_password', user.id, { generated: !input.password });
  // Only echo the password back when we generated it; the admin already knows one they typed.
  return c.json({ ok: true, password: input.password ? null : password });
});

adminRoutes.post('/users/:id/signout-all', async (c) => {
  const user = await loadUser(c.env.DB, c.req.param('id'));
  await revokeAllSessions(c.env.DB, user.id).run();
  await audit(c.env.DB, c.get('user').id, 'user.signout_all', user.id);
  return c.json({ ok: true });
});

adminRoutes.delete('/users/:id', async (c) => {
  const admin = c.get('user');
  const user = await loadUser(c.env.DB, c.req.param('id'));
  if (user.id === admin.id) throw new HTTPException(400, { message: 'You cannot delete your own account here' });
  if (user.role === 'admin' && user.status === 'active' && (await countActiveAdmins(c.env.DB)) <= 1) {
    throw new HTTPException(400, { message: 'There must be at least one active admin' });
  }
  // D1 enforces foreign keys, so sessions and entries cascade.
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();
  await audit(c.env.DB, admin.id, 'user.delete', user.id, { username: user.username, email: user.email });
  return c.json({ ok: true });
});
