import * as THREE from 'three';
import { ensureAudio } from '@/core/audio';
import { Engine } from '@/core/Engine';
import { FirstPersonControls } from '@/core/FirstPersonControls';
import { FACILITY } from '@/config/facility';
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
 * Single-client bootstrap. First-person navigation (the camera IS the player):
 *   drag / swipe  look around
 *   arrow keys / WASD / ▲ button  walk (clamped inside the facility)
 *   tap a hotspot  interact
 *   [1]/[2]  switch dimension (stand-in for per-player assignment)
 *   [Q]/[E]  teleport to previous / next room
 *   [0]      toggle admin overview (bird's-eye dollhouse, ceilings hidden)
 * URL params: ?dim=alpha|beta  ?view=overview  ?room=1..3
 *             ?solve=sync.frequency,… (pre-solve puzzles, for dev/testing)
 */
const container = document.getElementById('app');
if (!container) throw new Error('#app container not found');

const engine = new Engine(container);
const controls = new FirstPersonControls(engine.camera, engine.renderer.domElement);

const dimensions: Record<DimensionId, Dimension> = {
  [DimensionId.Alpha]: new AlphaDimension().build(),
  [DimensionId.Beta]: new BetaDimension().build(),
};

const params = new URLSearchParams(window.location.search);
let active: DimensionId = params.get('dim') === 'beta' ? DimensionId.Beta : DimensionId.Alpha;

const interactor = new Interactor(engine.camera, engine.renderer.domElement);
interactor.onHoverChange = setHoverLabel;

// ── First-person navigation over the facility footprint ──────────────────────
const ADMIN_LIGHT = 'admin-inspection-light';
const EYE = 1.6;

// Walkable box: the union of all room footprints (no collision on interior
// walls yet — this just keeps the player inside the building).
let minX = Infinity;
let maxX = -Infinity;
let minZ = Infinity;
let maxZ = -Infinity;
for (const r of FACILITY) {
  minX = Math.min(minX, r.center.x - r.size.x / 2);
  maxX = Math.max(maxX, r.center.x + r.size.x / 2);
  minZ = Math.min(minZ, r.center.z - r.size.z / 2);
  maxZ = Math.max(maxZ, r.center.z + r.size.z / 2);
}
controls.setBounds({ minX: minX + 0.6, maxX: maxX - 0.6, minZ: minZ + 0.6, maxZ: maxZ - 0.6, eyeY: EYE });

/** Which room the player currently stands in (by z containment, else nearest). */
function roomAt(z: number): number {
  for (let i = 0; i < FACILITY.length; i++) {
    const r = FACILITY[i];
    if (z <= r.center.z + r.size.z / 2 && z >= r.center.z - r.size.z / 2) return i;
  }
  let best = 0;
  let bestDist = Infinity;
  FACILITY.forEach((r, i) => {
    const d = Math.abs(z - r.center.z);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

let overview = false;
let curRoom = -1;

/** Ceilings / fog / admin light per overview state, on the active scene. */
function applySceneState(): void {
  const scene = dimensions[active].scene;
  scene.traverse((obj) => {
    if (obj.name === 'ceiling') obj.visible = !overview;
  });
  if (overview) {
    if (scene.fog) scene.userData.gameFog = scene.fog;
    scene.fog = null;
    let light = scene.getObjectByName(ADMIN_LIGHT);
    if (!light) {
      light = new THREE.HemisphereLight(0xcfd8e6, 0x40382e, 2.2);
      light.name = ADMIN_LIGHT;
      scene.add(light);
    }
    light.visible = true;
  } else {
    if (scene.userData.gameFog) scene.fog = scene.userData.gameFog as THREE.FogExp2;
    const light = scene.getObjectByName(ADMIN_LIGHT);
    if (light) light.visible = false;
  }
}

function fireViewChange(): void {
  const label = overview
    ? 'ADMIN OVERVIEW — whole facility'
    : `Room ${curRoom + 1}/${FACILITY.length}: ${FACILITY[Math.max(0, curRoom)].id}`;
  window.dispatchEvent(new CustomEvent('view:change', { detail: label }));
}

function focusRoom(index: number): void {
  if (overview) {
    overview = false;
    applySceneState();
    controls.enabled = true;
  }
  const i = ((index % FACILITY.length) + FACILITY.length) % FACILITY.length;
  const r = FACILITY[i];
  controls.place(r.center.x, r.center.z, 0); // stand in the room, looking down −Z
  curRoom = i;
  dimensions[active].setActiveRoom(i);
  fireViewChange();
}

function stepRoom(step: 1 | -1): void {
  focusRoom((curRoom < 0 ? 0 : curRoom) + step);
}

function toggleOverview(): void {
  overview = !overview;
  applySceneState();
  controls.enabled = !overview;
  if (overview) {
    // Bird's-eye of the whole facility (it runs roughly z:+4 → −42).
    engine.camera.position.set(20, 30, -19);
    engine.camera.lookAt(0, 0, -19);
    dimensions[active].setActiveRoom(null);
  } else {
    focusRoom(curRoom < 0 ? 0 : curRoom);
  }
  fireViewChange();
}

function activate(id: DimensionId): void {
  active = id;
  engine.setScene(dimensions[id].scene);
  applySceneState();
  dimensions[id].setActiveRoom(overview ? null : curRoom);
  interactor.setTargets(dimensions[id].interactables);
  window.dispatchEvent(new CustomEvent('dimension:change', { detail: id }));
}
activate(active);

// Dev helpers: pre-solve puzzles from the URL, e.g. ?solve=sync.frequency.
for (const id of params.get('solve')?.split(',') ?? []) {
  puzzleState.solve(id.trim() as PuzzleId);
}

// Initial view from URL.
if (params.get('view') === 'overview') toggleOverview();
else focusRoom((Number(params.get('room')) || 1) - 1);

// WebAudio can only start after a user gesture.
window.addEventListener('pointerdown', ensureAudio, { once: true });

// On-screen forward pad (touch / click-hold).
const forwardBtn = document.getElementById('forward');
if (forwardBtn) {
  const press = (on: boolean) => () => (controls.moveForward = on);
  forwardBtn.addEventListener('pointerdown', press(true));
  forwardBtn.addEventListener('pointerup', press(false));
  forwardBtn.addEventListener('pointerleave', press(false));
  forwardBtn.addEventListener('pointercancel', press(false));
}

engine.onUpdate((delta, elapsed) => {
  controls.update(delta);
  interactor.update();
  if (!overview) {
    const room = roomAt(engine.camera.position.z);
    if (room !== curRoom) {
      curRoom = room;
      dimensions[active].setActiveRoom(room);
      fireViewChange();
    }
  }
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
  focusRoom,
  overview: toggleOverview,
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
      stepRoom(-1);
      break;
    case 'e':
    case 'E':
      stepRoom(1);
      break;
    case '0':
      toggleOverview();
      break;
  }
});

engine.start();
