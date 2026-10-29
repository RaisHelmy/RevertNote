import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { PublicUser } from '../../shared/schemas';
import { AuthLayout } from '../components/AuthLayout';
import { DEFAULT_COUNTRY, PhoneField } from '../components/PhoneField';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export function SignUp() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    phoneCountry: DEFAULT_COUNTRY,
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { confirm: _confirm, ...payload } = form;
      const r = await api<{ user: PublicUser }>('/auth/signup', { method: 'POST', json: payload });
      setUser(r.user);
      navigate('/journal', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Welcome home." lede="Create your private 40-day journal.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          autoComplete="username"
          value={form.username}
          onChange={(e) => set('username')(e.target.value)}
          required
          autoFocus
        />
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => set('email')(e.target.value)}
          required
        />
        <label htmlFor="phone">Phone number</label>
        <PhoneField
          id="phone"
          country={form.phoneCountry}
          phone={form.phone}
          onCountry={set('phoneCountry')}
          onPhone={set('phone')}
          required
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={form.password}
          onChange={(e) => set('password')(e.target.value)}
          required
        />
        <label htmlFor="confirm">Confirm password</label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={(e) => set('confirm')(e.target.value)}
          required
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create my journal'}
        </button>
      </form>
      <p className="w-foot">
        Already have a journal? <Link to="/signin">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
