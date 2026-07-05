import { readLaunchParams } from './settings';

/**
 * In-game chrome shared by every game entry — a self-contained DOM shell over
 * the Three.js canvas. It provides the top bar (back, pause, centred stage
 * title, countdown), an intro/pause modal (how-to-play, gated by "Start"),
 * bottom-centre closable/stackable "snacks" for game dialogue, and the win /
 * time-up end screens. It never touches the scene, so it layers over the co-op
 * game and the solo adventures alike.
 *
 *   const ui = mountGameOverlay({ title, help, onTimeUp });
 *   ui.setStageTitle('The Pharaoh’s Curse — 1/3: Antechamber');
 *   ui.snack('The seal is shut…');            // transient
 *   ui.snack('Read the walls.', 'objective');  // pinned, updates in place
 *   if (!ui.isPaused()) { ...run the game... }
 */

export interface OverlayOptions {
  title: string;
  /** How-to-play lines shown in the intro/pause modal. */
  help?: string[];
  /** Called once when the countdown hits zero (if a timer is set). */
  onTimeUp?: () => void;
}

export interface GameOverlay {
  setStageTitle(text: string): void;
  /** Paused while the intro/pause modal is up — host should freeze the game. */
  isPaused(): boolean;
  /** Show a snack. 'objective' pins/updates one; 'toast' is transient. */
  snack(text: string, kind?: 'toast' | 'objective'): void;
  stopTimer(): void;
  celebrate(title: string, subtitle: string): void;
  tick(deltaSeconds: number): void;
}

