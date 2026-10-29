import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import type { Entry, EntryMeta, PublicUser } from '../../../shared/schemas';
import { DAYS, pad2 } from '../../content/days';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtDate } from './AdminLayout';

interface Detail {
  user: PublicUser;
  entries: EntryMeta[];
  sessions: { createdAt: number; expiresAt: number; userAgent: string | null }[];
  audit: { action: string; meta: unknown; createdAt: number; admin: string | null }[];
}

export function UserDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: me } = useAuth();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState((location.state as { created?: boolean } | null)?.created ? 'User created.' : '');

  const load = useCallback(() => {
    api<Detail>(`/admin/users/${id}`)
      .then(setDetail)
      .catch((e: Error) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);

  if (error && !detail) return <p className="form-error">{error}</p>;
  if (!detail) return <p className="muted">Loading…</p>;

  const isSelf = me?.id === detail.user.id;

  async function signOutAll() {
    if (!window.confirm(`Sign @${detail!.user.username} out of every device?`)) return;
    try {
      await api(`/admin/users/${id}/signout-all`, { method: 'POST' });
      setNotice('Signed out everywhere.');
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove() {
    const name = detail!.user.username;
    if (window.prompt(`This permanently deletes @${name} and their whole journal.\n\nType the username to confirm:`) !== name) {
      return;
    }
    try {
      await api(`/admin/users/${id}`, { method: 'DELETE' });
      navigate('/admin', { replace: true });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <div className="admin-head">
        <h1>@{detail.user.username}</h1>
        <span className={`pill pill-${detail.user.role}`}>{detail.user.role}</span>
        <span className={`pill pill-${detail.user.status}`}>{detail.user.status}</span>
      </div>
      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}
      {error && <p className="form-error">{error}</p>}

      <div className="admin-grid">
        <EditUser
          user={detail.user}
          isSelf={isSelf}
          onSaved={(u) => {
            setDetail({ ...detail, user: u });
            setNotice('Changes saved.');
            setError('');
            load();
          }}
        />
        <div className="admin-col">
          <ResetPassword userId={detail.user.id} username={detail.user.username} onDone={load} />
          <section className="admin-card">
            <h2>Account</h2>
            <dl className="kv">
              <dt>Joined</dt>
              <dd>{fmtDate(detail.user.createdAt)}</dd>
              <dt>Last sign-in</dt>
              <dd>{fmtDate(detail.user.lastLoginAt)}</dd>
              <dt>Last updated</dt>
              <dd>{fmtDate(detail.user.updatedAt)}</dd>
              <dt>Current day</dt>
              <dd>Day {pad2(detail.user.lastDay)}</dd>
            </dl>
            <h3>Active sessions ({detail.sessions.length})</h3>
            <ul className="sessions">
              {detail.sessions.map((s, i) => (
                <li key={i}>
                  <span>{fmtDate(s.createdAt)}</span>
                  <span className="muted ua">{s.userAgent || 'Unknown device'}</span>
                </li>
              ))}
            </ul>
            <div className="admin-actions">
              <button className="ghost-btn" disabled={!detail.sessions.length} onClick={signOutAll}>
                Sign out everywhere
              </button>
              {!isSelf && (
                <button className="ghost-btn danger" onClick={remove}>
                  Delete user
                </button>
              )}
            </div>
          </section>
        </div>
      </div>

      <JournalViewer userId={detail.user.id} entries={detail.entries} />

      {detail.audit.length > 0 && (
        <section className="admin-card">
          <h2>Admin activity</h2>
          <ul className="audit">
            {detail.audit.map((a, i) => (
              <li key={i}>
                <span className="muted">{fmtDate(a.createdAt)}</span> <b>{a.action}</b> by @{a.admin ?? 'deleted'}
                {a.meta != null && <code>{JSON.stringify(a.meta)}</code>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function EditUser({ user, isSelf, onSaved }: { user: PublicUser; isSelf: boolean; onSaved: (u: PublicUser) => void }) {
  const initial = {
    username: user.username,
    email: user.email,
    phone: user.phone,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
  };
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setForm(initial), [user]);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const changes = Object.fromEntries(
      Object.entries(form).filter(([k, v]) => v !== initial[k as keyof typeof initial]),
    );
    if (!Object.keys(changes).length) return;
    setBusy(true);
    setError('');
    try {
      const r = await api<{ user: PublicUser }>(`/admin/users/${user.id}`, {
        method: 'PATCH',
        json: { ...changes, phoneCountry: 'MY' },
      });
      onSaved(r.user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-card admin-form" onSubmit={submit} noValidate>
      <h2>Profile</h2>
      <label>
        Username
        <input value={form.username} onChange={(e) => set('username')(e.target.value)} />
      </label>
      <label>
        Display name
        <input value={form.displayName} onChange={(e) => set('displayName')(e.target.value)} />
      </label>
      <label>
        Email
        <input type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} />
      </label>
      <label>
        Phone <span className="muted">(international format, e.g. +60123456789)</span>
        <input type="tel" value={form.phone} onChange={(e) => set('phone')(e.target.value)} />
      </label>
      <label>
        Role
        <select value={form.role} disabled={isSelf} onChange={(e) => set('role')(e.target.value)}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <label>
        Status
        <select value={form.status} disabled={isSelf} onChange={(e) => set('status')(e.target.value)}>
          <option value="active">Active</option>
          <option value="disabled">Disabled (cannot sign in)</option>
        </select>
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="admin-actions">
        <button className="btn-primary btn-inline" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function ResetPassword({ userId, username, onDone }: { userId: string; username: string; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function reset(generate: boolean) {
    if (!generate && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!window.confirm(`Reset the password for @${username}? They will be signed out of every device.`)) return;
    setBusy(true);
    setError('');
    setResult('');
    try {
      const r = await api<{ password: string | null }>(`/admin/users/${userId}/reset-password`, {
        method: 'POST',
        json: generate ? {} : { password },
      });
      setResult(r.password ?? password);
      setPassword('');
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card admin-form">
      <h2>Reset password</h2>
      <label>
        New password
        <input
          type="text"
          autoComplete="off"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      {result && (
        <p className="form-notice">
          New password for @{username}: <code className="secret">{result}</code>{' '}
          <button type="button" className="btn-quiet" onClick={() => void navigator.clipboard?.writeText(result)}>
            Copy
          </button>
          <br />
          <span className="muted">Share it with the user securely. It will not be shown again.</span>
        </p>
      )}
      <div className="admin-actions">
        <button className="btn-primary btn-inline" disabled={busy} onClick={() => void reset(false)}>
          Set this password
        </button>
        <button className="ghost-btn" disabled={busy} onClick={() => void reset(true)}>
          Generate one for me
        </button>
      </div>
    </section>
  );
}

function JournalViewer({ userId, entries }: { userId: string; entries: EntryMeta[] }) {
  const byDay = new Map(entries.map((e) => [e.day, e]));
  const [open, setOpen] = useState<number | null>(null);
  const [entry, setEntry] = useState<Entry | null>(null);

  useEffect(() => {
    if (open == null) return;
    setEntry(null);
    api<{ entry: Entry }>(`/admin/users/${userId}/entries/${open}`)
      .then((r) => setEntry(r.entry))
      .catch(() => setEntry({ day: open, text: 'Could not load this entry.', sketch: null, hasSketch: false, updatedAt: 0 }));
  }, [open, userId]);

  const written = DAYS.filter((d) => {
    const e = byDay.get(d.n);
    return e && (e.text.trim() || e.hasSketch);
  });

  return (
    <section className="admin-card">
      <h2>Journal ({written.length} of 40 days)</h2>
      {!written.length && <p className="muted">No entries yet.</p>}
      <ul className="journal-list">
        {written.map((d) => {
          const meta = byDay.get(d.n)!;
          const isOpen = open === d.n;
          return (
            <li key={d.n} className={isOpen ? 'open' : ''}>
              <button type="button" className="journal-row" onClick={() => setOpen(isOpen ? null : d.n)}>
                <span className="d-num">{pad2(d.n)}</span>
                <span className="journal-title">{d.t}</span>
                {meta.hasSketch && <span className="pill">drawing</span>}
                <span className="muted">{fmtDate(meta.updatedAt)}</span>
              </button>
              {isOpen && (
                <div className="journal-body">
                  <p className="journal-prompt">{d.p}</p>
                  {!entry ? (
                    <p className="muted">Loading…</p>
                  ) : (
                    <>
                      {entry.text.trim() && <div className="journal-text">{entry.text}</div>}
                      {entry.sketch && <img className="journal-sketch" src={entry.sketch} alt={`Drawing for day ${d.n}`} />}
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
