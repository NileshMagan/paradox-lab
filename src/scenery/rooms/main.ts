import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Engine } from '@/core/Engine';
import { composeRoom, type ComposedRoom, type RoomSpec } from '@/scenery/compose';
import { agencyBureau } from './agencyBureau';
import { egyptianTomb } from './egyptianTomb';

/**
 * Composed-room viewer — walk-in inspection of RoomSpec escape rooms.
 * Dev page: `npm run dev` → /rooms.html.
 *
 *   [1] / [2]   switch room
 *   [C]         toggle ceiling (dollhouse view)
 *   [V]         cycle camera: dollhouse → eye-level → corner
 *   [R]         reseed the current room (same recipe, new variation)
 */

const SPECS: RoomSpec[] = [egyptianTomb, agencyBureau];

const container = document.getElementById('app');
if (!container) throw new Error('#app container not found');
const engine = new Engine(container);
const scene = engine.scene;
scene.background = new THREE.Color(0x07090d);
const controls = new OrbitControls(engine.camera, engine.renderer.domElement);
controls.enableDamping = true;

let current: ComposedRoom | null = null;
let specIndex = 0;
let reseed = 0;
let ceilingHidden = true;
let view = 0;

function applyView(): void {
  const spec = SPECS[specIndex];
  const { w, h, d } = spec.size;
  if (view === 0) {
    engine.camera.position.set(0, h * 2.6, d * 0.85); // dollhouse
    controls.target.set(0, 0.5, 0);
  } else if (view === 1) {
    engine.camera.position.set(0, 1.65, d / 2 - 1); // player's eye at the door
    controls.target.set(0, 1.3, -d / 4);
  } else {
    engine.camera.position.set(w / 2 - 0.8, h - 0.6, d / 2 - 0.8); // corner survey
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
  const spec = SPECS[specIndex];
  const seeded: RoomSpec = reseed === 0 ? spec : { ...spec, seed: `${spec.seed}:r${reseed}` };
  current = composeRoom(seeded);
  scene.add(current.group);
  applyCeiling();
  applyView();
  const nameEl = document.getElementById('room-name');
  if (nameEl) nameEl.textContent = `${spec.name} — seed ${seeded.seed}`;
}
load();

window.addEventListener('keydown', (event) => {
  const digit = Number.parseInt(event.key, 10);
  if (digit >= 1 && digit <= SPECS.length) {
    specIndex = digit - 1;
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

engine.onUpdate((delta, elapsed) => {
  controls.update();
  current?.update(delta, elapsed);
});
engine.start();
