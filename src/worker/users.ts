import { HTTPException } from 'hono/http-exception';
import { normalizePhone } from '../shared/schemas';
import { hashPassword } from './crypto';
import type { UserRow } from './env';

export function requirePhone(raw: string, country: string): string {
  const phone = normalizePhone(raw, country);
  if (!phone) throw new HTTPException(400, { message: 'Enter a valid phone number' });
  return phone;
}

/** Throws 409 naming the first field already used by another account. */
export async function assertUnique(
  db: D1Database,
  fields: { username?: string; email?: string; phone?: string },
  exceptId = '',
): Promise<void> {
  const checks: [keyof typeof fields, string][] = [
    ['username', 'That username is taken'],
    ['email', 'That email is already registered'],
    ['phone', 'That phone number is already registered'],
  ];
  for (const [field, message] of checks) {
    const value = fields[field];
    if (value === undefined) continue;
    const hit = await db
      .prepare(`SELECT id FROM users WHERE ${field} = ? AND id != ?`)
      .bind(value, exceptId)
      .first();
    if (hit) throw new HTTPException(409, { message });
  }
}

export interface NewUser {
  username: string;
  email: string;
  phone: string;
  password: string;
  displayName?: string;
  role?: 'user' | 'admin';
}

export async function insertUser(db: D1Database, input: NewUser): Promise<UserRow> {
  await assertUnique(db, input);
  const now = Date.now();
  const row: UserRow = {
    id: crypto.randomUUID(),
    username: input.username,
    email: input.email.toLowerCase(),
    phone: input.phone,
    password_hash: await hashPassword(input.password),
    display_name: input.displayName ?? '',
    welcomed: 0,
    role: input.role ?? 'user',
    status: 'active',
    last_day: 1,
    created_at: now,
    updated_at: now,
    last_login_at: null,
  };
  try {
    await db
      .prepare(
        `INSERT INTO users (id, username, email, phone, password_hash, display_name, welcomed, role, status,
                            last_day, created_at, updated_at, last_login_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        row.id, row.username, row.email, row.phone, row.password_hash, row.display_name, row.welcomed,
        row.role, row.status, row.last_day, row.created_at, row.updated_at, row.last_login_at,
      )
      .run();
  } catch (e) {
    // Lost a race with a concurrent sign-up for the same username/email/phone.
    if (String(e).includes('UNIQUE')) throw new HTTPException(409, { message: 'That account already exists' });
    throw e;
  }
  return row;
}

export async function audit(
  db: D1Database,
  adminId: string,
  action: string,
  targetUserId: string | null,
  meta?: Record<string, unknown>,
): Promise<void> {
  await db
    .prepare('INSERT INTO audit_log (admin_id, action, target_user_id, meta, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(adminId, action, targetUserId, meta ? JSON.stringify(meta) : null, Date.now())
    .run();
}
