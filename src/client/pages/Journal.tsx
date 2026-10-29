import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import type { Entry, EntryMeta, PublicUser } from '../../shared/schemas';
import { Lamp } from '../components/Lamp';
import { Icon } from '../components/Icon';
import { clampDay, DAYS, pad2, WEEK_THEMES, WEEK_WORDS } from '../content/days';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { findLocalJournal, forgetLocalJournal, dismissLocalJournal } from '../lib/localJournal';
import { Sketchpad } from '../lib/sketchpad';

type Meta = Omit<EntryMeta, 'day'>;
type SaveState = 'saved' | 'saving' | 'error';

const EMPTY: Meta = { text: '', hasSketch: false, updatedAt: 0 };
const SWATCHES = [
  { color: '#23302A', label: 'Ink black' },
  { color: '#2F6B57', label: 'Pine green' },
  { color: '#A57F3C', label: 'Antique gold' },
  { color: '#A2604A', label: 'Terracotta' },
];
const WIDTHS = [
  { width: 2, label: 'Thin stroke', dot: 4 },
  { width: 4, label: 'Medium stroke', dot: 7 },
  { width: 7, label: 'Thick stroke', dot: 10 },
];

function emptyMetas(): Record<number, Meta> {
  return Object.fromEntries(DAYS.map((d) => [d.n, EMPTY]));
}

