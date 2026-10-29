import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { normalizePhone, signInSchema, signUpSchema } from '../../shared/schemas';
import { createSession, destroySession, rateLimit, toPublicUser } from '../auth';
import { DUMMY_HASH, verifyPassword } from '../crypto';
import type { AppEnv, UserRow } from '../env';
import { insertUser, requirePhone } from '../users';
import { body } from '../validate';

export const authRoutes = new Hono<AppEnv>();

authRoutes.post('/signup', async (c) => {
  const input = await body(c, signUpSchema);
  await rateLimit(c, 'signup', '');
  const phone = requirePhone(input.phone, input.phoneCountry);
  const bootstrap = c.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const user = await insertUser(c.env.DB, {
    username: input.username,
    email: input.email,
    phone,
    password: input.password,
    role: bootstrap && bootstrap === input.email.toLowerCase() ? 'admin' : 'user',
  });
  const now = Date.now();
  await c.env.DB.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').bind(now, user.id).run();
  await createSession(c, user.id);
  return c.json({ user: toPublicUser({ ...user, last_login_at: now }) }, 201);
});

authRoutes.post('/signin', async (c) => {
  const input = await body(c, signInSchema);
  await rateLimit(c, 'signin', input.identifier);

  const id = input.identifier;
  const phone = /^[+\d][\d\s()-]{5,}$/.test(id) ? normalizePhone(id, input.phoneCountry) : null;
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE username = ?1 OR email = ?1 OR (?2 IS NOT NULL AND phone = ?2) LIMIT 1',
  )
    .bind(id, phone)
    .first<UserRow>();

  // Always run the hash so response time does not reveal whether the account exists.
  const ok = await verifyPassword(input.password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) throw new HTTPException(401, { message: 'Incorrect username, email, phone or password' });
  if (user.status !== 'active') throw new HTTPException(403, { message: 'This account has been disabled' });

  const now = Date.now();
  await c.env.DB.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').bind(now, user.id).run();
  await createSession(c, user.id);
  return c.json({ user: toPublicUser({ ...user, last_login_at: now }) });
});

authRoutes.post('/signout', async (c) => {
  await destroySession(c);
  return c.json({ ok: true });
});
