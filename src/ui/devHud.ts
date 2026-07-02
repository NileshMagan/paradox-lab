import { DIMENSION_THEME } from '@/config/constants';
import { DimensionId } from '@/types';

/**
 * Minimal dev-only overlay: shows the active dimension + view and the key
 * bindings. Not part of the shipped UI — purely to make the blockout legible.
 */
const hud = document.createElement('div');
hud.style.cssText = [
  'position:fixed',
  'top:12px',
  'left:12px',
  'font:13px/1.5 ui-monospace,monospace',
  'color:#cfe',
  'background:rgba(0,0,0,0.55)',
  'padding:8px 12px',
  'border-radius:6px',
  'pointer-events:none',
  'z-index:10',
].join(';');
document.body.appendChild(hud);

let dimension: DimensionId = DimensionId.Alpha;
let view = '';

function render(): void {
  hud.innerHTML =
    `<strong>${DIMENSION_THEME[dimension].label}</strong> (${dimension})<br/>` +
    `${view}<br/>` +
    `[1] Alpha · [2] Beta · [Q]/[E] rooms · [0] admin overview · drag to look`;
}

window.addEventListener('dimension:change', (e) => {
  dimension = (e as CustomEvent<DimensionId>).detail;
  render();
});
window.addEventListener('view:change', (e) => {
  view = (e as CustomEvent<string>).detail;
  render();
});
render();
