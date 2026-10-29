# Welcome Home — 40-Day Journal (SaaS)

A private 40-day journal for new Muslims, with accounts and an admin panel. It started as the single-file
`welcome-home-journal.html` and is now a React app with a Cloudflare Worker API and a D1 database.

**Stack:** Bun (tooling) · React 19 + TypeScript + Vite · Hono on Cloudflare Workers (static assets + API in one
Worker) · Cloudflare D1.

## Features

- **Sign up** with username, email, phone (country picker, Malaysia by default) and password. There is no email
  or phone verification. **Sign in** with username, email *or* phone.
- **Journal:** 40 days of prompts and verses, a written note and a drawing per day, autosave, progress
  ("days lit"), print a day, back up / restore (same JSON format as the original offline journal).
- **Migrating from the offline journal:** if the browser still holds notes from the old HTML version
  (`localStorage` `wwh.*`), the user is offered a one-click import into their account.
- **Admin** (`/admin`): search and list users, view any user's profile and full journal (text and drawings),
  create users, edit username / email / phone / name / role / status, reset a password (typed or generated),
  sign a user out everywhere, delete a user. Every admin action is written to an audit log.

## Security notes

- Passwords: PBKDF2-SHA256, 100k iterations (the Workers maximum), per-user salt.
- Sessions: random 32-byte token in an `HttpOnly; Secure; SameSite=Lax` cookie; only its SHA-256 is stored.
  30-day sliding expiry. Password reset, password change and disabling an account revoke all sessions.
- Writes from another origin are rejected; sign-in / sign-up are rate limited per IP.
- An admin cannot demote, disable or delete themselves, and the last active admin cannot be removed.

## Local development

```bash
bun install
cp .dev.vars.example .dev.vars          # sets ADMIN_BOOTSTRAP_EMAIL
bun run db:migrate:local                # creates the local D1 database
bun run dev                             # http://localhost:5173
```

Sign up with the email in `.dev.vars` to get an admin account.

```bash
bun run typecheck
bun test
```

## Deploying to Cloudflare

```bash
bunx wrangler login
bunx wrangler d1 create revertnote --location apac
```

Copy the `database_id` it prints into `wrangler.jsonc` under `d1_databases`, then:

```bash
bun run db:migrate:remote
bunx wrangler secret put ADMIN_BOOTSTRAP_EMAIL      # the email that becomes the first admin
bun run deploy
```

The app is served at `https://revertnote.<your-subdomain>.workers.dev`. A custom domain can be added later under
the Worker's **Settings → Domains & Routes**.

Once the first admin exists, more admins can be promoted from the admin panel, so the bootstrap secret can be
removed (`bunx wrangler secret delete ADMIN_BOOTSTRAP_EMAIL`).

## Layout

```
migrations/           D1 schema
src/worker/           Hono API (auth, journal entries, admin)
src/shared/           zod schemas and types shared by client and worker
src/client/           React app (journal, sign in/up, admin)
test/                 bun unit tests
```
