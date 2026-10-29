export interface Env {
  DB: D1Database;
  AUTH_LIMITER: RateLimit;
  ASSETS: Fetcher;
  ADMIN_BOOTSTRAP_EMAIL?: string;
}

export interface UserRow {
  id: string;
  username: string;
  email: string;
  phone: string;
  password_hash: string;
  display_name: string;
  welcomed: number;
  role: 'user' | 'admin';
  status: 'active' | 'disabled';
  last_day: number;
  created_at: number;
  updated_at: number;
  last_login_at: number | null;
}

export type AppEnv = {
  Bindings: Env;
  Variables: { user: UserRow; sessionId: string };
};
