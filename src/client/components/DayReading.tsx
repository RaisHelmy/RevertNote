import { Link } from 'react-router';
import { DAY_BOOK, FATIHAH, SHAHADA, type DayExtra } from '../content/book';
import '../styles/reading.css';

function Extra({ x }: { x: DayExtra }) {
  switch (x.kind) {
    case 'shahada':
      return (
        <figure className="rd-shahada">
          <figcaption>The Shahada</figcaption>
          <table>
            <tbody>
              {SHAHADA.map((l) => (
                <tr key={l.en}>
                  <td lang="ar" dir="rtl">{l.ar}</td>
                  <td>{l.en}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      );
    case 'callout':
      return (
        <aside className="rd-callout">
          {x.arabic && <p className="rd-ar" lang="ar" dir="rtl">{x.arabic}</p>}
          <p className="rd-callout-title">{x.title}</p>
          <p className="rd-callout-meaning">{x.meaning}</p>
        </aside>
      );
    case 'fatihah':
      return (
        <figure className="rd-fatihah">
          <figcaption>Surah Al-Fatihah</figcaption>
          <ol>
            {FATIHAH.map(([tr, en]) => (
              <li key={tr}>
                <span className="rd-tr">{tr}</span>
                <span className="rd-en">{en}</span>
              </li>
            ))}
          </ol>
        </figure>
      );
    case 'steps':
      return (
        <figure className="rd-steps">
          <figcaption>{x.title}</figcaption>
          <ol>
            {x.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </figure>
      );
    case 'guide':
      return (
        <p className="rd-guide">
          <Link to={`/guides?g=${x.id}`}>{x.label} →</Link>
        </p>
      );
  }
}

/** The book's text for one day, with its special blocks and resource links. */
export function DayReading({ day }: { day: number }) {
  const b = DAY_BOOK[day];
  if (!b) return null;
  return (
    <section className="reading" aria-label="Today’s reading">
      {b.body.map((p) => (
        <p key={p}>{p}</p>
      ))}
      {b.extras?.map((x, i) => <Extra key={i} x={x} />)}
      {b.links && (
        <ul className="rd-links">
          {b.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} target="_blank" rel="noopener noreferrer">
                {l.label} ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
