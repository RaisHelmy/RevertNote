import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import logo from '../assets/hcf-logo.png';
import wuduGuide from '../assets/wudu-original.jpg';
import salahGuide from '../assets/salah-original.jpg';
import ghuslGuide from '../assets/ghusl-original.jpg';
import { DAYS, pad2, WEEK_THEMES, WEEK_WORDS } from '../content/days';
import { useAuth } from '../lib/auth';
import { Sketchpad } from '../lib/sketchpad';
import '../styles/landing.css';

const INKS = [
  { color: '#22302A', label: 'bottle green' },
  { color: '#8F6F33', label: 'antique gold' },
  { color: '#B4633F', label: 'ember' },
];

const LampMark = ({ className, strokeWidth }: { className?: string; strokeWidth: number }) => (
  <svg className={className} viewBox="0 0 64 92" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 0v19" />
      <circle cx="32" cy="22" r="2.6" />
      <path d="M23 30h18l3 6H20z" />
      <path d="M24 36h16c5 4 8 10 8 17 0 12-8 21-16 25-8-4-16-13-16-25 0-7 3-13 8-17z" />
      <path d="M26 78h12l2 5H24z" />
    </g>
    <circle cx="32" cy="55" r="4" fill="currentColor" />
  </svg>
);

export function Landing() {
  const { user } = useAuth();
  const cta = user ? { to: '/journal', label: 'Open my journal' } : { to: '/signup', label: 'Begin Day 01' };

  const [stuck, setStuck] = useState(false);
  const [heroText, setHeroText] = useState('');
  const [day, setDay] = useState(1);
  const [tab, setTab] = useState<'write' | 'draw'>('write');
  const [ink, setInk] = useState(INKS[0]!.color);
  const [padState, setPadState] = useState({ ink: false, undo: 0 });

  const heroRef = useRef<HTMLElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const writeRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<Sketchpad | null>(null);
  const dotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    document.title = 'Welcome Home — A free 40-day, six-week journal for new Muslims';
    const html = document.documentElement;
    html.style.scrollBehavior = 'smooth';
    const onScroll = () => setStuck(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      html.style.scrollBehavior = '';
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // The hero arch grows to reach just below the top of the demo card.
  useEffect(() => {
    const size = () => {
      if (!heroRef.current || !archRef.current || !cardRef.current) return;
      const top = cardRef.current.getBoundingClientRect().top - heroRef.current.getBoundingClientRect().top;
      archRef.current.style.height = Math.round(Math.max(340, top + 40)) + 'px';
    };
    window.addEventListener('resize', size);
    void document.fonts?.ready.then(size);
    size();
    return () => window.removeEventListener('resize', size);
  }, []);

  useEffect(() => {
    const el = writeRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.max(90, Math.min(el.scrollHeight, 260)) + 'px';
  }, [heroText]);

  useEffect(() => {
    const pad = new Sketchpad(canvasRef.current!);
    pad.size = 2.5;
    padRef.current = pad;
    pad.onChange = () => setPadState({ ink: !pad.isEmpty(), undo: pad.undoStack.length });
    return () => pad.destroy();
  }, []);
  useEffect(() => padRef.current?.setColor(ink), [ink]);
  useEffect(() => {
    if (tab === 'draw') requestAnimationFrame(() => padRef.current?.fit());
  }, [tab]);

  useEffect(() => {
    const items = document.querySelectorAll('.landing .reveal');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  function onDotsKey(e: React.KeyboardEvent) {
    const step: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 };
    const i = dotRefs.current.indexOf(document.activeElement as HTMLButtonElement);
    if (i === -1 || (!(e.key in step) && e.key !== 'Home' && e.key !== 'End')) return;
    e.preventDefault();
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? 39 : Math.max(0, Math.min(39, i + step[e.key]!));
    dotRefs.current[next]?.focus();
  }

  function onTabKey(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = tab === 'write' ? 'draw' : 'write';
    setTab(next);
    tabRefs.current[next === 'write' ? 0 : 1]?.focus();
  }

  const lit = heroText.trim().length > 0;
  const active = DAYS[day - 1]!;

  return (
    <div className="landing">
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header className={'nav' + (stuck ? ' stuck' : '')}>
        <a className="brand" href="#top" aria-label="Welcome Home, home">
          <img className="nav-hcf-logo" src={logo} alt="Hidayah Centre Foundation" />
          <LampMark className="brand-mark" strokeWidth={1.4} />
          <span className="brand-word">Welcome Home</span>
        </a>
        <nav className="nav-links" aria-label="Sections">
          <a href="#days">The forty days</a>
          <a href="#modes">Write &amp; draw</a>
          <a href="#privacy">Privacy</a>
          <a href="#resources">Prayer guides</a>
          <a href="#about">About us</a>
          <a href="#questions">Questions</a>
        </nav>
        {!user && (
          <Link className="nav-signin" to="/signin">
            Sign in
          </Link>
        )}
        <Link className="btn btn-gold" to={cta.to}>
          {cta.label}
        </Link>
      </header>

      <main id="main">
        <section className={'hero' + (lit ? ' lit' : '')} id="top" ref={heroRef} aria-labelledby="heroTitle">
          <div className="hero-arch" ref={archRef} aria-hidden="true">
            <svg viewBox="0 0 860 520" preserveAspectRatio="none">
              <defs>
                <linearGradient id="heroArch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#1C4C3D" />
                  <stop offset=".55" stopColor="#133329" />
                  <stop offset="1" stopColor="#0F2C25" />
                </linearGradient>
              </defs>
              <path d="M0 520V190C0 92 190 16 430 0C670 16 860 92 860 190V520Z" fill="url(#heroArch)" />
              <path
                d="M16 520V192C16 100 200 26 430 12C660 26 844 100 844 192V520"
                fill="none"
                stroke="#C2A15C"
                strokeOpacity=".45"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          <div className="hero-lamp" aria-hidden="true">
            <svg viewBox="0 0 64 92">
              <defs>
                <radialGradient id="glowHero" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFE3A6" stopOpacity=".5" />
                  <stop offset="55%" stopColor="#FFD98A" stopOpacity=".14" />
                  <stop offset="100%" stopColor="#FFD98A" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle className="halo" cx="32" cy="54" r="30" fill="url(#glowHero)" />
              <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M32 0v19" />
                <circle cx="32" cy="22" r="2.6" />
                <path d="M23 30h18l3 6H20z" />
                <path className="body-fill" d="M24 36h16c5 4 8 10 8 17 0 12-8 21-16 25-8-4-16-13-16-25 0-7 3-13 8-17z" />
                <path d="M26 78h12l2 5H24z" />
              </g>
              <circle className="flame" cx="32" cy="55" r="4.4" />
              <circle cx="32" cy="55" r="1.7" fill="#0C231E" opacity=".35" />
            </svg>
          </div>

          <div className="hero-copy">
            <p className="eyebrow on-dark">A 40-day companion for new Muslims</p>
            <h1 id="heroTitle">Forty quiet days to make this faith your own.</h1>
            <p className="hero-sub">
              Welcome Home is a free journal for the 40-day guide. Read the day, then write what is true — or draw what
              has no words yet.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-gold" to={cta.to}>
                {cta.label}
              </Link>
              <a className="btn-ghost" href="#days">
                See the forty days
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M6 13l6 6 6-6" />
                </svg>
              </a>
            </div>
            <p className="hero-micro">
              Free<span>·</span>No ads<span>·</span>Your pages stay yours
            </p>
          </div>

          <div className="hero-card" ref={cardRef}>
            <div className="demo-meta">
              <span>Day 01</span>
              <i />
              <span>Week One</span>
            </div>
            <p className="demo-q">“{DAYS[0]!.p}”</p>
            <div className="demo-sheet">
              <label className="skip" htmlFor="heroWrite">
                Try a line of your own
              </label>
              <textarea
                className="demo-write"
                id="heroWrite"
                ref={writeRef}
                rows={3}
                placeholder="Start anywhere. Even one sentence counts…"
                spellCheck
                value={heroText}
                onChange={(e) => setHeroText(e.target.value)}
              />
            </div>
            <div className="demo-foot">
              <p className="demo-status" aria-live="polite">
                <span className="dot" aria-hidden="true" />
                {lit ? 'The lamp is lit — this page keeps nothing.' : 'The lamp lights when you write.'}
              </p>
              <p className="demo-note">Nothing is sent anywhere.</p>
            </div>
          </div>
        </section>

        <section className="sec days-sec" id="days" aria-labelledby="daysTitle">
          <div className="wrap">
            <div className="days-head reveal">
              <p className="eyebrow">The shape of forty days</p>
              <h2 className="display" id="daysTitle">
                It does not ask you to arrive. It asks you to keep showing up.
              </h2>
              <p className="lede">
                The book moves in an arc — the first shock of belief, then the basics, then the inner life, then the
                ordinary world, then staying. Each day pairs one reflection with one verse. Hover or focus a day to see
                what it holds.
              </p>
            </div>
            <div className="days-grid reveal">
              <div className="weeks" onKeyDown={onDotsKey}>
                {[1, 2, 3, 4, 5, 6].map((w) => {
                  const list = DAYS.filter((d) => d.w === w);
                  return (
                    <div className="week-row" key={w}>
                      <div>
                        <span className="week-no">Week {WEEK_WORDS[w]}</span>
                        <span className="week-theme">{WEEK_THEMES[w]}</span>
                      </div>
                      <div className="dots">
                        {list.map((d) => (
                          <button
                            key={d.n}
                            type="button"
                            className="dot-btn"
                            ref={(el) => {
                              dotRefs.current[d.n - 1] = el;
                            }}
                            aria-label={`Day ${d.n}: ${d.t}`}
                            aria-current={d.n === day}
                            tabIndex={d.n === day ? 0 : -1}
                            onPointerEnter={() => setDay(d.n)}
                            onFocus={() => setDay(d.n)}
                            onClick={() => setDay(d.n)}
                          />
                        ))}
                      </div>
                      <span className="week-range">
                        Days {list[0]!.n}–{list[list.length - 1]!.n}
                      </span>
                    </div>
                  );
                })}
              </div>
              <aside className="idx" aria-live="polite">
                <span className="idx-kicker">Day</span>
                <span className="idx-num">{pad2(day)}</span>
                <h3 className="idx-title">{active.t}</h3>
                <p className="idx-week">
                  <b>Week {WEEK_WORDS[active.w]}</b>
                  <span>{WEEK_THEMES[active.w]}</span>
                </p>
              </aside>
            </div>
          </div>
        </section>

        <section className="sec modes-sec" id="modes" aria-labelledby="modesTitle">
          <div className="wrap modes-grid">
            <div className="reveal">
              <p className="eyebrow">Write or draw</p>
              <h2 className="display" id="modesTitle">
                Some days you have sentences. Some days you only have a shape.
              </h2>
              <p className="lede">
                Both count. The page is ruled because writing is the point — but the pen is there for the days when a
                word feels like too much to carry.
              </p>
              <ul className="modes-list">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 20h16" />
                    <path d="M7 16V6a2 2 0 012-2h6a2 2 0 012 2v10" />
                  </svg>
                  Saved as you go — no save button, no lost page.
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 19l7-7-4-4-7 7-1 5z" />
                    <path d="M3 21h6" />
                  </svg>
                  Pen, eraser, four inks, three widths, twelve steps of undo.
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9V4h12v5" />
                    <path d="M6 14H4v6h16v-6h-2" />
                    <path d="M8 20v-6h8v6" />
                  </svg>
                  Print any day — prompt, verse, note, and drawing on one sheet.
                </li>
              </ul>
            </div>

            <div className="demo-card reveal">
              <div className="demo-tabs" role="tablist" aria-label="Writing and drawing" onKeyDown={onTabKey}>
                <button
                  className="demo-tab"
                  ref={(el) => {
                    tabRefs.current[0] = el;
                  }}
                  role="tab"
                  aria-selected={tab === 'write'}
                  tabIndex={tab === 'write' ? 0 : -1}
                  onClick={() => setTab('write')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 19l7-7-4-4-7 7-1 5z" />
                  </svg>
                  Write
                </button>
                <button
                  className="demo-tab"
                  ref={(el) => {
                    tabRefs.current[1] = el;
                  }}
                  role="tab"
                  aria-selected={tab === 'draw'}
                  tabIndex={tab === 'draw' ? 0 : -1}
                  onClick={() => setTab('draw')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 20c4-1 3-6 7-7s5 2 9-1" />
                    <circle cx="6" cy="14" r="1" />
                  </svg>
                  Draw
                </button>
              </div>

              <div className="demo-pane" role="tabpanel" hidden={tab !== 'write'}>
                <p className="sheet-scribe">
                  I thought I would feel certain. Mostly I felt quiet — like a room after everyone has gone home.{' '}
                  <span className="ghost">I am learning that quiet might be enough.</span>
                </p>
              </div>

              <div className="demo-pane" role="tabpanel" hidden={tab !== 'draw'}>
                <div className="canvas-tools">
                  {INKS.map((i) => (
                    <button
                      key={i.color}
                      className="swatch"
                      aria-pressed={ink === i.color}
                      aria-label={`Ink: ${i.label}`}
                      style={{ background: i.color }}
                      onClick={() => setInk(i.color)}
                    />
                  ))}
                  <span className="tool-sep" aria-hidden="true" />
                  <button
                    className="tool-btn"
                    aria-label="Undo last stroke"
                    disabled={padState.undo === 0}
                    onClick={() => padRef.current?.undo()}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 14L4 9l5-5" />
                      <path d="M4 9h10a6 6 0 010 12h-3" />
                    </svg>
                  </button>
                  <button
                    className="tool-text"
                    onClick={() => {
                      padRef.current?.pushUndo();
                      padRef.current?.clear(false);
                    }}
                  >
                    Clear
                  </button>
                </div>
                <div className="pad-wrap">
                  <canvas ref={canvasRef} aria-label="A scrap of paper to try drawing on" role="img" />
                  <span className={'pad-hint' + (padState.ink ? ' off' : '')}>Try a line — finger, stylus, or mouse.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sec privacy-sec" id="privacy" aria-labelledby="privacyTitle">
          <div className="wrap">
            <div className="privacy-head reveal">
              <div>
                <p className="eyebrow on-dark">Privacy</p>
                <h2 className="display" id="privacyTitle">
                  A journal, not a feed.
                </h2>
              </div>
              <p className="lede">
                You are writing about your family, your fears, and a decision you may not have told everyone yet. It
                should not feel like publishing.
              </p>
            </div>
            <div className="privacy-grid reveal">
              <div className="priv-item">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M5 5l14 14" />
                  </svg>
                  No ads, no tracking pixels
                </h3>
                <p>Nothing on this page follows you around the web, and the journal has nothing to sell you.</p>
              </div>
              <div className="priv-item">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 018 0v3" />
                  </svg>
                  Kept in your account
                </h3>
                <p>
                  Sign in to keep your pages together across devices. Your pages are never public — only you and the
                  journal’s small admin team can open them, so they can support you if you need help.
                </p>
              </div>
              <div className="priv-item">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3v12" />
                    <path d="M8 11l4 4 4-4" />
                    <path d="M4 19h16" />
                  </svg>
                  Take it with you
                </h3>
                <p>Export every day as one file you own, or print a single page for a mentor session.</p>
              </div>
              <div className="priv-item">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 12a8 8 0 0116 0" />
                    <path d="M4 12v4a2 2 0 002 2h1v-6H6a2 2 0 00-2 2z" />
                    <path d="M20 12v4a2 2 0 01-2 2h-1v-6h1a2 2 0 012 2z" />
                  </svg>
                  No feed, no followers
                </h3>
                <p>There is no place to post and nobody to perform for. This is between you and the page.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec book-sec" id="about" aria-labelledby="aboutTitle">
          <div className="wrap book-grid">
            <div className="book-plate reveal">
              <img className="hcf-logo" src={logo} alt="Hidayah Centre Foundation" width={430} height={276} loading="lazy" decoding="async" />
              <p>Publisher of the 40-day guide</p>
            </div>
            <div className="book-copy reveal">
              <p className="eyebrow">About us</p>
              <h2 className="display" id="aboutTitle">A companion for your first steps in Islam.</h2>
              <p className="lede">Welcome Home offers a gentle space for new Muslims to reflect, learn and grow across 40 days in six weeks.</p>
              <p className="lede">Based on <em>Welcome Home — A 40-Day Companion for New Muslims</em> by Hidayah Centre Foundation. Special credit: Faizah Ayala.</p>
              <p className="lede">This journal supports learning alongside trusted teachers and the Muslim community.</p>
            </div>
          </div>
        </section>

        <section className="sec book-sec" id="resources" aria-labelledby="resourcesTitle">
          <div className="wrap">
            <p className="eyebrow">Essential worship</p>
            <h2 className="display" id="resourcesTitle">A practical place to begin.</h2>
            <p className="lede">Learn the basics of wudu (ablution), salah (prayer) and ghusl (ritual bath). The illustrations below are sourced from the supplied PowerPoint, The Concept of Worship in Islam. Follow the steps and ask a qualified teacher whenever you need guidance.</p>
            <div className="worship-guides">
              <article><h3>Wudu · Ablution</h3><img src={wuduGuide} alt="Wudu · Ablution step-by-step infographic" loading="lazy" style={{width:'100%',height:'auto',borderRadius:8}} /><ol><li>Make the intention and begin with Bismillah.</li><li>Wash both hands.</li><li>Rinse mouth and nose.</li><li>Wash the face.</li><li>Wash arms up to and including elbows.</li><li>Wipe the head and ears.</li><li>Wash both feet including ankles.</li></ol></article>
              <article><h3>Salah · Prayer</h3><img src={salahGuide} alt="Salah · Prayer step-by-step infographic" loading="lazy" style={{width:'100%',height:'auto',borderRadius:8}} /><ol><li>Prepare with wudu, proper covering, prayer time and qiblah.</li><li>Stand and say takbir.</li><li>Recite Al-Fatihah and the appropriate recitation.</li><li>Bow (ruku'), then stand upright.</li><li>Prostrate (sujud), sit, then prostrate again.</li><li>Continue the required rak'ahs, finish with tashahhud and salam.</li></ol></article>
              <article><h3>Ghusl · Ritual bath</h3><img src={ghuslGuide} alt="Ghusl · Ritual bath step-by-step infographic" loading="lazy" style={{width:'100%',height:'auto',borderRadius:8}} /><ol><li>Make the intention to remove major ritual impurity.</li><li>Remove any physical impurity and wash private parts.</li><li>Perform wudu as part of the recommended complete method.</li><li>Ensure water reaches the entire body, scalp and hair roots.</li></ol></article>
            </div>
          </div>
        </section>

        <section className="sec book-sec" id="book" aria-labelledby="bookTitle">
          <div className="wrap book-grid">
            <div className="book-plate reveal">
              <img
                className="hcf-logo"
                src={logo}
                alt="Hidayah Centre Foundation"
                width={430}
                height={276}
                loading="lazy"
                decoding="async"
              />
              <p>Publisher of the 40-day guide</p>
            </div>
            <div className="book-copy reveal">
              <p className="eyebrow">Made with the book</p>
              <h2 className="display" id="bookTitle">
                The guide is theirs. The pages are yours.
              </h2>
              <p className="lede">
                Welcome Home — A 40-Day Companion for New Muslims was written and published by Hidayah Centre
                Foundation. The journal follows its daily reflections, with special acknowledgement to Faizah Ayala.
              </p>
              <p className="lede">The journal does not replace a teacher, a mosque, or a circle of friends. Keep all three close.</p>
            </div>
          </div>
        </section>

        <section className="sec faq-sec" id="questions" aria-labelledby="faqTitle">
          <div className="wrap faq-grid">
            <div className="reveal">
              <p className="eyebrow">Questions</p>
              <h2 className="display" id="faqTitle">
                Before you turn the first page.
              </h2>
            </div>
            <div className="faq-list reveal">
              {FAQ.map(([q, a]) => (
                <details className="faq-item" key={q}>
                  <summary>
                    {q}
                    <span className="faq-sign" aria-hidden="true" />
                  </summary>
                  <p className="faq-a">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="close-sec" id="begin" aria-labelledby="closeTitle">
          <div className="close-arch" aria-hidden="true">
            <svg viewBox="0 0 860 520" preserveAspectRatio="none">
              <path
                d="M40 520V200C40 108 210 30 430 14C650 30 820 108 820 200V520"
                fill="none"
                stroke="#C2A15C"
                strokeOpacity=".4"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
          <p className="eyebrow on-dark">Begin</p>
          <h2 className="display" id="closeTitle">
            Day one is today.
          </h2>
          <p className="close-sub">Four minutes, one prompt, one verse. You do not have to know what to say.</p>
          <div className="close-actions">
            <Link className="btn btn-gold" to={cta.to}>
              {user ? cta.label : 'Begin Day 01 — free'}
            </Link>
          </div>
          <p className="close-foot">No card · No ads · No streak to break</p>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-inner">
          <a className="foot-brand" href="#top">
            <LampMark strokeWidth={3} />
            <span>Welcome Home</span>
          </a>
          <div className="foot-meta">
            <span>
              A free companion to <em>Welcome Home — A 40-Day Companion for New Muslims</em>.
            </span>
            <span>The 40-day guide © Hidayah Centre Foundation</span>
            <span>Journal © 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FAQ: [string, string][] = [
  [
    'I am not a brand-new Muslim. Can I still use it?',
    'Yes. The forty days were written for people who have just accepted Islam, but the questions — fear, family, habits, belonging — are not reserved for week one. Start at day one, or open the day that matches where you actually are.',
  ],
  [
    'I stopped at day twelve. What now?',
    'Pick it back up. Nothing expires and no streak breaks. Every day stays exactly where you left it, with the words you wrote.',
  ],
  ['Is it really free?', 'Yes — all forty days, writing, drawing, printing. No card, no trial that quietly runs out.'],
  [
    'Where do my notes live?',
    'In your account, tied to your sign-in, so a phone and a laptop show the same page. You can export everything whenever you want, and ask the admin team to delete your account.',
  ],
  [
    'Can I draw with my finger?',
    'Yes — finger, stylus, or mouse. A stylus that reports pressure draws thicker when you press harder. Strokes save with the day, beside your words.',
  ],
  [
    'Can I print a day?',
    'Print this day puts the prompt, the verse, your note, and your drawing on one clean sheet — useful for a mentor session, or for a folder you keep on the shelf.',
  ],
];