export function Journal() {
  const auth = useAuth();
  const { setUser, signOut } = auth;
  // The router only renders this page once a user is signed in.
  const user = auth.user!;

  const [metas, setMetas] = useState<Record<number, Meta>>(emptyMetas);
  const [loaded, setLoaded] = useState(false);
  const [activeDay, setActiveDay] = useState(() => clampDay(user.lastDay));
  const [text, setText] = useState('');
  const [sketchData, setSketchData] = useState<string | null>(null);
  const [sketchLoading, setSketchLoading] = useState(false);
  const [tab, setTabState] = useState<'write' | 'draw'>('write');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [railOpen, setRailOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(!user.welcomed);
  const [nameInput, setNameInput] = useState(user.displayName);
  const [toastMsg, setToastMsg] = useState<{ text: string; id: number } | null>(null);
  const [drawState, setDrawState] = useState({ ink: false, undo: 0 });
  const [sketchDirty, setSketchDirtyState] = useState(false);
  const [color, setColor] = useState(SWATCHES[0]!.color);
  const [width, setWidth] = useState(4);
  const [eraser, setEraser] = useState(false);
  const [clearArmed, setClearArmed] = useState(false);
  const [swapKey, setSwapKey] = useState(0);
  const [localImport, setLocalImport] = useState(() => findLocalJournal());

  const metasRef = useRef(metas);
  metasRef.current = metas;
  const activeRef = useRef(activeDay);
  activeRef.current = activeDay;
  const textRef = useRef(text);
  textRef.current = text;
  const sketchDirtyRef = useRef(false);
  const textTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sketchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const clearTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sketchCache = useRef(new Map<number, string | null>());
  const padRef = useRef<Sketchpad | null>(null);
  const padLoadedDay = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const printImgRef = useRef<HTMLImageElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const toast = useCallback((msg: string, ms = 4200) => {
    setToastMsg({ text: msg, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), ms);
  }, []);

  const setSketchDirty = (v: boolean) => {
    sketchDirtyRef.current = v;
    setSketchDirtyState(v);
  };

  const patchMeta = (day: number, patch: Partial<Meta>) =>
    setMetas((m) => {
      const next = { ...m, [day]: { ...(m[day] ?? EMPTY), ...patch } };
      metasRef.current = next;
      return next;
    });

  /* ---------- loading ---------- */
  const loadSketch = useCallback(async (day: number, hasSketch: boolean) => {
    if (!hasSketch) {
      setSketchData(null);
      setSketchLoading(false);
      return;
    }
    const cached = sketchCache.current.get(day);
    if (cached !== undefined) {
      setSketchData(cached);
      setSketchLoading(false);
      return;
    }
    setSketchLoading(true);
    try {
      const { entry } = await api<{ entry: Entry }>(`/me/entries/${day}`);
      sketchCache.current.set(day, entry.sketch);
      if (activeRef.current === day) setSketchData(entry.sketch);
    } catch {
      if (activeRef.current === day) toast('This drawing could not be loaded.');
    } finally {
      if (activeRef.current === day) setSketchLoading(false);
    }
  }, [toast]);

  const showDay = useCallback(
    (day: number, all: Record<number, Meta>) => {
      const m = all[day] ?? EMPTY;
      setText(m.text);
      setSketchDirty(false);
      padLoadedDay.current = null;
      setSaveState('saved');
      setClearArmed(false);
      setSwapKey((k) => k + 1);
      void loadSketch(day, m.hasSketch);
    },
    [loadSketch],
  );

  const reloadEntries = useCallback(async () => {
    const { entries } = await api<{ entries: EntryMeta[] }>('/me/entries');
    const next = emptyMetas();
    for (const e of entries) next[e.day] = { text: e.text, hasSketch: e.hasSketch, updatedAt: e.updatedAt };
    metasRef.current = next;
    setMetas(next);
    sketchCache.current.clear();
    showDay(activeRef.current, next);
  }, [showDay]);

  useEffect(() => {
    reloadEntries()
      .catch(() => toast('Your journal could not be loaded. Please refresh.', 8000))
      .finally(() => setLoaded(true));
  }, [reloadEntries, toast]);

  /* ---------- saving ---------- */
  const saveText = useCallback(async () => {
    const day = activeRef.current;
    const value = textRef.current;
    const previous = metasRef.current[day]?.text ?? '';
    patchMeta(day, { text: value });
    try {
      const r = await api<{ updatedAt: number }>(`/me/entries/${day}`, { method: 'PUT', json: { text: value } });
      patchMeta(day, { updatedAt: r.updatedAt });
      if (activeRef.current === day) setSaveState('saved');
    } catch (e) {
      // Roll back so the next flush retries this text.
      if (metasRef.current[day]?.text === value) patchMeta(day, { text: previous });
      setSaveState('error');
      toast(`This note could not be saved. ${(e as Error).message}`, 6500);
    }
  }, [toast]);

  const saveSketch = useCallback(async () => {
    const pad = padRef.current;
    if (!sketchDirtyRef.current || !pad) return;
    const day = activeRef.current;
    const data = pad.isEmpty() ? null : pad.snapshot();
    setSketchDirty(false);
    sketchCache.current.set(day, data);
    setSketchData(data);
    patchMeta(day, { hasSketch: !!data });
    try {
      await api(`/me/entries/${day}`, { method: 'PUT', json: { sketch: data } });
      if (activeRef.current === day) setSaveState('saved');
    } catch (e) {
      setSaveState('error');
      toast(`This drawing could not be saved. ${(e as Error).message}`, 6500);
    }
  }, [toast]);

  const flush = useCallback(async () => {
    clearTimeout(textTimer.current);
    clearTimeout(sketchTimer.current);
    const jobs: Promise<void>[] = [];
    if (sketchDirtyRef.current) jobs.push(saveSketch());
    if (textRef.current !== metasRef.current[activeRef.current]?.text) jobs.push(saveText());
    await Promise.all(jobs);
  }, [saveSketch, saveText]);

  // On tab close, send the pending text with keepalive so it survives the unload.
  useEffect(() => {
    const onHide = () => {
      const day = activeRef.current;
      if (textRef.current !== metasRef.current[day]?.text) {
        clearTimeout(textTimer.current);
        void fetch(`/api/me/entries/${day}`, {
          method: 'PUT',
          keepalive: true,
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textRef.current }),
        });
        patchMeta(day, { text: textRef.current });
      }
      if (sketchDirtyRef.current) void saveSketch();
    };
    const onVis = () => document.visibilityState === 'hidden' && onHide();
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [saveSketch]);

  /* ---------- navigation ---------- */
  const selectDay = useCallback(
    (n: number, scroll = false) => {
      n = clampDay(n);
      setRailOpen(false);
      if (n === activeRef.current) return;
      void flush();
      activeRef.current = n;
      setActiveDay(n);
      showDay(n, metasRef.current);
      if (scroll) window.scrollTo(0, 0);
      api<{ user: PublicUser }>('/me', { method: 'PATCH', json: { lastDay: n } })
        .then((r) => setUser(r.user))
        .catch(() => {});
    },
    [flush, showDay, setUser],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (welcomeOpen) return skipWelcome();
        if (railOpen) return setRailOpen(false);
      }
      if (welcomeOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('textarea, input, select, [role="tablist"], .draw-tools')) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        selectDay(activeRef.current - 1, true);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        selectDay(activeRef.current + 1, true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    document.body.classList.toggle('lock', railOpen || welcomeOpen);
    return () => document.body.classList.remove('lock');
  }, [railOpen, welcomeOpen]);

  // Replay the "rise" animation each time a day is shown.
  useEffect(() => {
    const el = pageRef.current;
    if (!el || !swapKey) return;
    el.classList.remove('swap');
    void el.offsetWidth;
    el.classList.add('swap');
  }, [swapKey]);

  useEffect(() => {
    const d = DAYS[activeDay - 1]!;
    document.title = `Day ${pad2(d.n)} · ${d.t} — Welcome Home Journal`;
    navRef.current?.querySelector(`[data-day="${activeDay}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeDay]);

  /* ---------- textarea ---------- */
  const autosize = useCallback(() => {
    const el = noteRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const min = window.innerWidth <= 700 ? 300 : 378;
    el.style.height = Math.max(min, el.scrollHeight + 2) + 'px';
  }, []);
  useEffect(autosize, [text, tab, autosize]);
  useEffect(() => {
    window.addEventListener('resize', autosize);
    return () => window.removeEventListener('resize', autosize);
  }, [autosize]);

  function onTextInput(value: string) {
    setText(value);
    textRef.current = value;
    setSaveState('saving');
    clearTimeout(textTimer.current);
    textTimer.current = setTimeout(() => void saveText(), 550);
  }

  /* ---------- drawing ---------- */
  useEffect(() => {
    const pad = new Sketchpad(canvasRef.current!);
    padRef.current = pad;
    pad.onChange = () => setDrawState({ ink: !pad.isEmpty(), undo: pad.undoStack.length });
    pad.onDirty = () => {
      setSketchDirty(true);
      setSaveState('saving');
      clearTimeout(sketchTimer.current);
      sketchTimer.current = setTimeout(() => void saveSketch(), 650);
    };
    return () => pad.destroy();
  }, [saveSketch]);

  useEffect(() => {
    if (tab !== 'draw' || sketchLoading) return;
    const id = requestAnimationFrame(() => {
      const pad = padRef.current;
      if (!pad) return;
      pad.fit();
      if (padLoadedDay.current !== activeDay) {
        padLoadedDay.current = activeDay;
        pad.clear(true);
        if (sketchData) pad.load(sketchData);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [tab, activeDay, sketchData, sketchLoading]);

  useEffect(() => {
    const pad = padRef.current;
    if (!pad) return;
    pad.setColor(color);
    pad.setSize(width);
    pad.eraser = eraser;
  }, [color, width, eraser]);

  function setTab(next: 'write' | 'draw') {
    setTabState(next);
    if (next === 'write' && sketchDirtyRef.current) {
      clearTimeout(sketchTimer.current);
      void saveSketch();
    }
  }

  function onClear() {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) return;
    if (!clearArmed) {
      setClearArmed(true);
      clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setClearArmed(false), 2800);
      return;
    }
    setClearArmed(false);
    clearTimeout(clearTimer.current);
    pad.pushUndo();
    pad.clear(false);
    setSketchDirty(true);
    void saveSketch();
    toast('Drawing cleared. The undo arrow brings it back.');
  }

  /* ---------- lit state ---------- */
  const activeHasSketch = sketchDirty ? drawState.ink : (metas[activeDay]?.hasSketch ?? false);
  const isLit = (n: number) =>
    n === activeDay
      ? text.trim().length > 0 || activeHasSketch
      : (metas[n]?.text.trim().length ?? 0) > 0 || !!metas[n]?.hasSketch;
  const litCount = DAYS.filter((d) => isLit(d.n)).length;

  /* ---------- welcome ---------- */
  async function saveWelcome(name: string) {
    setWelcomeOpen(false);
    try {
      const r = await api<{ user: PublicUser }>('/me', {
        method: 'PATCH',
        json: { displayName: name.trim().slice(0, 40), welcomed: true },
      });
      setUser(r.user);
    } catch {
      /* the modal will simply show again next time */
    }
  }
  function skipWelcome() {
    void saveWelcome(user.displayName);
  }
  useEffect(() => {
    if (!welcomeOpen) return;
    const t = setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 260);
    return () => clearTimeout(t);
  }, [welcomeOpen]);

  /* ---------- backup, restore & import ---------- */
  async function backup() {
    await flush();
    try {
      const res = await fetch('/api/me/entries/export', { credentials: 'same-origin' });
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `welcome-home-journal-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      toast('Backup downloaded. Keep it somewhere safe.');
    } catch {
      toast('The backup could not be downloaded. Please try again.');
    }
  }

  async function importBackup(data: unknown, confirmText: string | null): Promise<number | null> {
    const days = (data as { days?: Record<string, unknown> })?.days;
    if (!data || (data as { app?: string }).app !== 'welcome-home-journal' || !days || typeof days !== 'object') {
      toast('That file doesn’t look like a journal backup.');
      return null;
    }
    const keys = Object.keys(days).filter((k) => Number(k) >= 1 && Number(k) <= 40);
    if (!keys.length) {
      toast('That backup has no notes in it.');
      return null;
    }
    const plural = keys.length > 1 ? 's' : '';
    if (confirmText !== null && !window.confirm(`Restore ${keys.length} day${plural} from ${confirmText}?\n\nThis replaces the notes for those days in your journal.`)) {
      return null;
    }
    await flush();
    await api('/me/entries/import', { method: 'POST', json: data });
    const me = await api<{ user: PublicUser }>('/me');
    setUser(me.user);
    await reloadEntries();
    return keys.length;
  }

  async function onRestoreFile(file: File | undefined) {
    if (!file) return;
    try {
      const n = await importBackup(JSON.parse(await file.text()), 'this backup');
      if (n) toast('Backup restored. Your journal is up to date.');
    } catch (e) {
      toast(e instanceof SyntaxError ? 'That file doesn’t look like a journal backup.' : (e as Error).message);
    }
    if (restoreRef.current) restoreRef.current.value = '';
  }

  async function onImportLocal() {
    if (!localImport) return;
    try {
      const n = await importBackup(localImport, null);
      if (n) {
        forgetLocalJournal();
        setLocalImport(null);
        toast(`Imported ${n} day${n > 1 ? 's' : ''} from this browser into your account.`);
      }
    } catch (e) {
      toast((e as Error).message);
    }
  }

  /* ---------- print ---------- */
  async function printDay() {
    await flush();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      await printImgRef.current?.decode();
    } catch {
      /* print without the image */
    }
    window.print();
  }

  /* ---------- render ---------- */
  const d = DAYS[activeDay - 1]!;
  const today = useMemo(
    () => new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()),
    [],
  );
  const greeting = user.displayName ? `Assalamu’alaikum, ${user.displayName}.` : 'Assalamu’alaikum.';
  const printSketch = activeHasSketch ? (sketchCache.current.get(activeDay) ?? sketchData) : null;

  let lastWeek = 0;
  const railItems = DAYS.flatMap((day) => {
    const out = [];
    if (day.w !== lastWeek) {
      lastWeek = day.w;
      out.push(
        <div className="rail-week" key={`w${day.w}`}>
          <span className="rw-num">Week {WEEK_WORDS[day.w]}</span>
          <span className="rw-theme" title={WEEK_THEMES[day.w]}>
            {WEEK_THEMES[day.w]}
          </span>
        </div>,
      );
    }
    out.push(
      <button
        type="button"
        className="day-item"
        key={day.n}
        data-day={day.n}
        title={`Day ${day.n}: ${day.t}`}
        aria-current={day.n === activeDay ? 'true' : 'false'}
        onClick={() => selectDay(day.n)}
      >
        <span className="d-num">{pad2(day.n)}</span>
        <span className="d-title">{day.t}</span>
        <span className={'d-dot' + (isLit(day.n) ? ' on' : '')} aria-hidden="true" />
      </button>,
    );
    return out;
  });

  return (
    <>
      <div className="app">
        <div className={'scrim' + (railOpen ? ' open' : '')} onClick={() => setRailOpen(false)} />

        <aside className={'rail' + (railOpen ? ' open' : '')} id="rail" aria-label="Journal days">
          <button className="rail-close" aria-label="Close day list" onClick={() => setRailOpen(false)}>
            <Icon name="close" />
          </button>
          <div className="brand">
            <div className="bismillah" lang="ar" dir="rtl">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            <div className="wordmark">Welcome Home</div>
            <div className="tagline">A private 40-day journal</div>
            <p className="greeting">{greeting}</p>
          </div>

          <div className="progress" aria-label="Journal progress">
            <div className="progress-row">
              <span>{litCount} of 40 days lit</span>
              <b>{Math.round((litCount / 40) * 100)}%</b>
            </div>
            <div className="progress-track">
              <span className="progress-fill" style={{ width: `${(litCount / 40) * 100}%` }} />
            </div>
          </div>

          <nav className="rail-nav" ref={navRef} aria-label="Days 1 to 40">
            {railItems}
          </nav>

          <div className="rail-foot">
            <div className="rail-actions">
              <button type="button" title="Download all notes as a backup file" onClick={backup}>
                <Icon name="download" />
                <span>Back up</span>
              </button>
              <button type="button" title="Restore notes from a backup file" onClick={() => restoreRef.current?.click()}>
                <Icon name="upload" />
                <span>Restore</span>
              </button>
              <input
                type="file"
                ref={restoreRef}
                accept="application/json,.json"
                hidden
                onChange={(e) => void onRestoreFile(e.target.files?.[0])}
              />
            </div>
            <div className="rail-actions">
              {user.role === 'admin' && (
                <Link to="/admin" className="rail-link">
                  <Icon name="shield" />
                  <span>Admin</span>
                </Link>
              )}
              <button type="button" onClick={() => void flush().finally(signOut)}>
                <Icon name="signout" />
                <span>Sign out @{user.username}</span>
              </button>
            </div>
            <p className="privacy">
              <Icon name="lock" />
              <span>Saved to your account.</span>
            </p>
          </div>
        </aside>

        <main className="main">
          <header className="topbar">
            <button
              className="menu-btn"
              aria-label="Open day list"
              aria-expanded={railOpen}
              aria-controls="rail"
              onClick={() => setRailOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <span className="day-label">Day {pad2(d.n)} / 40</span>
            <span className="topbar-spacer" />
            <span className="today">{today}</span>
            <button className="ghost-btn" title="Print this day with your note" onClick={printDay}>
              <Icon name="print" />
              <span>Print this day</span>
            </button>
            <div className="pager">
              <button
                aria-label="Previous day"
                title="Previous day (left arrow)"
                disabled={activeDay === 1}
                onClick={() => selectDay(activeDay - 1, true)}
              >
                <Icon name="prev" />
              </button>
              <button
                aria-label="Next day"
                title="Next day (right arrow)"
                disabled={activeDay === 40}
                onClick={() => selectDay(activeDay + 1, true)}
              >
                <Icon name="next" />
              </button>
            </div>
          </header>

          <div className="page" ref={pageRef}>
            {localImport && (
              <div className="import-banner" role="status">
                <span>
                  We found {localImport.count} day{localImport.count > 1 ? 's' : ''} of notes saved in this browser from
                  the offline journal. Bring them into your account?
                </span>
                <button className="ghost-btn" onClick={onImportLocal}>
                  Import
                </button>
                <button
                  className="btn-quiet"
                  onClick={() => {
                    dismissLocalJournal();
                    setLocalImport(null);
                  }}
                >
                  Not now
                </button>
              </div>
            )}

            <section className={'niche' + (isLit(activeDay) ? ' lit' : '')} aria-labelledby="dayTitle">
              <svg className="arch-bg" viewBox="0 0 860 520" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="archFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#174136" />
                    <stop offset=".55" stopColor="#0F2E26" />
                    <stop offset="1" stopColor="#0C231E" />
                  </linearGradient>
                </defs>
                <path d="M0 520V190C0 92 190 16 430 0C670 16 860 92 860 190V520Z" fill="url(#archFill)" />
                <path
                  d="M16 520V192C16 100 200 26 430 12C660 26 844 100 844 192V520"
                  fill="none"
                  stroke="#C2A15C"
                  strokeOpacity=".5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="lamp" aria-hidden="true">
                <Lamp variant="niche" />
              </div>
              <div className="niche-content">
                <p className="eyebrow">
                  Week {WEEK_WORDS[d.w]} · Day {pad2(d.n)}
                </p>
                <h1 id="dayTitle">{d.t}</h1>
                <div className="prompt-block">
                  <p className="prompt-label">Reflection</p>
                  <p className="prompt">{d.p}</p>
                </div>
              </div>
            </section>

            <figure className="plaque">
              <span className="plaque-mark" aria-hidden="true" />
              <blockquote>“{d.v}”</blockquote>
              <figcaption>{d.r}</figcaption>
            </figure>

            <section className="notebook" aria-label="Your note for this day">
              <div className="nb-head">
                <div
                  className="tabs"
                  role="tablist"
                  aria-label="How you want to write"
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                      e.preventDefault();
                      setTab(e.key === 'ArrowRight' ? 'draw' : 'write');
                    }
                  }}
                >
                  <button
                    className="tab"
                    role="tab"
                    aria-selected={tab === 'write'}
                    aria-controls="paneWrite"
                    onClick={() => setTab('write')}
                  >
                    <Icon name="pen" />
                    Write
                  </button>
                  <button
                    className="tab"
                    role="tab"
                    aria-selected={tab === 'draw'}
                    aria-controls="paneDraw"
                    onClick={() => setTab('draw')}
                  >
                    <Icon name="squiggle" />
                    Draw
                    <span className="tab-dot" hidden={!activeHasSketch} />
                  </button>
                </div>
                <div className="save-state" data-state={loaded ? saveState : 'saving'}>
                  <span className="dot" aria-hidden="true" />
                  <span>
                    {!loaded
                      ? 'Loading…'
                      : saveState === 'saving'
                        ? 'Saving…'
                        : saveState === 'saved'
                          ? 'Saved'
                          : 'Could not save'}
                  </span>
                </div>
              </div>

              <div className="pane" id="paneWrite" role="tabpanel" hidden={tab !== 'write'}>
                <div className="sheet">
                  <textarea
                    id="noteInput"
                    ref={noteRef}
                    spellCheck
                    disabled={!loaded}
                    placeholder="Start anywhere — a sentence, a prayer, a question you’re afraid to ask."
                    aria-label="Your written note for this day"
                    value={text}
                    onChange={(e) => onTextInput(e.target.value)}
                    onBlur={() => {
                      if (textRef.current !== metasRef.current[activeRef.current]?.text) {
                        clearTimeout(textTimer.current);
                        void saveText();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="pane" id="paneDraw" role="tabpanel" hidden={tab !== 'draw'}>
                <div className="draw-tools">
                  <div className="tools-group" role="group" aria-label="Ink colour">
                    {SWATCHES.map((s) => (
                      <button
                        key={s.color}
                        className="swatch"
                        style={{ ['--sw' as string]: s.color }}
                        aria-label={s.label}
                        aria-pressed={!eraser && color === s.color}
                        onClick={() => {
                          setColor(s.color);
                          setEraser(false);
                        }}
                      />
                    ))}
                  </div>
                  <span className="tools-sep" aria-hidden="true" />
                  <div className="tools-group" role="group" aria-label="Stroke width">
                    {WIDTHS.map((w) => (
                      <button
                        key={w.width}
                        className="width"
                        aria-label={w.label}
                        aria-pressed={width === w.width}
                        onClick={() => setWidth(w.width)}
                      >
                        <i style={{ width: w.dot, height: w.dot }} />
                      </button>
                    ))}
                  </div>
                  <span className="tools-sep" aria-hidden="true" />
                  <button
                    className={'tool' + (eraser ? ' is-active' : '')}
                    aria-label="Eraser"
                    aria-pressed={eraser}
                    title="Eraser"
                    onClick={() => setEraser((v) => !v)}
                  >
                    <Icon name="eraser" />
                  </button>
                  <button
                    className="tool"
                    aria-label="Undo last stroke"
                    title="Undo"
                    disabled={drawState.undo === 0}
                    onClick={() => padRef.current?.undo()}
                  >
                    <Icon name="undo" />
                  </button>
                  <button
                    className={'tool clear-btn' + (clearArmed ? ' armed' : '')}
                    aria-label="Clear this drawing"
                    onClick={onClear}
                  >
                    {clearArmed ? 'Tap again to clear' : 'Clear'}
                  </button>
                  <span className="tools-spacer" />
                </div>
                <div
                  className={'canvas-wrap' + (drawState.ink ? ' has-ink' : '') + (sketchLoading ? ' loading' : '')}
                >
                  <canvas id="sketch" ref={canvasRef} aria-label="Drawing page for this day" />
                  <p className="draw-hint">
                    {sketchLoading ? (
                      'Loading your drawing…'
                    ) : (
                      <>
                        Draw here with a finger, stylus, or mouse.
                        <br />
                        It is saved with this day.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </section>

            <footer className="colophon">
              <p>
                Prompts and verses from <em>Welcome Home — A 40-Day Companion for New Muslims</em> (Hidayah Centre
                Foundation).
                <br />
                Your notes are saved to your account, so you can return from any device.
              </p>
            </footer>
          </div>
        </main>
      </div>

      {welcomeOpen && (
        <div className="welcome" role="dialog" aria-modal="true" aria-labelledby="welcomeTitle">
          <div className="welcome-card">
            <div className="w-bismillah" lang="ar" dir="rtl">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            <div className="w-lamp" aria-hidden="true">
              <Lamp variant="welcome" />
            </div>
            <h2 id="welcomeTitle">Welcome home.</h2>
            <p className="w-lede">A quiet place for your first forty days.</p>
            <p className="w-body">
              You’ve been given forty reflections to walk through. This is where your own words live beside them — type
              a thought, or draw one. Nothing is graded.
            </p>
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void saveWelcome(nameInput);
              }}
            >
              <label htmlFor="nameInput">What should we call you?</label>
              <input
                id="nameInput"
                ref={nameRef}
                type="text"
                maxLength={40}
                autoComplete="given-name"
                placeholder="Your first name (optional)"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
              />
              <button className="btn-primary" type="submit">
                Open my journal
              </button>
            </form>
            <button className="btn-quiet" type="button" onClick={skipWelcome}>
              Just open the journal
            </button>
            <p className="w-foot">Your notes are saved to your account.</p>
          </div>
        </div>
      )}

      <div className={'toast' + (toastMsg ? ' show' : '')} role="status" aria-live="polite">
        {toastMsg?.text}
      </div>

      <div className="print-sheet">
        <p className="print-meta">
          Welcome Home · Day {pad2(activeDay)} · Week {WEEK_WORDS[d.w]}
        </p>
        <h1 className="print-day">{d.t}</h1>
        <p className="print-prompt-label">Reflection</p>
        <p className="print-prompt">{d.p}</p>
        <blockquote className="print-verse">“{d.v}”</blockquote>
        <p className="print-ref">{d.r}</p>
        {text.trim() && (
          <>
            <h2 className="print-note-h">My note</h2>
            <div className="print-note">{text}</div>
          </>
        )}
        {printSketch && (
          <img ref={printImgRef} className="print-sketch" src={printSketch} alt={`Hand-drawn note for day ${activeDay}`} />
        )}
        {!text.trim() && !printSketch && <p className="print-empty">No note was written for this day.</p>}
        <p className="print-foot">{new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date())}</p>
      </div>
    </>
  );
}
