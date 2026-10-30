import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  GUIDES,
  SALAH_FLOWS,
  type Guide,
  type GuideStep,
  type SalahFlow,
  type SalahSay,
} from '../content/guides';
import { Lamp } from '../components/Lamp';
import { Icon } from '../components/Icon';
import { useAuth } from '../lib/auth';
import '../styles/guides.css';

const BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

function StepPlate({ guide, step }: { guide: Guide; step: GuideStep }) {
  if (step.bismillah || !step.cell) {
    return (
      <div className="g-plate g-plate-bismillah" lang="ar" dir="rtl">
        <span>{BISMILLAH}</span>
      </div>
    );
  }
  return (
    <div className="g-plate" data-guide={guide.id} data-row={step.cell.row} data-col={step.cell.col}>
      <img src={guide.sheet} alt="" loading="lazy" decoding="async" />
    </div>
  );
}

function SayLine({ say, lead }: { say: SalahSay; lead?: string }) {
  return (
    <p className="mv-say">
      {say.ar && (
        <span className="mv-ar" lang="ar" dir="rtl">
          {say.ar}
        </span>
      )}
      <span className="mv-tr">
        {lead && <em>{lead} </em>}
        {say.tr}
      </span>
      <span className="mv-en">{say.en}</span>
    </p>
  );
}

const SALAH_PLAYLIST = 'PL6ExH-FBPXTRMRJaUfcmXYznH5yC6d-r8';

