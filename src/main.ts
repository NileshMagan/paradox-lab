import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Engine } from '@/core/Engine';
import { ViewNavigator } from '@/core/ViewNavigator';
import type { Dimension } from '@/dimensions/Dimension';
import { AlphaDimension } from '@/dimensions/alpha/AlphaDimension';
import { BetaDimension } from '@/dimensions/beta/BetaDimension';
import { DimensionId } from '@/types';
import '@/ui/devHud';

/**
 * Single-client bootstrap. Dev navigation:
 *   [1]/[2]  switch dimension (stand-in for per-player assignment)
 *   [Q]/[E]  previous / next room
 *   [0]      toggle admin overview (bird's-eye dollhouse, ceilings hidden)
 * URL params: ?dim=alpha|beta  ?view=overview  ?room=1..3
 */
const container = document.getElementById('app');
if (!container) throw new Error('#app container not found');

const engine = new Engine(container);
const controls = new OrbitControls(engine.camera, engine.renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.4;

const dimensions: Record<DimensionId, Dimension> = {
  [DimensionId.Alpha]: new AlphaDimension().build(),
  [DimensionId.Beta]: new BetaDimension().build(),
};

const params = new URLSearchParams(window.location.search);
let active: DimensionId = params.get('dim') === 'beta' ? DimensionId.Beta : DimensionId.Alpha;

const navigator = new ViewNavigator(engine.camera, controls, () => dimensions[active].scene);

function activate(id: DimensionId): void {
  active = id;
  engine.setScene(dimensions[id].scene);
  navigator.refresh(); // re-apply overview/ceiling state to the new scene
  window.dispatchEvent(new CustomEvent('dimension:change', { detail: id }));
}
activate(active);

// Initial view from URL (handy for headless verification and deep links).
if (params.get('view') === 'overview') navigator.toggleOverview();
else navigator.focusRoom((Number(params.get('room')) || 1) - 1);

engine.onUpdate((delta, elapsed) => {
  controls.update();
  dimensions[active].update(delta, elapsed);
});

window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case '1':
      activate(DimensionId.Alpha);
      break;
    case '2':
      activate(DimensionId.Beta);
      break;
    case 'q':
    case 'Q':
      navigator.stepRoom(-1);
      break;
    case 'e':
    case 'E':
      navigator.stepRoom(1);
      break;
    case '0':
      navigator.toggleOverview();
      break;
  }
});

engine.start();
