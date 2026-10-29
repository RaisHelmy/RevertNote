import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';
import { sameOrigin } from './auth';
import type { AppEnv } from './env';
import { adminRoutes } from './routes/admin';
import { authRoutes } from './routes/auth';
import { meRoutes } from './routes/me';

const app = new Hono<AppEnv>().basePath('/api');

app.use(secureHeaders());
app.use(sameOrigin);
// Backups carry up to 40 sketches; everything else is far smaller.
app.use(bodyLimit({ maxSize: 64 * 1024 * 1024, onError: (c) => c.json({ error: 'Request is too large' }, 413) }));
app.use(async (c, next) => {
  await next();
  c.header('Cache-Control', 'no-store');
});

app.route('/auth', authRoutes);
app.route('/me', meRoutes);
app.route('/admin', adminRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
  console.error(err);
  return c.json({ error: 'Something went wrong' }, 500);
});

export default app;
