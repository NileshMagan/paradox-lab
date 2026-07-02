import type { Interactable } from '@/rooms/types';
import { puzzleState } from '@/systems/puzzle/state';

/**
 * Interaction overlay: a hover label above the bottom edge and transient
 * toasts up top. Rooms fire toasts via `window.dispatchEvent(new CustomEvent(
 * 'game:toast', { detail: '…' }))` so they don't import UI directly.
 */

const label = document.createElement('div');
label.style.cssText = [
  'position:fixed',
  'bottom:48px',
  'left:50%',
  'transform:translateX(-50%)',
  'font:14px/1.4 ui-monospace,monospace',
  'color:#eaffff',
  'background:rgba(0,10,14,0.72)',
  'border:1px solid rgba(46,220,255,0.35)',
  'padding:7px 14px',
  'border-radius:6px',
  'pointer-events:none',
  'z-index:11',
  'display:none',
  'max-width:70vw',
  'text-align:center',
].join(';');
document.body.appendChild(label);

const toasts = document.createElement('div');
toasts.style.cssText = [
  'position:fixed',
  'top:14px',
  'left:50%',
  'transform:translateX(-50%)',
  'display:flex',
  'flex-direction:column',
  'gap:6px',
  'align-items:center',
  'pointer-events:none',
  'z-index:12',
].join(';');
document.body.appendChild(toasts);

export function setHoverLabel(target: Interactable | null): void {
  if (!target) {
    label.style.display = 'none';
    return;
  }
  const locked = target.enabled ? !target.enabled() : false;
  label.innerHTML = locked ? `🔒 ${target.label()}` : target.label();
  label.style.opacity = locked ? '0.75' : '1';
  label.style.display = 'block';
}

export function toast(text: string, ms = 3600): void {
  const el = document.createElement('div');
  el.style.cssText = [
    'font:13px/1.4 ui-monospace,monospace',
    'color:#dffcff',
    'background:rgba(0,14,20,0.85)',
    'border:1px solid rgba(46,220,255,0.5)',
    'padding:8px 16px',
    'border-radius:6px',
    'transition:opacity 0.4s',
  ].join(';');
  el.textContent = text;
  toasts.appendChild(el);
  setTimeout(() => (el.style.opacity = '0'), ms - 400);
  setTimeout(() => el.remove(), ms);
}

window.addEventListener('game:toast', (e) => toast((e as CustomEvent<string>).detail));

const SOLVE_TOASTS: Record<string, string> = {
  'sync.frequency': '✓ FREQUENCY ACCEPTED — star map decrypted on Beta’s console',
  'sync.starmap': '✓ MURAL ALIGNED — the Sync Chamber doors release',
};
puzzleState.onSolved((id) => toast(SOLVE_TOASTS[id] ?? `✓ ${id} solved`));
