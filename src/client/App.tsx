import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from './lib/auth';
import { AdminLayout } from './pages/admin/AdminLayout';
import { CreateUser } from './pages/admin/CreateUser';
import { UserDetail } from './pages/admin/UserDetail';
import { Users } from './pages/admin/Users';
import { Guides } from './pages/Guides';
import { Book } from './pages/Book';
import { Journal } from './pages/Journal';
import { Landing } from './pages/Landing';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Story } from './pages/Story';

function Gate({ need, children }: { need: 'guest' | 'user' | 'admin'; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="boot" aria-busy="true" />;
  if (need === 'guest') return user ? <Navigate to="/journal" replace /> : children;
  if (!user) return <Navigate to="/signin" replace />;
  if (need === 'admin' && user.role !== 'admin') return <Navigate to="/journal" replace />;
  return children;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signin" element={<Gate need="guest"><SignIn /></Gate>} />
          <Route path="/signup" element={<Gate need="guest"><SignUp /></Gate>} />
          <Route path="/" element={<Landing />} />
          <Route path="/journal" element={<Gate need="user"><Journal /></Gate>} />
          <Route path="/guides" element={<Gate need="user"><Guides /></Gate>} />
          <Route path="/story" element={<Gate need="user"><Story /></Gate>} />
          <Route path="/book" element={<Book />} />
          <Route path="/admin" element={<Gate need="admin"><AdminLayout /></Gate>}>
            <Route index element={<Users />} />
            <Route path="users/new" element={<CreateUser />} />
            <Route path="users/:id" element={<UserDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
