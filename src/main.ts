import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ensureAudio } from '@/core/audio';
import { Engine } from '@/core/Engine';
import { ViewNavigator } from '@/core/ViewNavigator';
import type { Dimension } from '@/dimensions/Dimension';
import { AlphaDimension } from '@/dimensions/alpha/AlphaDimension';
import { BetaDimension } from '@/dimensions/beta/BetaDimension';
import { Interactor } from '@/systems/interaction/Interactor';
import { session } from '@/systems/puzzle/session';
import { puzzleState, type PuzzleId } from '@/systems/puzzle/state';
import { DimensionId } from '@/types';
import { setHoverLabel } from '@/ui/interactionHud';
import '@/ui/devHud';
import '@/ui/objectivesHud';
import '@/ui/victory';

/**
 * Single-client bootstrap. Dev navigation:
 *   [1]/[2]  switch dimension (stand-in for per-player assignment)
 *   [Q]/[E]  previous / next room
 *   [0]      toggle admin overview (bird's-eye dollhouse, ceilings hidden)
 * URL params: ?dim=alpha|beta  ?view=overview  ?room=1..3
 *             ?solve=sync.frequency,… (pre-solve puzzles, for dev/testing)
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
const interactor = new Interactor(engine.camera, engine.renderer.domElement);
interactor.onHoverChange = setHoverLabel;

// Gate lights + per-frame animation to the room in view (or all, in overview).
// ViewNavigator fires `view:change` on every focus/room/overview change, so
// this keeps the active dimension rendering only ~10 lights instead of ~30.
function syncActiveRoom(): void {
  dimensions[active].setActiveRoom(navigator.isOverview ? null : navigator.focusedRoomIndex);
}
window.addEventListener('view:change', syncActiveRoom);

function activate(id: DimensionId): void {
  active = id;
  engine.setScene(dimensions[id].scene);
  navigator.refresh(); // re-apply overview/ceiling state to the new scene
  interactor.setTargets(dimensions[id].interactables);
  window.dispatchEvent(new CustomEvent('dimension:change', { detail: id }));
}
activate(active);

// Dev helpers: pre-solve puzzles from the URL, e.g. ?solve=sync.frequency.
for (const id of params.get('solve')?.split(',') ?? []) {
  puzzleState.solve(id.trim() as PuzzleId);
}

// Initial view from URL (handy for headless verification and deep links).
if (params.get('view') === 'overview') navigator.toggleOverview();
else navigator.focusRoom((Number(params.get('room')) || 1) - 1);

// WebAudio can only start after a user gesture.
window.addEventListener('pointerdown', ensureAudio, { once: true });

engine.onUpdate((delta, elapsed) => {
  controls.update();
  interactor.update();
  dimensions[active].update(delta, elapsed);
});

const ALL_PUZZLES: readonly PuzzleId[] = [
  'sync.frequency',
  'sync.starmap',
  'grid.chemical',
  'grid.bloom',
  'grid.server',
  'core.anchor',
  'core.mirrors',
  'core.lever',
];

/**
 * Dev/test bridge: lets the scripted walkthrough (scripts/walkthrough.mjs)
 * and manual console poking drive the SAME interactables the mouse raycast
 * hits, without needing pixel coordinates for 3D objects. Not part of the
 * shipped game loop — nothing in-game reads it.
 */
interface QuantumSplitDebug {
  activate: (id: DimensionId) => void;
  focusRoom: (index: number) => void;
  overview: () => void;
  /** Hover-labels of the active dimension's hotspots (🔒 when disabled). */
  hotspots: () => string[];
  /** Click the first enabled hotspot whose label matches. True if it fired. */
  interact: (labelSubstring: string) => boolean;
  solved: () => PuzzleId[];
  session: typeof session;
  /** Lights the renderer processes this frame: total in scene vs. lit. */
  lightStats: () => { total: number; visible: number };
  /** Force every light on/off — for perf A/B only; a room switch resets it. */
  setAllLights: (on: boolean) => void;
}
declare global {
  interface Window {
    __qs?: QuantumSplitDebug;
  }
}
window.__qs = {
  activate,
  focusRoom: (index) => navigator.focusRoom(index),
  overview: () => navigator.toggleOverview(),
  hotspots: () =>
    dimensions[active].interactables.map(
      (i) => `${(i.enabled?.() ?? true) ? '' : '🔒 '}${i.label()}`,
    ),
  interact: (labelSubstring) => {
    const target = dimensions[active].interactables.find(
      (i) => i.label().toLowerCase().includes(labelSubstring.toLowerCase()) && (i.enabled?.() ?? true),
    );
    if (!target) return false;
    target.onInteract();
    return true;
  },
  solved: () => ALL_PUZZLES.filter((id) => puzzleState.isSolved(id)),
  session,
  lightStats: () => {
    let total = 0;
    let visible = 0;
    dimensions[active].scene.traverse((o) => {
      if (o instanceof THREE.Light) {
        total += 1;
        if (o.visible) visible += 1;
      }
    });
    return { total, visible };
  },
  setAllLights: (on) => {
    dimensions[active].scene.traverse((o) => {
      if (o instanceof THREE.Light) o.visible = on;
    });
  },
};

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
