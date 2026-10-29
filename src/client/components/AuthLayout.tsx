import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Lamp } from './Lamp';

export function AuthLayout({ title, lede, children }: { title: string; lede: string; children: ReactNode }) {
  return (
    <div className="welcome auth-screen">
      <Link to="/" className="auth-home">
        ← Welcome Home
      </Link>
      <div className="welcome-card auth-card">
        <div className="w-bismillah" lang="ar" dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
        <div className="w-lamp" aria-hidden="true">
          <Lamp variant="welcome" />
        </div>
        <h2>{title}</h2>
        <p className="w-lede">{lede}</p>
        {children}
      </div>
    </div>
  );
}
