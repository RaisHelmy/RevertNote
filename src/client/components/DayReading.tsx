import { Fragment } from 'react';
import { Link } from 'react-router';
import { DAY_BOOK, FATIHAH, SHAHADA, type DayExtra } from '../content/book';
import '../styles/reading.css';

const guideHref = (query: string, day: number) => `/guides?${query}&from=${day}`;

/** Renders a paragraph, turning `[[label|g=salah&flow=two]]` into guide links. */
function Para({ text, day }: { text: string; day: number }) {
  const parts = text.split(/\[\[([^|\]]+)\|([^\]]+)\]\]/);
  return (
    <p>
      {parts.map((s, i) =>
        i % 3 === 1 ? (
          <Link key={i} className="rd-inline" to={guideHref(parts[i + 1]!, day)}>
            {s}
          </Link>
        ) : i % 3 === 2 ? null : (
          <Fragment key={i}>{s}</Fragment>
        ),
      )}
    </p>
  );
}

const PRAY_LINKS = [
  { q: 'g=wudu', label: 'Wudu', sub: 'Start here' },
  { q: 'g=salah&flow=two', label: 'Fajr', sub: '2 rak’ah' },
  { q: 'g=salah&flow=three', label: 'Maghrib', sub: '3 rak’ah' },
  { q: 'g=salah&flow=four', label: 'Dhuhr · Asr · Isha', sub: '4 rak’ah' },
];

function PrayCard({ day }: { day: number }) {
  return (
    <aside className="rd-pray" aria-labelledby={`pray-${day}`}>
      <p className="rd-pray-title" id={`pray-${day}`}>
        Ready to pray?
      </p>
      <p className="rd-pray-sub">Make wudu first, then follow the steps for the prayer you are about to pray.</p>
      <div className="rd-pray-links">
        {PRAY_LINKS.map((l) => (
          <Link key={l.q} to={guideHref(l.q, day)}>
            <strong>{l.label}</strong>
            <span>{l.sub}</span>
          </Link>
        ))}
      </div>
      <p className="rd-pray-ghusl">
        Need a full ritual bath first? <Link to={guideHref('g=ghusl', day)}>See the Ghusl guide →</Link>
      </p>
    </aside>
  );
}

function Extra({ x, day }: { x: DayExtra; day: number }) {
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
        <p className={x.primary ? 'rd-guide rd-guide-primary' : 'rd-guide'}>
          <Link to={guideHref(`g=${x.id}${x.flow ? `&flow=${x.flow}` : ''}`, day)}>{x.label} →</Link>
        </p>
      );
    case 'pray':
      return <PrayCard day={day} />;
  }
}

/** The book's text for one day, with its special blocks and resource links. */
export function DayReading({ day }: { day: number }) {
  const b = DAY_BOOK[day];
  if (!b) return null;
  return (
    <section className="reading" aria-label="Today’s reading">
      {b.body.map((p) => (
        <Para key={p} text={p} day={day} />
      ))}
      {b.extras?.map((x, i) => <Extra key={i} x={x} day={day} />)}
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
