// Notes written in the original offline journal live in this browser's localStorage
// under `wwh.*`. This turns them into the backup format so they can be imported.
const DISMISSED = 'wwh.import.dismissed';

export interface LocalJournal {
  app: 'welcome-home-journal';
  version: 1;
  profile: { name: string };
  days: Record<string, { text: string; updatedAt: number; sketch: string | null }>;
  count: number;
}

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readJSON<T>(key: string): T | null {
  const raw = get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function findLocalJournal(): LocalJournal | null {
  if (get(DISMISSED)) return null;
  const days: LocalJournal['days'] = {};
  for (let n = 1; n <= 40; n++) {
    const meta = readJSON<{ text?: string; hasSketch?: boolean; updatedAt?: number }>(`wwh.day.${n}`);
    const text = typeof meta?.text === 'string' ? meta.text : '';
    const sketch = meta?.hasSketch ? get(`wwh.sketch.${n}`) : null;
    if (!text.trim() && !sketch) continue;
    days[n] = { text, sketch, updatedAt: Number(meta?.updatedAt) || Date.now() };
  }
  const count = Object.keys(days).length;
  if (!count) return null;
  const profile = readJSON<{ name?: string }>('wwh.profile');
  return { app: 'welcome-home-journal', version: 1, profile: { name: profile?.name ?? '' }, days, count };
}

export function forgetLocalJournal() {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith('wwh.')) localStorage.removeItem(key);
  } catch {
    /* storage blocked; nothing to clear */
  }
}

export function dismissLocalJournal() {
  try {
    localStorage.setItem(DISMISSED, '1');
  } catch {
    /* storage blocked; the banner will show again next visit */
  }
}