const CSS = `
:root { --qs-sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, sans-serif;
  --qs-serif: "Cormorant Garamond", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  --qs-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
.qs-bar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 30;
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: start;
  gap: 10px; padding: 12px 16px;
  font-family: var(--qs-sans); color: #d6ecff;
  background: linear-gradient(180deg, rgba(4,8,14,0.85) 0%, rgba(4,8,14,0) 100%);
  pointer-events: none;
}
.qs-bar > * { pointer-events: auto; }
.qs-bar .left { display: flex; gap: 8px; }
.qs-bar .right { display: flex; gap: 8px; justify-content: flex-end; align-items: center; }
.qs-title {
  justify-self: center; text-align: center; font-family: var(--qs-serif);
  font-size: 21px; font-weight: 600; letter-spacing: 0.02em; color: #eaf4ff;
  text-shadow: 0 1px 12px rgba(0,0,0,0.6); line-height: 1.2; max-width: 46vw;
}
.qs-title small { display: block; font-family: var(--qs-sans); font-size: 11px;
  letter-spacing: 0.18em; text-transform: uppercase; color: #8aa0b8; font-weight: 500; margin-top: 2px; }
.qs-btn {
  display: inline-flex; align-items: center; gap: 7px; padding: 8px 13px; border-radius: 10px;
  border: 1px solid rgba(120,150,180,0.28); background: rgba(12,18,28,0.72);
  color: #cfe0f2; font: inherit; font-size: 13px; cursor: pointer; text-decoration: none;
  transition: border-color .15s, background .15s, color .15s;
}
.qs-btn:hover { border-color: rgba(120,180,230,0.7); color: #fff; background: rgba(20,30,44,0.9); }
.qs-icon { width: 40px; height: 38px; justify-content: center; padding: 0; font-size: 15px; }
.qs-chip { display: inline-flex; align-items: baseline; gap: 7px; padding: 8px 12px; border-radius: 10px;
  border: 1px solid rgba(120,150,180,0.2); background: rgba(10,16,24,0.6); font-size: 12px; }
.qs-chip .k { color: #7f96ad; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; }
.qs-chip .v { color: #eaf4ff; letter-spacing: .12em; font-weight: 600; font-family: var(--qs-mono); }
.qs-timer { font-family: var(--qs-mono); font-variant-numeric: tabular-nums; font-size: 19px; font-weight: 700;
  padding: 7px 13px; border-radius: 10px; letter-spacing: .06em;
  border: 1px solid rgba(120,150,180,0.24); background: rgba(10,16,24,0.72); color: #eaf4ff;
  transition: color .3s, border-color .3s; }
.qs-timer.warn { color: #ffd98a; border-color: rgba(255,190,90,0.6); }
.qs-timer.danger { color: #ff8a8a; border-color: rgba(255,90,90,0.7); animation: qs-pulse 1s ease-in-out infinite; }
@keyframes qs-pulse { 0%,100% { opacity: 1; } 50% { opacity: .55; } }

/* Snacks — bottom-centre, stacked, closable */
.qs-snacks { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%); z-index: 32;
  display: flex; flex-direction: column-reverse; align-items: center; gap: 8px;
  width: min(560px, 92vw); pointer-events: none; }
.qs-snack { pointer-events: auto; width: 100%; display: flex; align-items: flex-start; gap: 10px;
  padding: 11px 12px 11px 15px; border-radius: 12px; font-family: var(--qs-sans); font-size: 14px; line-height: 1.5;
  color: #eaf4ff; background: rgba(10,15,23,0.92); border: 1px solid rgba(120,150,190,0.22);
  box-shadow: 0 10px 34px -14px rgba(0,0,0,0.8); opacity: 0; transform: translateY(8px);
  transition: opacity .25s, transform .25s; }
.qs-snack.show { opacity: 1; transform: translateY(0); }
.qs-snack.objective { border-left: 3px solid #ffd98a; color: #ffe9bf; }
.qs-snack .x { margin-left: auto; flex: 0 0 auto; cursor: pointer; color: #7f96ad; font-size: 16px;
  line-height: 1; padding: 0 2px; background: none; border: none; }
.qs-snack .x:hover { color: #fff; }

/* Modal — intro / pause */
.qs-modal { position: fixed; inset: 0; z-index: 45; display: flex; align-items: center; justify-content: center;
  background: rgba(2,4,8,0.72); backdrop-filter: blur(4px); font-family: var(--qs-sans);
  opacity: 0; transition: opacity .3s; }
.qs-modal.show { opacity: 1; }
.qs-modal .card { width: min(460px, 92vw); padding: 28px 30px; border-radius: 18px; text-align: center;
  background: linear-gradient(180deg, rgba(18,24,34,0.98), rgba(10,14,20,0.98));
  border: 1px solid rgba(120,150,190,0.25); box-shadow: 0 30px 80px -30px rgba(0,0,0,0.9); }
.qs-modal h2 { font-family: var(--qs-serif); font-size: 28px; margin: 0 0 4px; color: #eaf4ff; }
.qs-modal .eyebrow { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #8aa0b8; }
.qs-modal ul { list-style: none; margin: 18px 0; padding: 0; text-align: left; display: flex; flex-direction: column; gap: 9px; }
.qs-modal li { color: #c3d4e6; font-size: 14px; display: flex; gap: 10px; align-items: baseline; }
.qs-modal li b { color: #eaf4ff; font-weight: 600; min-width: 92px; display: inline-block; }
.qs-modal .go { width: 100%; margin-top: 6px; padding: 14px; font-size: 16px; font-weight: 700; color: #05080d;
  border: none; border-radius: 12px; cursor: pointer; background: linear-gradient(100deg, #7fe0ff, #9dffce); }
.qs-modal .go:hover { filter: brightness(1.06); }
.qs-modal .meta { margin-top: 14px; font-size: 12px; color: #7f96ad; }
.qs-modal .meta a { color: #9fb6cc; }

/* End screens */
.qs-end { position: fixed; inset: 0; z-index: 50; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 16px; text-align: center; font-family: var(--qs-sans);
  color: #eaffff; background: rgba(2,4,8,0.86); backdrop-filter: blur(3px);
  opacity: 0; transition: opacity .8s; pointer-events: none; }
.qs-end.show { opacity: 1; pointer-events: auto; }
.qs-end h1 { font-family: var(--qs-serif); margin: 0; font-size: 46px; letter-spacing: .06em; }
.qs-end.fail h1 { color: #ff8a8a; text-shadow: 0 0 30px rgba(255,80,80,0.6); }
.qs-end.win h1 { color: #eaffff; text-shadow: 0 0 30px rgba(46,220,255,0.7); }
.qs-end p { margin: 0; font-size: 17px; opacity: .82; }
.qs-end .actions { display: flex; gap: 12px; margin-top: 12px; }
`;

