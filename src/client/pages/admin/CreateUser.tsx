import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import type { PublicUser } from '../../../shared/schemas';
import { DEFAULT_COUNTRY, PhoneField } from '../../components/PhoneField';
import { api } from '../../lib/api';

export function CreateUser() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    phoneCountry: DEFAULT_COUNTRY,
    password: '',
    displayName: '',
    role: 'user',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api<{ user: PublicUser }>('/admin/users', { method: 'POST', json: form });
      navigate(`/admin/users/${r.user.id}`, { state: { created: true } });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <div className="admin-head">
        <h1>Create user</h1>
      </div>
      <form className="admin-card admin-form" onSubmit={submit} noValidate>
        <label>
          Username
          <input value={form.username} onChange={(e) => set('username')(e.target.value)} required />
        </label>
        <label>
          Display name
          <input value={form.displayName} onChange={(e) => set('displayName')(e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} required />
        </label>
        <label htmlFor="new-phone">
          Phone
          <PhoneField
            id="new-phone"
            country={form.phoneCountry}
            phone={form.phone}
            onCountry={set('phoneCountry')}
            onPhone={set('phone')}
            required
          />
        </label>
        <label>
          Password
          <input
            type="text"
            autoComplete="off"
            minLength={8}
            value={form.password}
            onChange={(e) => set('password')(e.target.value)}
            required
          />
        </label>
        <label>
          Role
          <select value={form.role} onChange={(e) => set('role')(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="admin-actions">
          <button className="btn-primary btn-inline" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </form>
    </>
  );
}
