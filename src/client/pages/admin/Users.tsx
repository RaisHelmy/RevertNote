import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { AdminUserRow } from '../../../shared/schemas';
import { api } from '../../lib/api';
import { fmtDate } from './AdminLayout';

interface ListResponse {
  users: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
}

export function Users() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const page = Number(params.get('page')) || 1;
  const [search, setSearch] = useState(q);
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api<ListResponse>(`/admin/users?q=${encodeURIComponent(q)}&page=${page}`)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [q, page]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <div className="admin-head">
        <h1>Users</h1>
        {data && <span className="muted">{data.total} total</span>}
        <span className="admin-spacer" />
        <form
          className="admin-search"
          onSubmit={(e) => {
            e.preventDefault();
            setParams(search ? { q: search } : {});
          }}
        >
          <input
            type="search"
            placeholder="Search username, email, phone, name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="ghost-btn" type="submit">
            Search
          </button>
        </form>
        <Link className="btn-primary btn-inline" to="/admin/users/new">
          Create user
        </Link>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Days lit</th>
              <th>Joined</th>
              <th>Last sign-in</th>
            </tr>
          </thead>
          <tbody>
            {data?.users.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link to={`/admin/users/${u.id}`}>@{u.username}</Link>
                  {u.displayName && <div className="muted">{u.displayName}</div>}
                </td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td>
                  <span className={`pill pill-${u.role}`}>{u.role}</span>
                </td>
                <td>
                  <span className={`pill pill-${u.status}`}>{u.status}</span>
                </td>
                <td>{u.daysLit} / 40</td>
                <td>{fmtDate(u.createdAt)}</td>
                <td>{fmtDate(u.lastLoginAt)}</td>
              </tr>
            ))}
            {data && !data.users.length && (
              <tr>
                <td colSpan={8} className="muted">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="admin-pager">
          <button
            className="ghost-btn"
            disabled={page <= 1}
            onClick={() => setParams({ ...(q && { q }), page: String(page - 1) })}
          >
            Previous
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button
            className="ghost-btn"
            disabled={page >= pages}
            onClick={() => setParams({ ...(q && { q }), page: String(page + 1) })}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
