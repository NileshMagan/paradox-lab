import type { Difficulty } from './settings';

/**
 * Difficulty-aware hint controller for the solo adventures. Mounts a floating
 * "Hint" button that surfaces the current stage's crux hint, and — on easier
 * difficulties — nudges on its own after a stretch of no progress. This is
 * where the lobby's difficulty + hints settings actually reach gameplay:
 *
 *   easier  → hints come fast and free
 *   harder  → longer waits, longer cooldowns, no auto-nudge
 *
 * It's a self-contained DOM widget driven by tick(delta); it never touches the
 * scene. Feed it the live hint text with setHint() and reset the idle clock on
 * real progress with notifyProgress().
 */

interface HintTuning {
  /** Seconds of no progress before the button starts glowing to offer help. */
  idle: number;
  /** Seconds between manual hint reveals. */
  cooldown: number;
  /** Reveal the hint automatically once idle (casual only). */
  auto: boolean;
}

const TUNING: Record<Difficulty, HintTuning> = {
  casual: { idle: 25, cooldown: 0, auto: true },
  standard: { idle: 45, cooldown: 25, auto: false },
  expert: { idle: 90, cooldown: 60, auto: false },
};

export interface HintController {
  /** Update the hint text for the current step/stage. */
  setHint(text: string): void;
  /** Call when the player makes real progress — resets the idle clock. */
  notifyProgress(): void;
  /** Drive from the game loop. */
  tick(deltaSeconds: number): void;
}

const CSS = `
.qs-hint-btn {
  position: fixed; right: 16px; bottom: 16px; z-index: 32;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 16px; border-radius: 999px; cursor: pointer;
  font: 13px/1 ui-monospace, monospace; letter-spacing: .04em;
  color: #ffe6a8; background: rgba(20,16,8,0.82);
  border: 1px solid rgba(255,200,110,0.4);
  transition: transform .15s, box-shadow .25s, opacity .2s, color .2s;
}
.qs-hint-btn:hover { transform: translateY(-1px); color: #fff4d8; }
.qs-hint-btn[disabled] { opacity: .4; cursor: default; }
.qs-hint-btn.offer {
  animation: qs-hint-glow 1.6s ease-in-out infinite;
  border-color: rgba(255,200,110,0.9);
}
@keyframes qs-hint-glow {
  0%,100% { box-shadow: 0 0 0 0 rgba(255,200,110,0.0); }
  50% { box-shadow: 0 0 18px 2px rgba(255,200,110,0.5); }
}
.qs-hint-pop {
  position: fixed; right: 16px; bottom: 66px; z-index: 33; max-width: 340px;
  padding: 12px 15px; border-radius: 12px;
  font: 13px/1.55 ui-monospace, monospace; color: #fff4d8;
  background: rgba(24,18,8,0.94); border: 1px solid rgba(255,200,110,0.5);
  box-shadow: 0 12px 40px -12px rgba(0,0,0,0.8);
  opacity: 0; transform: translateY(6px); transition: opacity .25s, transform .25s;
  pointer-events: none;
}
.qs-hint-pop.show { opacity: 1; transform: translateY(0); }
.qs-hint-pop .k { color: #ffcf7a; letter-spacing: .12em; font-size: 11px; }
`;

function injectCss(): void {
  if (document.getElementById('qs-hint-css')) return;
  const style = document.createElement('style');
  style.id = 'qs-hint-css';
  style.textContent = CSS;
  document.head.appendChild(style);
}

export function mountHints(difficulty: Difficulty): HintController {
  injectCss();
  const tune = TUNING[difficulty];

  const btn = document.createElement('button');
  btn.className = 'qs-hint-btn';
  btn.type = 'button';
  btn.innerHTML = `💡 Hint`;

  const pop = document.createElement('div');
  pop.className = 'qs-hint-pop';

  document.body.append(btn, pop);

  let hint = '';
  let idle = 0;
  let cooldown = 0;
  let offered = false;
  let popTimer = 0;

  function reveal(): void {
    if (!hint) return;
    pop.innerHTML = `<span class="k">HINT</span><br/>${hint}`;
    pop.classList.add('show');
    popTimer = 8;
    cooldown = tune.cooldown;
    idle = 0;
    offered = false;
    btn.classList.remove('offer');
  }

  btn.addEventListener('click', () => {
    if (cooldown > 0 || !hint) return;
    reveal();
  });

  function refreshDisabled(): void {
    const blocked = !hint || cooldown > 0;
    btn.toggleAttribute('disabled', blocked);
    btn.textContent = cooldown > 0 ? `💡 ${Math.ceil(cooldown)}s` : '💡 Hint';
  }

  return {
    setHint(text) {
      hint = text;
      refreshDisabled();
    },
    notifyProgress() {
      idle = 0;
      offered = false;
      btn.classList.remove('offer');
      pop.classList.remove('show');
    },
    tick(delta) {
      if (cooldown > 0) {
        cooldown = Math.max(0, cooldown - delta);
        refreshDisabled();
      }
      if (popTimer > 0) {
        popTimer -= delta;
        if (popTimer <= 0) pop.classList.remove('show');
      }
      if (!hint || cooldown > 0) return;
      idle += delta;
      if (idle >= tune.idle && !offered) {
        offered = true;
        if (tune.auto) reveal();
        else btn.classList.add('offer');
      }
    },
  };
}
