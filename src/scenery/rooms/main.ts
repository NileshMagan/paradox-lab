import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Engine } from '@/core/Engine';
import { mountHints, type HintController } from '@/lobby/hints';
import { mountGameOverlay } from '@/lobby/overlay';
import { readLaunchParams } from '@/lobby/settings';
import { composeRoom, type ComposedRoom, type RoomSpec } from '@/scenery/compose';
import { ClickRouter, type GameFactory, type RoomGame } from '@/scenery/play';
import { Rng } from '@/scenery/rng';
import { agencyBureau } from './agencyBureau';
import { bureauArchivesGame, bureauArchivesSpec } from './bureauArchives';
import { bureauGame } from './bureauGame';
import { bureauVaultGame, bureauVaultSpec } from './bureauVault';
import {
  boilerDeckGame,
  boilerDeckSpec,
  bridgeGame,
  bridgeSpec,
  telegraphGame,
  telegraphSpec,
} from './brassLeviathan';
import {
  decodingGame,
  decodingSpec,
  tumblerGame,
  tumblerSpec,
  waterworksGame,
  waterworksSpec,
} from './cipherVault';
import { chartGame, chartSpec, helmGame, helmSpec, holdGame, holdSpec } from './drownedGalleon';
import {
  accessGame,
  accessSpec,
  arrayGame,
  arraySpec,
  beamGame,
  beamSpec,
} from './relayStation';
import { egyptianTomb } from './egyptianTomb';
import {
  generatorGame,
  generatorSpec,
  iceLabGame,
  iceLabSpec,
  observatoryGame,
  observatorySpec,
} from './frostStation';
import {
  drawingRoomGame,
  drawingRoomSpec,
  libraryGame,
  librarySpec,
  seanceGame,
  seanceSpec,
} from './hollowManor';
import { tombGame } from './tombGame';
import { tombHallGame, tombHallSpec } from './tombHall';
import { tombVaultGame, tombVaultSpec } from './tombVault';

/**
 * Adventure player — multi-room escape experiences (~1 hour per theme).
 * Winning a stage opens the way to the next; `carry` is the inventory that
 * travels with you. Dev page: `npm run dev` → /rooms.html.
 *
 *   [1] / [2]   pick adventure     [V] cycle camera
 *   [C]         toggle ceiling     [R] restart current stage
 *
 * `window.__composedRooms` drives clicks/stages for E2E tests.
 */

interface Stage {
  spec: RoomSpec;
  game: GameFactory;
}
const ADVENTURES: Array<{ id: string; name: string; stages: Stage[] }> = [
  {
    id: 'pharaoh',
    name: 'The Pharaoh’s Curse',
    stages: [
      { spec: egyptianTomb, game: tombGame },
      { spec: tombHallSpec, game: tombHallGame },
      { spec: tombVaultSpec, game: tombVaultGame },
    ],
  },
  {
    id: 'blackout',
    name: 'Operation Blackout',
    stages: [
      { spec: agencyBureau, game: bureauGame },
      { spec: bureauArchivesSpec, game: bureauArchivesGame },
      { spec: bureauVaultSpec, game: bureauVaultGame },
    ],
  },
  {
    id: 'manor',
    name: 'The Hollow Manor',
    stages: [
      { spec: drawingRoomSpec, game: drawingRoomGame },
      { spec: librarySpec, game: libraryGame },
      { spec: seanceSpec, game: seanceGame },
    ],
  },
  {
    id: 'leviathan',
    name: 'The Brass Leviathan',
    stages: [
      { spec: boilerDeckSpec, game: boilerDeckGame },
      { spec: telegraphSpec, game: telegraphGame },
      { spec: bridgeSpec, game: bridgeGame },
    ],
  },
  {
    id: 'galleon',
    name: 'The Drowned Galleon',
    stages: [
      { spec: helmSpec, game: helmGame },
      { spec: holdSpec, game: holdGame },
      { spec: chartSpec, game: chartGame },
    ],
  },
  {
    id: 'frost',
    name: 'The Frost Station',
    stages: [
      { spec: generatorSpec, game: generatorGame },
      { spec: iceLabSpec, game: iceLabGame },
      { spec: observatorySpec, game: observatoryGame },
    ],
  },
  {
    id: 'vault',
    name: 'The Cipher Vault',
    stages: [
      { spec: decodingSpec, game: decodingGame },
      { spec: waterworksSpec, game: waterworksGame },
      { spec: tumblerSpec, game: tumblerGame },
    ],
  },
  {
    id: 'relay',
    name: 'The Relay Station',
    stages: [
      { spec: accessSpec, game: accessGame },
      { spec: beamSpec, game: beamGame },
      { spec: arraySpec, game: arrayGame },
    ],
  },
];

