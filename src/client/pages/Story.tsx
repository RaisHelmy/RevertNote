import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { STORY_ROWS, type Story as StoryData } from '../../shared/schemas';
import { AUTHOR, BOOK_TITLE } from '../content/book';
import { api } from '../lib/api';
import '../styles/book.css';

type Field = keyof StoryData['fields'];
type Save = 'idle' | 'saving' | 'saved' | 'error';

const EMPTY: StoryData = { fields: {}, growthPlan: [], ramadanGoals: [] };

export function Story() {
  const [story, setStory] = useState<StoryData>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [save, setSave] = useState<Save>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    document.title = 'My Shahadah Story — Welcome Home';
    api<{ story: StoryData }>('/me/story')
      .then((r) => setStory(r.story))
      .catch(() => setSave('error'))
      .finally(() => setLoaded(true));
  }, []);

  function update(next: StoryData) {
    setStory(next);
    setSave('saving');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      api('/me/story', { method: 'PUT', json: next })
        .then(() => setSave('saved'))
        .catch(() => setSave('error'));
    }, 700);
  }

  const field = (k: Field) => ({
    value: story.fields[k] ?? '',
    onChange: (e: { target: { value: string } }) => update({ ...story, fields: { ...story.fields, [k]: e.target.value } }),
    disabled: !loaded,
  });

  const row = (list: 'growthPlan' | 'ramadanGoals', i: number) => ({
    value: story[list][i] ?? '',
    onChange: (e: { target: { value: string } }) => {
      const arr = Array.from({ length: STORY_ROWS }, (_, j) => story[list][j] ?? '');
      arr[i] = e.target.value;
      update({ ...story, [list]: arr });
    },
    disabled: !loaded,
    'aria-label': `${list === 'growthPlan' ? '90-day growth plan' : 'First Ramadan goal'} ${i + 1}`,
  });

  return (
    <div className="bk-page">
      <header className="bk-top">
        <Link to="/journal">← Back to journal</Link>
        <span className={`bk-save bk-save-${save}`} role="status">
          {save === 'saving' ? 'Saving…' : save === 'saved' ? 'Saved' : save === 'error' ? 'Could not save' : ''}
        </span>
      </header>
      <main className="bk-main">
        <p className="bk-eyebrow">After the 40 days</p>
        <h1>My Shahadah Story</h1>

        <section className="bk-card">
          <div className="bk-row2">
            <label>
              My legal name is
              <input {...field('legalName')} maxLength={200} />
            </label>
            <label>
              and my Muslim name is
              <input {...field('muslimName')} maxLength={200} />
            </label>
          </div>
          <label>
            Who was I before Islam, and who am I becoming now?
            <textarea {...field('becoming')} rows={4} />
          </label>
          <label>
            I decided to embrace Islam because…
            <textarea {...field('why')} rows={4} />
          </label>
          <label>
            The people Allah sent to help me
            <textarea {...field('people')} rows={3} />
          </label>
          <div className="bk-row2">
            <label>
              My du’a list
              <textarea {...field('duaList')} rows={5} />
            </label>
            <label>
              My gratitude list
              <textarea {...field('gratitudeList')} rows={5} />
            </label>
          </div>
        </section>

        <section className="bk-card bk-letter">
          <h2>Dear Future Me,</h2>
          <p>Today marks my 40th day as a Muslim.</p>
          <label>
            The biggest thing I learned about Allah is:
            <textarea {...field('learned')} rows={3} />
          </label>
          <label>
            The biggest challenge I overcame is:
            <textarea {...field('challenge')} rows={3} />
          </label>
          <label>
            My specific du’a for the next year is:
            <textarea {...field('dua')} rows={2} />
          </label>
          <p className="bk-sign">In shaa Allah 🤲</p>
        </section>

        <section className="bk-card">
          <table className="bk-table">
            <thead>
              <tr>
                <th>My personal 90-day growth plan</th>
                <th>My first Ramadan goals</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: STORY_ROWS }, (_, i) => (
                <tr key={i}>
                  <td><input {...row('growthPlan', i)} maxLength={500} /></td>
                  <td><input {...row('ramadanGoals', i)} maxLength={500} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="bk-credit">
          From <em>{BOOK_TITLE}</em> by {AUTHOR}.
        </p>
      </main>
    </div>
  );
}
