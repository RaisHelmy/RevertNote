// Canvas drawing engine, ported as-is from the original single-file journal.
export class Sketchpad {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  color = '#23302A';
  size = 4;
  eraser = false;
  drawing = false;
  hasInk = false;
  undoStack: string[] = [];
  last: { x: number; y: number; p: number } | null = null;
  onChange: (() => void) | null = null;
  onDirty: (() => void) | null = null;
  dpr = 1;
  private ro: ResizeObserver;
  private abort = new AbortController();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.bind();
    this.ro = new ResizeObserver(() => this.fit());
    this.ro.observe(canvas.parentElement!);
  }

  destroy() {
    this.ro.disconnect();
    this.abort.abort();
  }

  setColor(c: string) {
    this.color = c;
  }
  setSize(s: number) {
    this.size = s;
  }

  private point(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure || 0 };
  }

  private widthFor(e: PointerEvent, p: number) {
    if (this.eraser) return 22;
    if (e.pointerType === 'pen' && p > 0) return Math.max(1, this.size * (0.55 + p * 0.9));
    return this.size;
  }

  private applyStyle() {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = this.eraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.eraser ? 22 : this.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  private paint(src: string, after?: () => void) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      ctx.restore();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      after?.();
    };
    img.src = src;
  }

  private wipe() {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  }

  fit() {
    const wrap = this.canvas.parentElement;
    if (!wrap) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w < 20 || h < 20) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(w * dpr);
    const H = Math.round(h * dpr);
    if (this.canvas.width === W && this.canvas.height === H) return;
    const prev = this.hasInk ? this.canvas.toDataURL('image/png') : null;
    this.canvas.width = W;
    this.canvas.height = H;
    this.dpr = dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    if (prev) this.paint(prev);
  }

  load(src: string | null) {
    this.undoStack = [];
    this.hasInk = false;
    this.wipe();
    this.emitChange();
    if (!src) return;
    this.paint(src, () => {
      this.hasInk = true;
      this.emitChange();
    });
  }

  clear(resetUndo = true) {
    this.wipe();
    this.hasInk = false;
    if (resetUndo) this.undoStack = [];
    this.emitChange();
  }

  isEmpty() {
    return !this.hasInk;
  }

  pushUndo() {
    try {
      if (this.undoStack.length >= 12) this.undoStack.shift();
      this.undoStack.push(this.canvas.toDataURL('image/png'));
    } catch {
      /* canvas may be tainted or too large; undo is best-effort */
    }
  }

  undo() {
    const src = this.undoStack.pop();
    if (!src) return;
    this.paint(src, () => {
      this.hasInk = true;
      this.emitChange();
      this.emitDirty();
    });
  }

  snapshot() {
    const src = this.canvas;
    const scale = Math.min(1, 1280 / Math.max(1, src.width));
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(src.width * scale));
    out.height = Math.max(1, Math.round(src.height * scale));
    const o = out.getContext('2d')!;
    o.fillStyle = '#FCF8EE';
    o.fillRect(0, 0, out.width, out.height);
    o.drawImage(src, 0, 0, out.width, out.height);
    return out.toDataURL('image/jpeg', 0.72);
  }

  private emitChange() {
    this.onChange?.();
  }
  private emitDirty() {
    this.onDirty?.();
  }

  private bind() {
    const c = this.canvas;
    const signal = this.abort.signal;
    c.addEventListener('pointerdown', (e) => this.onDown(e), { signal });
    c.addEventListener('pointermove', (e) => this.onMove(e), { signal });
    const end = () => this.onUp();
    c.addEventListener('pointerup', end, { signal });
    c.addEventListener('pointercancel', end, { signal });
    c.addEventListener('lostpointercapture', end, { signal });
  }

  private onDown(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    if (!this.canvas.width || !this.canvas.height) this.fit();
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    this.pushUndo();
    this.drawing = true;
    this.last = this.point(e);
    const ctx = this.ctx;
    this.applyStyle();
    ctx.beginPath();
    ctx.moveTo(this.last.x, this.last.y);
    ctx.lineTo(this.last.x + 0.01, this.last.y + 0.01);
    ctx.stroke();
    this.hasInk = true;
    this.emitChange();
  }

  private onMove(e: PointerEvent) {
    if (!this.drawing || !this.last) return;
    e.preventDefault();
    const ctx = this.ctx;
    const coalesced = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    const events = coalesced.length ? coalesced : [e];
    this.applyStyle();
    for (const ev of events) {
      const p = this.point(ev);
      const midX = (this.last.x + p.x) / 2;
      const midY = (this.last.y + p.y) / 2;
      ctx.lineWidth = this.widthFor(ev, p.p);
      ctx.quadraticCurveTo(this.last.x, this.last.y, midX, midY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      this.last = p;
    }
    this.hasInk = true;
    this.emitChange();
  }

  private onUp() {
    if (!this.drawing) return;
    this.drawing = false;
    const ctx = this.ctx;
    if (this.last) {
      ctx.lineTo(this.last.x, this.last.y);
      ctx.stroke();
      ctx.beginPath();
    }
    ctx.globalCompositeOperation = 'source-over';
    this.emitChange();
    this.emitDirty();
  }
}
