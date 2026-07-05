import * as THREE from 'three';
import { Engine } from '@/core/Engine';
import { FirstPersonControls } from '@/core/FirstPersonControls';
import { mountHints, type HintController } from '@/lobby/hints';
import { mountGameOverlay } from '@/lobby/overlay';
import { readLaunchParams } from '@/lobby/settings';
import { composeRoom, type ComposedRoom, type RoomSpec } from '@/scenery/compose';
import { ClickRouter, type GameFactory, type RoomGame } from '@/scenery/play';
import { Rng } from '@/scenery/rng';
import { inscription, type InscriptionTone } from '@/scenery/assets/readable';

/** Which readable-board style fits each palette. */
function toneFor(paletteName: string): InscriptionTone {
  if (['neon', 'sterile', 'abyssal', 'agency'].includes(paletteName)) return 'screen';
  if (['noir', 'gothic', 'arctic'].includes(paletteName)) return 'paper';
  return 'stone';
}
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
const controls = new FirstPersonControls(engine.camera, engine.renderer.domElement);

// Hidden mirrors of game state, for the E2E bridge only (see rooms.html #hud).
const objectiveEl = document.getElementById('objective');
const toastEl = document.getElementById('toast');
const nameEl = document.getElementById('room-name');

let current: ComposedRoom | null = null;
let game: RoomGame | null = null;
let router = new ClickRouter();
let advIndex = initialAdventure;
let stageIndex = 0;
let carry: Record<string, unknown> = {};
let reseed = 0;
let ceilingHidden = false; // first-person: you're inside, so keep the ceiling
let stageWon = false;
let advanceTimer = 0;

// Shared game shell: top bar, countdown, intro/pause modal, snacks, end screens.
const overlay = mountGameOverlay({
  title: ADVENTURES[initialAdventure].name,
  help: [
    'Look|Drag or swipe to look around.',
    'Move|Arrow keys / WASD — or the ▲ button.',
    'Interact|Tap a prop to use it.',
    'Goal|Solve the room and escape before the clock runs out.',
  ],
});

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

function placeInRoom(): void {
  const { w, d } = ADVENTURES[advIndex].stages[stageIndex].spec.size;
  const margin = 0.7; // keep the head off the walls
  controls.setBounds({
    minX: -w / 2 + margin,
    maxX: w / 2 - margin,
    minZ: -d / 2 + margin,
    maxZ: d / 2 - margin,
    eyeY: 1.6,
  });
  // Start at the near wall looking into the room (props sit at the far −Z wall).
  controls.place(0, d / 2 - margin - 0.2, 0);
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
  // Readable in-world board: the worded clues/objective render here as actual
  // writing (a tablet/note/screen per theme), separate from the glyph props.
  const board = inscription(current.palette, { tone: toneFor(spec.paletteName), title: spec.name });
  board.group.position.set(0, 1.68, -spec.size.d / 2 + 0.14);
  current.group.add(board.group);
  game = factory(
    current.handles,
    {
      register: (id, object, onClick) => router.register(id, object, onClick),
      toast: (text) => {
        overlay.snack(text, 'toast');
        board.setText(text, 'Note');
        if (toastEl) toastEl.textContent = text; // E2E mirror
      },
      setObjective: (text) => {
        overlay.snack(text, 'objective');
        board.setText(text, 'Objective');
        if (objectiveEl) objectiveEl.textContent = `▸ ${text}`; // E2E mirror
        hints?.notifyProgress(); // a changed objective = progress; reset idle nudge
      },
      setHint: (text) => hints?.setHint(text),
      // Puzzle-content RNG: room code + stage seed + reseed. Different codes →
      // different answers; same code → reproducible. [R] reseeds for testing.
      rng: new Rng(`${spec.seed}:${launch.roomCode || 'demo'}:r${reseed}`),
      win: (text) => {
        stageWon = true;
        overlay.snack(text, 'toast');
        if (lastStage) {
          if (objectiveEl) objectiveEl.textContent = '★ ESCAPED — adventure complete';
          overlay.celebrate('YOU ESCAPED', `${adventure.name} — every chamber cleared.`);
        } else {
          if (objectiveEl) objectiveEl.textContent = '✓ Stage clear — moving deeper…';
          overlay.snack('Stage clear — moving deeper…', 'objective');
          advanceTimer = 2.5;
        }
      },
    },
    carry,
  );
  applyCeiling();
  placeInRoom();
  const stageTitle = `${adventure.name} — ${stageIndex + 1}/${adventure.stages.length}: ${spec.name}`;
  overlay.setStageTitle(stageTitle);
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
  }
});

// A tap (not a drag) raycasts into the room to use a prop.
controls.onTap = (ndc) => {
  if (!current || stageWon || overlay.isPaused()) return;
  router.route(ndc, engine.camera, current.group);
};

// On-screen forward pad (touch / click-hold) — drives the FP controller.
const forwardBtn = document.getElementById('forward');
if (forwardBtn) {
  const press = (on: boolean) => () => (controls.moveForward = on);
  forwardBtn.addEventListener('pointerdown', press(true));
  forwardBtn.addEventListener('pointerup', press(false));
  forwardBtn.addEventListener('pointerleave', press(false));
  forwardBtn.addEventListener('pointercancel', press(false));
}

// Look-highlight: outline whatever the player is looking at. Desktop follows the
// mouse; touch uses screen centre (straight ahead) + a crosshair (see rooms.html).
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
const lookNdc = new THREE.Vector2(0, 0);
if (!coarsePointer) {
  engine.renderer.domElement.addEventListener('pointermove', (e) => {
    lookNdc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  });
} else {
  document.getElementById('crosshair')?.style.setProperty('display', 'block');
}

// E2E bridge: drive puzzle clicks and stage flow without pointer geometry.
declare global {
  interface Window {
    __composedRooms?: {
      click: (id: string) => boolean;
      loadAdventure: (index: number) => void;
      stage: () => number;
      cam: () => { x: number; y: number; z: number };
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
  cam: () => ({ x: engine.camera.position.x, y: engine.camera.position.y, z: engine.camera.position.z }),
};

engine.onUpdate((delta, elapsed) => {
  overlay.tick(delta); // self-gates on pause
  const paused = overlay.isPaused();
  controls.enabled = !paused;
  controls.update(delta);
  if (paused) {
    engine.setOutlined([]);
    return; // freeze the room while the intro/pause modal is up
  }
  // Outline the interactable under the look ray.
  const looked = current && !stageWon ? router.pick(lookNdc, engine.camera, current.group) : null;
  engine.setOutlined(looked ? [looked] : []);
  if (!coarsePointer) engine.renderer.domElement.style.cursor = looked ? 'pointer' : 'default';
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
});
engine.start();
