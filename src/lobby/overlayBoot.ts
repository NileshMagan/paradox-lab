import { mountGameOverlay } from './overlay';

/**
 * Overlay bootstrap for The Quantum Split (quantum.html). Kept separate from
 * the game's own bootstrap (src/main.ts) so the lobby chrome layers *over* the
 * game without editing game code: it mounts the shared top bar + countdown and
 * runs its own clock. Win detection is read-only — it polls the game's existing
 * `window.__qs.solved()` bridge for the final `core.lever` solve and freezes
 * the clock so a late escape never trips the time-up screen.
 */

interface QsBridge {
  solved?: () => string[];
}

const overlay = mountGameOverlay({ title: 'The Quantum Split' });

let last = performance.now();
let won = false;

function loop(now: number): void {
  const delta = (now - last) / 1000;
  last = now;
  overlay.tick(delta);
  if (!won) {
    const bridge = (window as unknown as { __qs?: QsBridge }).__qs;
    if (bridge?.solved?.().includes('core.lever')) {
      won = true;
      overlay.stopTimer(); // the game's own "TIMELINES MERGED" ending takes over
    }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
