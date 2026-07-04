import { readLaunchParams } from './settings';

/**
 * In-game chrome shared by every game entry: a slim top bar (back-to-menu,
 * room code, title) and the mission countdown. It's a self-contained DOM
 * overlay driven purely by the launch params — it never touches the Three.js
 * scene or any game state, so it can sit over the co-op game and the solo
 * adventures alike without coupling to either.
 *
 *   mountGameOverlay({ title: 'The Quantum Split', onTimeUp })
 *
 * The returned handle lets a game stop the clock on victory.
 */

export interface OverlayOptions {
  title: string;
  /** Called once when the countdown hits zero (if a timer is set). */
  onTimeUp?: () => void;
}

export interface GameOverlay {
  /** Freeze the countdown (call on win so the clock stops mid-run). */
  stopTimer(): void;
  /** Show the shared victory banner (games with their own ending can skip). */
  celebrate(title: string, subtitle: string): void;
  /** Advance the countdown; drive from the game's animation loop. */
  tick(deltaSeconds: number): void;
}

const BAR_CSS = `
.qs-overlay-bar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 30;
  display: flex; align-items: center; gap: 14px;
  padding: 10px 16px;
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  color: #d6ecff;
  background: linear-gradient(180deg, rgba(4,8,14,0.82) 0%, rgba(4,8,14,0) 100%);
  pointer-events: none;
}
.qs-overlay-bar > * { pointer-events: auto; }
.qs-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 7px 13px; border-radius: 8px;
  border: 1px solid rgba(120,150,180,0.28);
  background: rgba(12,18,28,0.72);
  color: #cfe0f2; font: inherit; font-size: 13px; cursor: pointer;
  text-decoration: none; transition: border-color .15s, background .15s, color .15s;
}
.qs-btn:hover { border-color: rgba(120,180,230,0.7); color: #fff; background: rgba(20,30,44,0.9); }
.qs-chip {
  display: inline-flex; align-items: baseline; gap: 8px;
  padding: 7px 13px; border-radius: 8px;
  border: 1px solid rgba(120,150,180,0.2);
  background: rgba(10,16,24,0.6); font-size: 13px;
}
.qs-chip .k { color: #7f96ad; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
.qs-chip .v { color: #eaf4ff; letter-spacing: .14em; font-weight: 600; }
.qs-title { font-size: 14px; color: #9fb6cc; letter-spacing: .05em; }
.qs-spacer { flex: 1; }
.qs-timer {
  font-variant-numeric: tabular-nums; font-size: 20px; font-weight: 700;
  padding: 6px 14px; border-radius: 8px; letter-spacing: .06em;
  border: 1px solid rgba(120,150,180,0.24); background: rgba(10,16,24,0.72);
  color: #eaf4ff; transition: color .3s, border-color .3s, background .3s;
}
.qs-timer.warn { color: #ffd98a; border-color: rgba(255,190,90,0.6); }
.qs-timer.danger {
  color: #ff8a8a; border-color: rgba(255,90,90,0.7);
  animation: qs-pulse 1s ease-in-out infinite;
}
@keyframes qs-pulse { 0%,100% { opacity: 1; } 50% { opacity: .55; } }
.qs-dev {
  padding: 5px 10px; border-radius: 6px; font-size: 11px; letter-spacing: .12em;
  border: 1px solid rgba(120,255,180,0.4); color: #9dffce; background: rgba(10,30,20,0.6);
}
.qs-end {
  position: fixed; inset: 0; z-index: 40;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; text-align: center;
  font-family: ui-monospace, monospace; color: #eaffff;
  background: rgba(2,4,8,0.86); backdrop-filter: blur(3px);
  opacity: 0; transition: opacity .8s; pointer-events: none;
}
.qs-end.show { opacity: 1; pointer-events: auto; }
.qs-end h1 { margin: 0; font-size: 40px; letter-spacing: .16em; }
.qs-end.fail h1 { color: #ff8a8a; text-shadow: 0 0 30px rgba(255,80,80,0.6); }
.qs-end.win h1 { color: #eaffff; text-shadow: 0 0 30px rgba(46,220,255,0.7); }
.qs-end p { margin: 0; font-size: 17px; opacity: .8; }
.qs-end .actions { display: flex; gap: 12px; margin-top: 12px; }
`;

function injectCss(): void {
  if (document.getElementById('qs-overlay-css')) return;
  const style = document.createElement('style');
  style.id = 'qs-overlay-css';
  style.textContent = BAR_CSS;
  document.head.appendChild(style);
}

function fmt(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function mountGameOverlay(options: OverlayOptions): GameOverlay {
  injectCss();
  const cfg = readLaunchParams();

  const bar = document.createElement('div');
  bar.className = 'qs-overlay-bar';

  const back = document.createElement('a');
  back.className = 'qs-btn';
  back.href = 'index.html';
  back.innerHTML = '&larr; Menu';

  const title = document.createElement('span');
  title.className = 'qs-title';
  title.textContent = options.title;

  bar.append(back, title);

  if (cfg.roomCode) {
    const chip = document.createElement('span');
    chip.className = 'qs-chip';
    chip.innerHTML = `<span class="k">Room</span><span class="v">${cfg.roomCode}</span>`;
    bar.append(chip);
  }

  const diffChip = document.createElement('span');
  diffChip.className = 'qs-chip';
  diffChip.innerHTML = `<span class="k">Mode</span><span class="v">${cfg.difficulty}</span>`;
  bar.append(diffChip);

  if (cfg.dev) {
    const dev = document.createElement('span');
    dev.className = 'qs-dev';
    dev.textContent = 'DEV';
    bar.append(dev);
  }

  const spacer = document.createElement('span');
  spacer.className = 'qs-spacer';
  bar.append(spacer);

  let remaining = cfg.timerMinutes * 60;
  let running = cfg.timerMinutes > 0;
  let firedTimeUp = false;

  const timer = document.createElement('span');
  timer.className = 'qs-timer';
  if (running) {
    timer.textContent = fmt(remaining);
    bar.append(timer);
  }

  document.body.appendChild(bar);

  function paintTimer(): void {
    timer.textContent = fmt(remaining);
    timer.classList.toggle('warn', remaining <= 300 && remaining > 60);
    timer.classList.toggle('danger', remaining <= 60);
  }

  function showEnd(kind: 'win' | 'fail', heading: string, sub: string, retry: boolean): void {
    const end = document.createElement('div');
    end.className = `qs-end ${kind}`;
    const actions = retry
      ? `<button class="qs-btn" id="qs-retry">Try again</button>`
      : '';
    end.innerHTML =
      `<h1>${heading}</h1><p>${sub}</p>` +
      `<div class="actions">${actions}` +
      `<a class="qs-btn" href="index.html">Back to menu</a></div>`;
    document.body.appendChild(end);
    requestAnimationFrame(() => end.classList.add('show'));
    end.querySelector('#qs-retry')?.addEventListener('click', () => window.location.reload());
  }

  return {
    stopTimer() {
      running = false;
    },
    celebrate(heading, sub) {
      running = false;
      showEnd('win', heading, sub, false);
    },
    tick(delta) {
      if (!running) return;
      remaining -= delta;
      if (remaining <= 0) {
        remaining = 0;
        running = false;
        paintTimer();
        if (!firedTimeUp) {
          firedTimeUp = true;
          options.onTimeUp?.();
          showEnd('fail', "TIME'S UP", 'The lab reset around you. Nobody escaped this run.', true);
        }
        return;
      }
      paintTimer();
    },
  };
}
