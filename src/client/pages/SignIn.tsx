import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { PublicUser } from '../../shared/schemas';
import { AuthLayout } from '../components/AuthLayout';
import { DEFAULT_COUNTRY } from '../components/PhoneField';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export function SignIn() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api<{ user: PublicUser }>('/auth/signin', {
        method: 'POST',
        json: { identifier, password, phoneCountry: DEFAULT_COUNTRY },
      });
      setUser(r.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Welcome back." lede="Sign in to return to your journal.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <label htmlFor="identifier">Username, email or phone</label>
        <input
          id="identifier"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          autoFocus
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="w-foot">
        New here? <Link to="/signup">Create your journal</Link>
      </p>
    </AuthLayout>
  );
}
