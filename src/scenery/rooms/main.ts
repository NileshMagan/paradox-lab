import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Engine } from '@/core/Engine';
import { composeRoom, type ComposedRoom, type RoomSpec } from '@/scenery/compose';
import { ClickRouter, type GameFactory, type RoomGame } from '@/scenery/play';
import { agencyBureau } from './agencyBureau';
import { bureauGame } from './bureauGame';
import { egyptianTomb } from './egyptianTomb';
import { tombGame } from './tombGame';

/**
 * Composed-room viewer + play harness. Dev page: `npm run dev` → /rooms.html.
 * Rooms are PLAYABLE here: click props to work the puzzle chain.
 *
 *   [1] / [2]   switch room        [V] cycle camera
 *   [C]         toggle ceiling     [R] restart (reseeded)
 *
 * `window.__composedRooms` drives clicks by id for E2E tests.
 */

const ROOMS: Array<{ spec: RoomSpec; game: GameFactory }> = [
  { spec: egyptianTomb, game: tombGame },
  { spec: agencyBureau, game: bureauGame },
];

const container = document.getElementById('app');
if (!container) throw new Error('#app container not found');
const engine = new Engine(container);
const scene = engine.scene;
scene.background = new THREE.Color(0x07090d);
const controls = new OrbitControls(engine.camera, engine.renderer.domElement);
controls.enableDamping = true;

const objectiveEl = document.getElementById('objective');
const toastEl = document.getElementById('toast');
const nameEl = document.getElementById('room-name');
let toastTimer = 0;

let current: ComposedRoom | null = null;
let game: RoomGame | null = null;
let router = new ClickRouter();
let roomIndex = 0;
let reseed = 0;
let ceilingHidden = true;
let view = 1; // start at eye level — it's a playable room, not an exhibit
let won = false;

function applyView(): void {
  const { w, h, d } = ROOMS[roomIndex].spec.size;
  if (view === 0) {
    engine.camera.position.set(0, h * 2.6, d * 0.85);
    controls.target.set(0, 0.5, 0);
  } else if (view === 1) {
    engine.camera.position.set(0, 1.65, d / 2 - 1);
    controls.target.set(0, 1.3, -d / 4);
  } else {
    engine.camera.position.set(w / 2 - 0.8, h - 0.6, d / 2 - 0.8);
    controls.target.set(0, 0.9, 0);
  }
}

function applyCeiling(): void {
  current?.group.traverse((obj) => {
    if (obj.name === 'ceiling') obj.visible = !ceilingHidden;
  });
}

function load(): void {
  if (current) {
    scene.remove(current.group);
    current.dispose();
  }
  router = new ClickRouter();
  won = false;
  const { spec, game: factory } = ROOMS[roomIndex];
  const seeded: RoomSpec = reseed === 0 ? spec : { ...spec, seed: `${spec.seed}:r${reseed}` };
  current = composeRoom(seeded);
  scene.add(current.group);
  game = factory(current.handles, {
    register: (id, object, onClick) => router.register(id, object, onClick),
    toast: (text) => {
      if (toastEl) {
        toastEl.textContent = text;
        toastTimer = 6;
      }
    },
    setObjective: (text) => {
      if (objectiveEl) objectiveEl.textContent = `▸ ${text}`;
    },
    win: (text) => {
      won = true;
      if (objectiveEl) objectiveEl.textContent = '★ ESCAPED';
      if (toastEl) {
        toastEl.textContent = text;
        toastTimer = 60;
      }
    },
  });
  applyCeiling();
  applyView();
  if (nameEl) nameEl.textContent = `${spec.name} — seed ${seeded.seed}`;
}
load();

window.addEventListener('keydown', (event) => {
  const digit = Number.parseInt(event.key, 10);
  if (digit >= 1 && digit <= ROOMS.length) {
    roomIndex = digit - 1;
    reseed = 0;
    load();
  } else if (event.key === 'r' || event.key === 'R') {
    reseed++;
    load();
  } else if (event.key === 'c' || event.key === 'C') {
    ceilingHidden = !ceilingHidden;
    applyCeiling();
  } else if (event.key === 'v' || event.key === 'V') {
    view = (view + 1) % 3;
    applyView();
  }
});

const ndc = new THREE.Vector2();
engine.renderer.domElement.addEventListener('pointerdown', (event) => {
  if (!current || won) return;
  ndc.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
  router.route(ndc, engine.camera, current.group);
});

// E2E bridge: drive puzzle clicks by id without pointer geometry.
declare global {
  interface Window {
    __composedRooms?: { click: (id: string) => boolean; load: (index: number) => void };
  }
}
window.__composedRooms = {
  click: (id) => router.click(id),
  load: (index) => {
    roomIndex = index;
    reseed = 0;
    load();
  },
};

engine.onUpdate((delta, elapsed) => {
  controls.update();
  current?.update(delta, elapsed);
  game?.update?.(delta, elapsed);
  if (toastTimer > 0 && toastEl) {
    toastTimer -= delta;
    if (toastTimer <= 0) toastEl.textContent = '';
  }
});
engine.start();