function SalahFlowView({ sheet, flow, onFlow }: { sheet: string; flow: SalahFlow; onFlow: (id: SalahFlow['id']) => void }) {
  return (
    <div className="salah-flow">
      <div className="salah-switch" role="group" aria-label="Choose how many rakʿah">
        {SALAH_FLOWS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="sf-chip"
            aria-pressed={f.id === flow.id}
            onClick={() => onFlow(f.id)}
          >
            <b>{f.rakaatLabel}</b>
            <small>{f.prayers}</small>
          </button>
        ))}
      </div>

      <p className="salah-loop">
        One rakʿah is a single cycle: <b>stand</b>, <b>bow</b>, then <b>prostrate twice</b>. Every prayer below is that
        cycle repeated — the only things that change are how many times you repeat it and where you sit.
      </p>

      <p className="salah-note">{flow.note}</p>

      <figure className="salah-video">
        <div className="sv-frame">
          <iframe
            key={flow.video.id}
            src={`https://www.youtube-nocookie.com/embed/${flow.video.id}?rel=0&list=${SALAH_PLAYLIST}`}
            title={flow.video.title}
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <figcaption>
          Watch: {flow.video.title} ·{' '}
          <a href={`https://www.youtube.com/playlist?list=${SALAH_PLAYLIST}`} target="_blank" rel="noopener noreferrer">
            Full playlist ↗
          </a>
        </figcaption>
      </figure>

      <ol className="rakaats">
        {flow.rakaat.map((r) => (
          <li className="rakaat" key={r.n}>
            <header className="rakaat-head">
              <span className="rk-num" aria-hidden="true">
                {r.n}
              </span>
              <h3>Rakʿah {r.n}</h3>
              <span className="rk-tag">{r.recite}</span>
            </header>
            <ol className="moves">
              {r.moves.map((m) => (
                <li className={'move' + (m.tone ? ` move-${m.tone}` : '')} key={m.title}>
                  <div className="g-plate move-plate" data-guide="salah" data-row={m.cell.row} data-col={m.cell.col}>
                    <img src={sheet} alt="" loading="lazy" decoding="async" />
                  </div>
                  <div className="move-body">
                    <h4>{m.title}</h4>
                    <p className="mv-detail">{m.detail}</p>
                    {m.say && <SayLine say={m.say} />}
                    {m.then && <SayLine say={m.then} lead="then reply:" />}
                  </div>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Guides() {
  const { user } = useAuth();
  // Deep links from the journal: ?g=<guide>&flow=<salah flow>&from=<day>
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const [activeId, setActiveId] = useState<Guide['id']>(() => {
    const g = params.get('g');
    return GUIDES.some((x) => x.id === g) ? (g as Guide['id']) : 'wudu';
  });
  const [flowId, setFlowId] = useState<SalahFlow['id']>(() => {
    const f = params.get('flow');
    return SALAH_FLOWS.some((x) => x.id === f) ? (f as SalahFlow['id']) : 'two';
  });
  const fromDay = Number(params.get('from')) || 0;
  const backLabel = fromDay >= 1 && fromDay <= 40 ? `Back to Day ${fromDay}` : 'My journal';
  const [lightbox, setLightbox] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const guide = GUIDES.find((g) => g.id === activeId) ?? GUIDES[0]!;
  const flow = SALAH_FLOWS.find((f) => f.id === flowId) ?? SALAH_FLOWS[0]!;
  const steps = guide.steps ?? [];

  useEffect(() => {
    document.title = 'Prayer guide · Wudu, salah & ghusl — RevertNote';
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('lock', lightbox);
    return () => document.body.classList.remove('lock');
  }, [lightbox]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLightbox(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightbox]);

  function selectGuide(id: Guide['id'], focus = false) {
    setActiveId(id);
    if (focus) tabRefs.current[GUIDES.findIndex((g) => g.id === id)]?.focus();
  }

  function onTabsKey(e: React.KeyboardEvent) {
    const i = GUIDES.findIndex((g) => g.id === activeId);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      selectGuide(GUIDES[(i + 1) % GUIDES.length]!.id, true);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      selectGuide(GUIDES[(i - 1 + GUIDES.length) % GUIDES.length]!.id, true);
    }
  }

  return (
    <div className="guide-page">
      <header className="guide-top">
        <Link to="/journal" className="guide-back">
          <Icon name="prev" />
          <span>{backLabel}</span>
        </Link>
        <span className="guide-brand">
          RevertNote <i>·</i> Prayer guide
        </span>
        <span className="guide-who">{user?.displayName ? user.displayName : `@${user?.username}`}</span>
      </header>

      <main className="guide-main">
        <section className="guide-hero" aria-labelledby="guideTitle">
          <svg className="guide-arch" viewBox="0 0 860 520" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="guideArchFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1C4C3D" />
                <stop offset=".55" stopColor="#133329" />
                <stop offset="1" stopColor="#0F2C25" />
              </linearGradient>
            </defs>
            <path d="M0 520V190C0 92 190 16 430 0C670 16 860 92 860 190V520Z" fill="url(#guideArchFill)" />
            <path
              d="M16 520V192C16 100 200 26 430 12C660 26 844 100 844 192V520"
              fill="none"
              stroke="#C2A15C"
              strokeOpacity=".45"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="guide-lamp" aria-hidden="true">
            <Lamp variant="welcome" />
          </div>

          <p className="guide-bismillah" lang="ar" dir="rtl">
            {BISMILLAH}
          </p>
          <p className="guide-translit">Bismillāhir-Raḥmānir-Raḥīm</p>
          <p className="guide-translation">In the name of Allah, the Most Gracious, the Most Merciful.</p>

          <div className="guide-title-block">
            <p className="eyebrow">Before you pray</p>
            <h1 id="guideTitle">Prayer guide</h1>
            <p className="guide-lede">
              Wudu, salah and ghusl — the three practices you will return to every day. Learn one step at a time, and
              keep a teacher close.
            </p>
          </div>
        </section>

        <div className="guide-tabs" role="tablist" aria-label="Choose a guide" onKeyDown={onTabsKey}>
          {GUIDES.map((g, i) => (
            <button
              key={g.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${g.id}`}
              aria-selected={g.id === activeId}
              aria-controls={`panel-${g.id}`}
              tabIndex={g.id === activeId ? 0 : -1}
              className="guide-tab"
              onClick={() => selectGuide(g.id)}
            >
              <span className="gt-ar" lang="ar">
                {g.arabic}
              </span>
              <span className="gt-name">{g.name}</span>
              <span className="gt-sub">{g.subtitle}</span>
            </button>
          ))}
        </div>

        <section
          className="guide-panel"
          id={`panel-${guide.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${guide.id}`}
          tabIndex={-1}
          key={guide.id}
        >
          <header className="guide-panel-head">
            <div>
              <p className="eyebrow">
                {guide.id === 'salah' ? `${flow.count} rakʿah · ${flow.prayers}` : `${steps.length} steps · ${guide.subtitle}`}
              </p>
              <h2>
                {guide.name}
                <span lang="ar">{guide.arabic}</span>
              </h2>
            </div>
            <button type="button" className="ghost-btn sheet-btn" onClick={() => setLightbox(true)}>
              <Icon name="guide" />
              <span>View full sheet</span>
            </button>
          </header>
          <p className="guide-intro">{guide.intro}</p>

          {guide.id === 'salah' ? (
            <SalahFlowView sheet={guide.sheet} flow={flow} onFlow={setFlowId} />
          ) : (
            <ol className="guide-steps">
              {steps.map((step, i) => (
                <li className="g-step" key={`${guide.id}-${i}`}>
                  <StepPlate guide={guide} step={step} />
                  <div className="g-step-body">
                    <span className="g-step-no">{String(i + 1).padStart(2, '0')}</span>
                    <h3>{step.title}</h3>
                    <p>{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <aside className="guide-note">
            <span className="guide-note-mark" aria-hidden="true">
              <Icon name="guide" />
            </span>
            <p>
              This guide is a learning aid, not a substitute for a teacher. If you are unsure about any step — or about
              when ghusl is required — ask a qualified teacher or your local mosque.
            </p>
          </aside>
        </section>

        <footer className="guide-foot">
          <p>
            Illustrations from <em>The Concept of Worship in Islam</em>.
            <br />
            Keep learning with a teacher, a mosque, and a circle of friends.
          </p>
          <Link to="/journal" className="ghost-btn">
            <Icon name="prev" />
            <span>{fromDay ? backLabel : 'Back to my journal'}</span>
          </Link>
        </footer>
      </main>

      {lightbox && (
        <div
          className="guide-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${guide.name} illustrated sheet`}
          onClick={() => setLightbox(false)}
        >
          <button type="button" className="lb-close" autoFocus aria-label="Close illustrated sheet" onClick={() => setLightbox(false)}>
            <Icon name="close" />
          </button>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={guide.sheet} alt={guide.sheetAlt} />
            <figcaption>
              <span className="lb-title">
                {guide.name} · {guide.subtitle}
              </span>
              {guide.id === 'wudu' && (
                <span className="lb-note">The blank first panel is the Bismillah — see the calligraphy above.</span>
              )}
              {guide.id === 'salah' && (
                <span className="lb-note">This sheet is one rakʿah. Repeat it 2, 3 or 4 times — see the flow above.</span>
              )}
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
