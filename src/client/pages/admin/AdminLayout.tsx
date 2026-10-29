import { Link, NavLink, Outlet } from 'react-router';
import { useAuth } from '../../lib/auth';

export function AdminLayout() {
  const { user, signOut } = useAuth();
  return (
    <div className="admin">
      <header className="admin-bar">
        <Link to="/admin" className="admin-brand">
          Welcome Home <span>Admin</span>
        </Link>
        <nav>
          <NavLink to="/admin" end>
            Users
          </NavLink>
          <NavLink to="/admin/users/new">Create user</NavLink>
          <Link to="/journal">My journal</Link>
        </nav>
        <span className="admin-spacer" />
        <span className="admin-who">@{user?.username}</span>
        <button className="ghost-btn" onClick={() => void signOut()}>
          Sign out
        </button>
      </header>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export function fmtDate(ms: number | null | undefined) {
  if (!ms) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms));
}
