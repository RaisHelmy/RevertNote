import { useEffect } from 'react';
import { Link } from 'react-router';
import {
  ABOUT_AUTHOR,
  ACKNOWLEDGMENT,
  AUTHOR,
  BOOK_TITLE,
  CHOSEN,
  FOREWORD,
  INTRODUCTION,
  PUBLISHER,
  REFERENCES,
} from '../content/book';
import { useAuth } from '../lib/auth';
import '../styles/book.css';

const SECTIONS = [
  { id: 'foreword', title: 'Foreword', by: `by ${PUBLISHER}`, body: FOREWORD },
  { id: 'acknowledgment', title: 'Acknowledgment', by: `by ${AUTHOR}`, body: ACKNOWLEDGMENT },
  { id: 'introduction', title: 'Introduction: Welcome Home', by: '', body: INTRODUCTION },
  { id: 'chosen', title: 'You Have Been Chosen', by: '', body: CHOSEN },
];

export function Book() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'The book — Welcome Home';
    if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bk-page">
      <header className="bk-top">
        <Link to={user ? '/journal' : '/'}>← {user ? 'Back to journal' : 'Home'}</Link>
      </header>
      <main className="bk-main">
        <p className="bk-eyebrow">The book</p>
        <h1>{BOOK_TITLE}</h1>
        <p className="bk-byline">
          Written by <strong>{AUTHOR}</strong>
          <br />
          Published and managed by {PUBLISHER}
        </p>

        <nav className="bk-toc" aria-label="Contents">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>{s.title}</a>
          ))}
          <a href="#author">About the Author</a>
          <a href="#references">References</a>
        </nav>

        {SECTIONS.map((s) => (
          <section className="bk-card bk-prose" id={s.id} key={s.id}>
            <h2>{s.title}</h2>
            {s.by && <p className="bk-by">{s.by}</p>}
            {s.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        ))}

        <section className="bk-card bk-prose" id="author">
          <h2>About the Author</h2>
          <p>{ABOUT_AUTHOR}</p>
        </section>

        <section className="bk-card bk-prose" id="references">
          <h2>References</h2>
          <ul>
            {REFERENCES.map((r) => (
              <li key={r.href}>
                <a href={r.href} target="_blank" rel="noopener noreferrer">{r.label} ↗</a>
              </li>
            ))}
          </ul>
        </section>

        <p className="bk-credit">
          {BOOK_TITLE} © {AUTHOR}. Published by {PUBLISHER}.
        </p>
      </main>
    </div>
  );
}
