import type * as THREE from 'three';
import * as S from '@/scenery';
import type { RoomSpec } from '@/scenery/compose';
import { approach, type GameCtx, type RoomGame } from '@/scenery/play';
import { createPuzzle, traceLaser, type MirrorState } from '@/scenery/puzzleLogic';

/**
 * "The Relay Station" — the SEED-DERIVED showcase. Its answers are NOT
 * hardcoded: each stage reads `ctx.rng` (seeded from the room code) to generate
 * the code AND the clue text from the same source, so they always agree and a
 * different room code yields a different, self-consistent puzzle. Also debuts
 * two structural mechanisms: laserGrid (beam routing) and lightsOutGrid.
 *
 * Handles: panel, power, note (S1); laser, note (S2); pads, release, note (S3).
 */

const WALL = (d: number): number => -d / 2 + 0.25;

// ── Stage 1 — Access Panel (seed-derived code) ───────────────────────────────

const S1 = { w: 9, h: 3.6, d: 10 };

export const accessSpec: RoomSpec = {
  name: 'The Access Panel',
  paletteName: 'neon',
  seed: 'relay-access:v1',
  size: S1,
  shell: { floor: 0x0c1016, walls: 0x11161f, ceiling: 0x080a10 },
  lighting: {
    ambient: { color: 0x1a2633, intensity: 0.5 },
    points: [
      { x: 0, y: 2.4, z: 1.4, color: 0x1fd1ff, intensity: 8, distance: 8 },
      { x: -2.8, y: 2.2, z: -2.4, color: 0x2bff88, intensity: 6, distance: 8 },
      { x: 2.8, y: 2.2, z: -2.4, color: 0xe344c4, intensity: 5, distance: 8 },
    ],
  },
  pieces: [
    { id: 'panel', at: [0, WALL(S1.d)], clearRadius: 0.5, build: (rng, pal) => S.sequenceButtons(rng, pal, { count: 5 }) },
    { id: 'power', at: [3.0, 1.2], rotY: -0.5, clearRadius: 0.7, build: (rng, pal) => S.leverBank(rng, pal, { levers: 1 }) },
    { id: 'note', at: [-3.2, WALL(S1.d) + 0.1], clearRadius: 0.5, build: (rng, pal) => S.noticeBoard(rng, pal) },
    { at: [-3.2, 2.8], build: (rng, pal) => S.controlPanel(rng, pal) },
    { at: [3.2, 3.0], build: (rng, pal) => S.consoleBank(rng, pal) },
    { at: [0, 2], clearRadius: 0, build: (rng) => S.dustMotes(rng, { width: S1.w - 1, height: S1.h, depth: S1.d - 1, count: 120 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('relay:hum') },
  ],
};

export function accessGame(handles: Record<string, unknown>, ctx: GameCtx): RoomGame {
  const panel = handles.panel as ReturnType<typeof S.sequenceButtons>;
  const power = handles.power as ReturnType<typeof S.leverBank>;
  const note = handles.note as THREE.Group;
  const pz = createPuzzle();

  // Seed-derived: the code AND the clue below come from the same rng draw.
  const CODE = Array.from({ length: 4 }, () => ctx.rng.int(5));
  const codeLabel = CODE.map((n) => n + 1).join(' · ');

  let entered: number[] = [];
  let leverGoal = power.levers[0].rotation.x;
  const flash = panel.lampMaterials.map(() => 0);

  ctx.setObjective('The relay is offline and the panel is locked.');
  ctx.setHint(`Throw the power lever, then key the access code from the log: ${codeLabel}. Both are needed.`);

  pz.when(() => pz.is('power') && pz.is('entered'), () => {
    ctx.win('The panel greenlights — the relay boots, and the beam-room bulkhead slides wide.');
  });

  ctx.register('note', note, () => {
    ctx.toast(`Maintenance log: "Power up, then access code ${codeLabel}."`);
    ctx.setObjective(`Power up, then key the code: ${codeLabel}.`);
  });

  ctx.register('power', power.levers[0], () => {
    if (pz.is('power')) return;
    pz.set('power');
    leverGoal = -leverGoal;
    ctx.toast('Power lever thrown — the panel lamps warm up.');
  });

  panel.buttons.forEach((_b, i) => {
    ctx.register(`btn:${i}`, panel.buttons[i], () => {
      if (pz.is('entered')) return;
      if (!pz.is('power')) {
        ctx.toast('The panel is dark. Power first.');
        return;
      }
      flash[i] = 0.4;
      entered.push(i);
      if (!entered.every((v, k) => v === CODE[k])) {
        entered = [];
        ctx.toast('Reject tone — code cleared.');
        return;
      }
      if (entered.length === CODE.length) pz.set('entered');
      else ctx.toast(`Accepted (${entered.length}/${CODE.length}).`);
    });
  });

  return {
    update: (delta) => {
      pz.tick();
      power.levers[0].rotation.x = approach(power.levers[0].rotation.x, leverGoal, delta, 8);
      panel.lampMaterials.forEach((mat, i) => {
        if (flash[i] > 0) flash[i] -= delta;
        mat.emissiveIntensity = approach(mat.emissiveIntensity, flash[i] > 0 ? 1.8 : 0.35, delta, 10);
      });
    },
  };
}

// ── Stage 2 — The Beam Room (laser routing) ──────────────────────────────────

const S2 = { w: 10, h: 3.8, d: 11 };

export const beamSpec: RoomSpec = {
  name: 'The Beam Room',
  paletteName: 'neon',
  seed: 'relay-beam:v1',
  size: S2,
  shell: { floor: 0x0a0e14, walls: 0x0e131c, ceiling: 0x07090f },
  lighting: {
    ambient: { color: 0x18222e, intensity: 0.5 },
    points: [
      { x: 0, y: 2.4, z: 1.4, color: 0x1fd1ff, intensity: 8, distance: 8 },
      { x: -3.0, y: 2.2, z: -2.4, color: 0x2bff88, intensity: 6, distance: 8 },
      { x: 3.0, y: 2.2, z: -2.4, color: 0xff2b3a, intensity: 5, distance: 8 },
    ],
  },
  pieces: [
    { id: 'laser', at: [0, WALL(S2.d)], clearRadius: 0.5, build: (rng, pal) => S.laserGrid(rng, pal) },
    { id: 'note', at: [-3.2, WALL(S2.d) + 0.1], clearRadius: 0.5, build: (rng, pal) => S.noticeBoard(rng, pal) },
    { at: [-3.2, 2.8], build: (rng, pal) => S.controlPanel(rng, pal) },
    { at: [3.2, 3.0], build: (rng, pal) => S.consoleBank(rng, pal) },
    { at: [0, 2], clearRadius: 0, build: (rng) => S.dustMotes(rng, { width: S2.w - 1, height: S2.h, depth: S2.d - 1, count: 120 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('relay:beam') },
  ],
};

export function beamGame(handles: Record<string, unknown>, ctx: GameCtx): RoomGame {
  const laser = handles.laser as ReturnType<typeof S.laserGrid>;
  const note = handles.note as THREE.Group;
  const { mirrors, rows, cols, emitter, sensor } = laser;

  const state = mirrors.map(() => 0 as 0 | 1); // 0 = "/", 1 = "\"; all "/" to start
  let aligned = false;
  const apply = (): void => {
    mirrors.forEach((m, k) => (m.tile.rotation.z = state[k] === 0 ? Math.PI / 4 : -Math.PI / 4));
  };
  apply();

  const connected = (): boolean => {
    const grid: MirrorState[][] = Array.from({ length: rows }, () => Array<MirrorState>(cols).fill(null));
    mirrors.forEach((m, k) => (grid[m.r][m.c] = state[k]));
    const exit = traceLaser(rows, cols, grid, emitter);
    return exit.r === sensor.r && exit.c === sensor.c && exit.dir[0] === sensor.dir[0] && exit.dir[1] === sensor.dir[1];
  };

  ctx.setObjective('The relay beam scatters uselessly. Route it to the sensor.');
  ctx.setHint('Each mirror flips between / and \\. Turn them so the beam runs from the green emitter to the amber sensor.');

  ctx.register('note', note, () => {
    ctx.toast('Stencil: "Align the beam — green emitter to amber sensor."');
    ctx.setObjective('Route the beam from emitter to sensor.');
  });

  mirrors.forEach((_m, k) => {
    ctx.register(`mirror:${k}`, mirrors[k].tile, () => {
      if (aligned) return;
      state[k] = state[k] === 0 ? 1 : 0;
      apply();
      if (connected()) {
        aligned = true;
        ctx.win('The beam snaps straight through to the sensor — it flares, and the far door releases.');
      }
    });
  });

  return { update: () => {} };
}

// ── Stage 3 — The Array (lights-out, seed-derived scramble) ───────────────────

const S3 = { w: 9, h: 3.6, d: 10 };
const LO_N = 3;

export const arraySpec: RoomSpec = {
  name: 'The Signal Array',
  paletteName: 'neon',
  seed: 'relay-array:v1',
  size: S3,
  shell: { floor: 0x0c1016, walls: 0x11161f, ceiling: 0x080a10 },
  lighting: {
    ambient: { color: 0x1a2633, intensity: 0.5 },
    points: [
      { x: 0, y: 2.4, z: 1.6, color: 0x1fd1ff, intensity: 9, distance: 8 },
      { x: -2.8, y: 2.2, z: -2.4, color: 0x2bff88, intensity: 6, distance: 8 },
      { x: 2.8, y: 2.4, z: -2.4, color: 0xe344c4, intensity: 5, distance: 8 },
    ],
  },
  pieces: [
    { id: 'pads', at: [0, WALL(S3.d)], clearRadius: 0.5, build: (rng, pal) => S.lightsOutGrid(rng, pal, { n: LO_N }) },
    { id: 'release', at: [2.8, 1.2], rotY: -0.5, clearRadius: 0.7, build: (rng, pal) => S.leverBank(rng, pal, { levers: 1 }) },
    { id: 'note', at: [-3.2, WALL(S3.d) + 0.1], clearRadius: 0.5, build: (rng, pal) => S.noticeBoard(rng, pal) },
    { at: [-3.0, 2.8], build: (rng, pal) => S.controlPanel(rng, pal) },
    { at: [3.2, 3.0], build: (rng, pal) => S.consoleBank(rng, pal) },
    { at: [0, 2], clearRadius: 0, build: (rng) => S.dustMotes(rng, { width: S3.w - 1, height: S3.h, depth: S3.d - 1, count: 120 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('relay:signal') },
  ],
};

export function arrayGame(handles: Record<string, unknown>, ctx: GameCtx): RoomGame {
  const pads = handles.pads as ReturnType<typeof S.lightsOutGrid>;
  const release = handles.release as ReturnType<typeof S.leverBank>;
  const note = handles.note as THREE.Group;
  const pz = createPuzzle();
  const n = pads.n;

  const on = pads.tiles.map(() => true); // solved = every pad lit
  const paint = (): void => {
    pads.mats.forEach((mat, i) => (mat.emissiveIntensity = on[i] ? 1.7 : 0.18));
  };
  const toggle = (i: number): void => {
    const r = Math.floor(i / n);
    const c = i % n;
    for (const [rr, cc] of [[r, c], [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
      if (rr >= 0 && cc >= 0 && rr < n && cc < n) on[rr * n + cc] = !on[rr * n + cc];
    }
  };
  // Seed-derived scramble (from all-lit). Clicking the same cells again re-solves,
  // so it's always solvable; a different room code scrambles differently.
  const scramble = Array.from({ length: 5 }, () => ctx.rng.int(n * n));
  for (const cell of scramble) toggle(cell);
  paint();

  let releaseGoal = release.levers[0].rotation.x;

  ctx.setObjective('The signal array is patchy — light every panel, then key the release.');
  ctx.setHint('Tapping a panel flips it and its four neighbours. Get all of them lit, then throw the release. Both are needed.');

  pz.when(() => pz.is('allOn') && pz.is('released'), () => {
    ctx.win('The array blazes to full strength — a carrier locks, the mast retracts, and the hatch opens. Signal away.');
  });

  ctx.register('note', note, () => {
    ctx.toast('Panel decal: "All cells LIT, then the release. Tapping one flips its neighbours."');
    ctx.setObjective('Light the whole array, then throw the release.');
  });

  pads.tiles.forEach((_t, i) => {
    ctx.register(`pad:${i}`, pads.tiles[i], () => {
      if (pz.is('allOn')) return;
      toggle(i);
      paint();
      if (on.every(Boolean)) {
        pz.set('allOn');
        ctx.toast('Every panel holds lit.');
      }
    });
  });

  ctx.register('release', release.levers[0], () => {
    if (pz.is('released')) return;
    pz.set('released');
    releaseGoal = -releaseGoal;
    ctx.toast(pz.is('allOn') ? 'Release keyed.' : 'Release keyed — but the array isn’t full yet.');
  });

  return {
    update: (delta) => {
      pz.tick();
      release.levers[0].rotation.x = approach(release.levers[0].rotation.x, releaseGoal, delta, 8);
    },
  };
}