function injectCss(): void {
  if (document.getElementById('qs-overlay-css')) return;
  const style = document.createElement('style');
  style.id = 'qs-overlay-css';
  style.textContent = CSS;
  document.head.appendChild(style);
}

function fmt(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const DEFAULT_HELP = [
  'Look|Drag or swipe to look around.',
  'Move|Arrow keys / WASD — or the ▲ button.',
  'Interact|Tap a prop to use it.',
  'Goal|Solve the puzzles and escape before the clock runs out.',
];

export function mountGameOverlay(options: OverlayOptions): GameOverlay {
  injectCss();
  const cfg = readLaunchParams();
  const help = options.help ?? DEFAULT_HELP;

  // ── Top bar ────────────────────────────────────────────────────────────────
  const bar = document.createElement('div');
  bar.className = 'qs-bar';

  const left = document.createElement('div');
  left.className = 'left';
  const back = document.createElement('a');
  back.className = 'qs-btn';
  back.href = 'index.html';
  back.innerHTML = '&larr; Menu';
  const pauseBtn = document.createElement('button');
  pauseBtn.className = 'qs-btn qs-icon';
  pauseBtn.title = 'Pause';
  pauseBtn.textContent = '⏸';
  left.append(back, pauseBtn);

  const title = document.createElement('div');
  title.className = 'qs-title';
  title.textContent = options.title;

  const right = document.createElement('div');
  right.className = 'right';
  right.id = 'qs-bar-right';
  if (cfg.roomCode) {
    const chip = document.createElement('span');
    chip.className = 'qs-chip';
    chip.innerHTML = `<span class="k">Room</span><span class="v">${cfg.roomCode}</span>`;
    right.append(chip);
  }
  let remaining = cfg.timerMinutes * 60;
  let running = cfg.timerMinutes > 0;
  const timer = document.createElement('span');
  timer.className = 'qs-timer';
  if (running) {
    timer.textContent = fmt(remaining);
    right.append(timer);
  }

  bar.append(left, title, right);
  document.body.appendChild(bar);

  // ── Snacks ───────────────────────────────────────────────────────────────
  const snackHost = document.createElement('div');
  snackHost.className = 'qs-snacks';
  document.body.appendChild(snackHost);
  let objectiveEl: HTMLElement | null = null;
  const toastEls: HTMLElement[] = [];
  const MAX_TOASTS = 4; // keep the stack from taking over the screen

  function dismiss(el: HTMLElement): void {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 250);
  }

  function makeSnack(text: string, pinned: boolean): HTMLElement {
    const el = document.createElement('div');
    el.className = `qs-snack${pinned ? ' objective' : ''}`;
    const span = document.createElement('span');
    span.textContent = text;
    const x = document.createElement('button');
    x.className = 'x';
    x.textContent = '×';
    x.addEventListener('click', () => {
      dismiss(el);
      if (el === objectiveEl) objectiveEl = null;
      const i = toastEls.indexOf(el);
      if (i >= 0) toastEls.splice(i, 1);
    });
    el.append(span, x);
    snackHost.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    return el;
  }

  // ── Intro / pause modal ──────────────────────────────────────────────────
  let paused = true; // starts paused behind the intro modal
  const modal = document.createElement('div');
  modal.className = 'qs-modal';
  const helpItems = help
    .map((h) => {
      const [k, v] = h.split('|');
      return `<li><b>${k}</b><span>${v ?? ''}</span></li>`;
    })
    .join('');
  const metaBits = [cfg.roomCode ? `Room ${cfg.roomCode}` : '', cfg.difficulty]
    .filter(Boolean)
    .join(' · ');
  modal.innerHTML = `
    <div class="card">
      <div class="eyebrow" id="qs-modal-eyebrow">How to play</div>
      <h2 id="qs-modal-title">${options.title}</h2>
      <ul>${helpItems}</ul>
      <button class="go" id="qs-modal-go">Start room</button>
      <div class="meta">${metaBits} &nbsp;·&nbsp; <a href="index.html">Leave</a></div>
    </div>`;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('show'));

  function setPaused(next: boolean): void {
    paused = next;
    modal.classList.toggle('show', next);
    modal.style.pointerEvents = next ? 'auto' : 'none';
  }
  modal.querySelector('#qs-modal-go')?.addEventListener('click', () => setPaused(false));
  pauseBtn.addEventListener('click', () => {
    const goingToPause = !paused;
    const eyebrow = modal.querySelector('#qs-modal-eyebrow');
    const go = modal.querySelector('#qs-modal-go');
    if (eyebrow) eyebrow.textContent = goingToPause ? 'Paused' : 'How to play';
    if (go) go.textContent = goingToPause ? 'Resume' : 'Start room';
    setPaused(goingToPause);
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') pauseBtn.click();
  });

  // ── Timer + end screens ──────────────────────────────────────────────────
  let firedTimeUp = false;
  function paintTimer(): void {
    timer.textContent = fmt(remaining);
    timer.classList.toggle('warn', remaining <= 300 && remaining > 60);
    timer.classList.toggle('danger', remaining <= 60);
  }
  function showEnd(kind: 'win' | 'fail', heading: string, sub: string, retry: boolean): void {
    setPaused(false);
    modal.classList.remove('show');
    const end = document.createElement('div');
    end.className = `qs-end ${kind}`;
    end.innerHTML =
      `<h1>${heading}</h1><p>${sub}</p><div class="actions">` +
      (retry ? `<button class="qs-btn" id="qs-retry">Try again</button>` : '') +
      `<a class="qs-btn" href="index.html">Back to menu</a></div>`;
    document.body.appendChild(end);
    requestAnimationFrame(() => end.classList.add('show'));
    end.querySelector('#qs-retry')?.addEventListener('click', () => window.location.reload());
  }

  return {
    setStageTitle(text) {
      // Split "Adventure — n/n: Stage" into a serif title + small sub-line.
      const parts = text.split(' — ');
      title.innerHTML = parts[1]
        ? `${parts[0]}<small>${parts[1]}</small>`
        : text;
    },
    isPaused() {
      return paused;
    },
    snack(text, kind = 'toast') {
      if (kind === 'objective') {
        if (objectiveEl) (objectiveEl.firstChild as HTMLElement).textContent = text;
        else objectiveEl = makeSnack(text, true);
        return;
      }
      const el = makeSnack(text, false);
      toastEls.push(el);
      while (toastEls.length > MAX_TOASTS) {
        const oldest = toastEls.shift();
        if (oldest) dismiss(oldest);
      }
      setTimeout(() => {
        dismiss(el);
        const i = toastEls.indexOf(el);
        if (i >= 0) toastEls.splice(i, 1);
      }, 6000);
    },
    stopTimer() {
      running = false;
    },
    celebrate(heading, sub) {
      running = false;
      showEnd('win', heading, sub, false);
    },
    tick(delta) {
      if (!running || paused) return;
      remaining -= delta;
      if (remaining <= 0) {
        remaining = 0;
        running = false;
        paintTimer();
        if (!firedTimeUp) {
          firedTimeUp = true;
          options.onTimeUp?.();
          showEnd('fail', "TIME'S UP", 'The room reset around you. Nobody escaped this run.', true);
        }
        return;
      }
      paintTimer();
    },
  };
}
