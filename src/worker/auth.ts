import type { Context, MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import type { PublicUser } from '../shared/schemas';
import { randomToken, sha256Hex } from './crypto';
import type { AppEnv, UserRow } from './env';

export const SESSION_COOKIE = 'sid';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
// Sliding expiry: extend the session once less than this much time is left.
const SESSION_REFRESH_MS = 15 * 24 * 60 * 60 * 1000;

export function toPublicUser(u: UserRow): PublicUser {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    phone: u.phone,
    displayName: u.display_name,
    welcomed: !!u.welcomed,
    role: u.role,
    status: u.status,
    lastDay: u.last_day,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    lastLoginAt: u.last_login_at,
  };
}

function cookieOptions(c: Context<AppEnv>, expires: Date) {
  return {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax' as const,
    path: '/',
    expires,
  };
}

export async function createSession(c: Context<AppEnv>, userId: string): Promise<void> {
  const token = randomToken();
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;
  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, expires_at, created_at, user_agent) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(await sha256Hex(token), userId, expiresAt, now, (c.req.header('user-agent') ?? '').slice(0, 300))
    .run();
  setCookie(c, SESSION_COOKIE, token, cookieOptions(c, new Date(expiresAt)));
}

export async function destroySession(c: Context<AppEnv>): Promise<void> {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(await sha256Hex(token)).run();
  }
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

export function revokeAllSessions(db: D1Database, userId: string): D1PreparedStatement {
  return db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId);
}

/** Loads the signed-in user, or throws 401. */
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) throw new HTTPException(401, { message: 'Please sign in' });
  const sessionId = await sha256Hex(token);
  const row = await c.env.DB.prepare(
    `SELECT s.expires_at AS session_expires_at, u.*
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ?`,
  )
    .bind(sessionId)
    .first<UserRow & { session_expires_at: number }>();

  const now = Date.now();
  if (!row || row.session_expires_at < now || row.status !== 'active') {
    if (row) await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    deleteCookie(c, SESSION_COOKIE, { path: '/' });
    throw new HTTPException(401, { message: 'Please sign in' });
  }

  if (row.session_expires_at - now < SESSION_REFRESH_MS) {
    const expiresAt = now + SESSION_TTL_MS;
    await c.env.DB.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?').bind(expiresAt, sessionId).run();
    setCookie(c, SESSION_COOKIE, token, cookieOptions(c, new Date(expiresAt)));
  }

  const { session_expires_at: _ignored, ...user } = row;
  c.set('user', user);
  c.set('sessionId', sessionId);
  await next();
};

export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (c.get('user').role !== 'admin') throw new HTTPException(403, { message: 'Admins only' });
  await next();
};

/** Rejects cross-site writes: the Origin header, when sent, must match this host. */
export const sameOrigin: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    const origin = c.req.header('origin');
    if (origin && origin !== new URL(c.req.url).origin) {
      throw new HTTPException(403, { message: 'Cross-site request blocked' });
    }
  }
  await next();
};

export async function rateLimit(c: Context<AppEnv>, bucket: string, key: string): Promise<void> {
  const ip = c.req.header('cf-connecting-ip') ?? 'local';
  const { success } = await c.env.AUTH_LIMITER.limit({ key: `${bucket}:${ip}:${key.toLowerCase()}` });
  if (!success) throw new HTTPException(429, { message: 'Too many attempts. Please wait a minute and try again.' });
}
