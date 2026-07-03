import { puzzleState } from '@/systems/puzzle/state';

/**
 * The escape ending: when `core.lever` solves, a white "timelines merging"
 * flash washes the screen, then resolves into the victory card. Pure DOM
 * overlay — the 3D scene keeps running underneath, which reads as the two
 * dimensions collapsing into one.
 */

function showVictory(): void {
  const flash = document.createElement('div');
  flash.style.cssText = [
    'position:fixed',
    'inset:0',
    'background:#fff',
    'opacity:0',
    'transition:opacity 1.6s ease-in',
    'pointer-events:none',
    'z-index:20',
  ].join(';');
  document.body.appendChild(flash);

  const card = document.createElement('div');
  card.style.cssText = [
    'position:fixed',
    'inset:0',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'justify-content:center',
    'gap:14px',
    'font-family:ui-monospace,monospace',
    'color:#eaffff',
    'text-align:center',
    'opacity:0',
    'transition:opacity 1.2s',
    'pointer-events:none',
    'z-index:21',
    'text-shadow:0 0 24px rgba(46,220,255,0.8)',
  ].join(';');
  card.innerHTML =
    '<div style="font-size:44px;letter-spacing:0.18em">TIMELINES MERGED</div>' +
    '<div style="font-size:20px;opacity:0.85">The paradox collapses. One lab. One moment.</div>' +
    '<div style="font-size:16px;opacity:0.6;margin-top:10px">YOU ESCAPED — THE QUANTUM SPLIT</div>';
  document.body.appendChild(card);

  // Flash → hold white → fade the flash into the card.
  requestAnimationFrame(() => (flash.style.opacity = '1'));
  setTimeout(() => {
    flash.style.transition = 'opacity 3s ease-out';
    flash.style.opacity = '0.15';
    card.style.opacity = '1';
  }, 2000);
}

puzzleState.onSolved((id) => {
  if (id === 'core.lever') showVictory();
});