// Which adventure to open: ?adventure=pharaoh|blackout (from the lobby launch),
// falling back to the first. The [1]/[2] keys still cycle between them for dev.
const requestedAdventure = new URLSearchParams(window.location.search).get('adventure');
const initialAdventure = Math.max(
  0,
  ADVENTURES.findIndex((a) => a.id === requestedAdventure),
);

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
let advIndex = initialAdventure;
let stageIndex = 0;
let carry: Record<string, unknown> = {};
let reseed = 0;
let ceilingHidden = true;
let view = 1; // eye level — these are playable rooms, not exhibits
let stageWon = false;
let advanceTimer = 0;

// Shared lobby chrome: countdown, room code, back-to-menu. Purely a DOM
// overlay — it reads the launch params and never touches the scene.
const overlay = mountGameOverlay({ title: ADVENTURES[initialAdventure].name });

// Difficulty-aware hints (only when the lobby left them on). The controller
// mounts its own button; games feed it crux text via ctx.setHint.
const launch = readLaunchParams();
const hints: HintController | null = launch.hints ? mountHints(launch.difficulty) : null;

// Developer mode (?dev=1 from the lobby) surfaces the adventure-switch keys.
if (new URLSearchParams(window.location.search).get('dev') === '1') {
  const dev = document.getElementById('devcontrols');
  const hint = document.getElementById('hint');
  if (dev) dev.style.display = '';
  if (hint) hint.style.display = 'none';
}

function applyView(): void {
  const { w, h, d } = ADVENTURES[advIndex].stages[stageIndex].spec.size;
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

function loadStage(): void {
  if (current) {
    scene.remove(current.group);
    current.dispose();
  }
  router = new ClickRouter();
  stageWon = false;
  advanceTimer = 0;
  const adventure = ADVENTURES[advIndex];
  const { spec, game: factory } = adventure.stages[stageIndex];
  const seeded: RoomSpec = reseed === 0 ? spec : { ...spec, seed: `${spec.seed}:r${reseed}` };
  current = composeRoom(seeded);
  scene.add(current.group);
  const lastStage = stageIndex === adventure.stages.length - 1;
  // Fresh stage → clear the carried-over hint until the new game registers one.
  hints?.setHint('');
  hints?.notifyProgress();
  game = factory(
    current.handles,
    {
      register: (id, object, onClick) => router.register(id, object, onClick),
      toast: (text) => {
        if (toastEl) {
          toastEl.textContent = text;
          toastTimer = 6;
        }
      },
      setObjective: (text) => {
        if (objectiveEl) objectiveEl.textContent = `▸ ${text}`;
        // A changed objective means real progress — reset the idle nudge clock.
        hints?.notifyProgress();
      },
      setHint: (text) => hints?.setHint(text),
      // Puzzle-content RNG: room code + stage seed + reseed. Different codes →
      // different answers; same code → reproducible. [R] reseeds for testing.
      rng: new Rng(`${spec.seed}:${launch.roomCode || 'demo'}:r${reseed}`),
      win: (text) => {
        stageWon = true;
        if (toastEl) {
          toastEl.textContent = text;
          toastTimer = 60;
        }
        if (lastStage) {
          if (objectiveEl) objectiveEl.textContent = '★ ESCAPED — adventure complete';
          overlay.celebrate('YOU ESCAPED', `${adventure.name} — all three chambers cleared.`);
        } else {
          if (objectiveEl) objectiveEl.textContent = '✓ Stage clear — moving deeper…';
          advanceTimer = 2.5;
        }
      },
    },
    carry,
  );
  applyCeiling();
  applyView();
  if (nameEl) {
    nameEl.textContent = `${adventure.name} — stage ${stageIndex + 1}/${adventure.stages.length}: ${spec.name}`;
  }
}
loadStage();

window.addEventListener('keydown', (event) => {
  const digit = Number.parseInt(event.key, 10);
  if (digit >= 1 && digit <= ADVENTURES.length) {
    advIndex = digit - 1;
    stageIndex = 0;
    carry = {};
    reseed = 0;
    loadStage();
  } else if (event.key === 'r' || event.key === 'R') {
    reseed++;
    loadStage();
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
  if (!current || stageWon) return;
  ndc.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
  router.route(ndc, engine.camera, current.group);
});

// E2E bridge: drive puzzle clicks and stage flow without pointer geometry.
declare global {
  interface Window {
    __composedRooms?: {
      click: (id: string) => boolean;
      loadAdventure: (index: number) => void;
      stage: () => number;
    };
  }
}
window.__composedRooms = {
  click: (id) => router.click(id),
  loadAdventure: (index) => {
    advIndex = index;
    stageIndex = 0;
    carry = {};
    reseed = 0;
    loadStage();
  },
  stage: () => stageIndex,
};

engine.onUpdate((delta, elapsed) => {
  controls.update();
  overlay.tick(delta);
  if (!stageWon) hints?.tick(delta);
  current?.update(delta, elapsed);
  game?.update?.(delta, elapsed);
  if (advanceTimer > 0) {
    advanceTimer -= delta;
    if (advanceTimer <= 0) {
      stageIndex++;
      loadStage();
    }
  }
  if (toastTimer > 0 && toastEl) {
    toastTimer -= delta;
    if (toastTimer <= 0) toastEl.textContent = '';
  }
});
engine.start();
