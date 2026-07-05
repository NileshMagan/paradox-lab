import type * as THREE from 'three';
import * as S from '@/scenery';
import type { RoomSpec } from '@/scenery/compose';
import { approach, type GameCtx, type RoomGame } from '@/scenery/play';

/**
 * "The Frost Station" — an abandoned polar research base, three stages:
 *   1. Generator Room — punch the startup sequence to restore power.
 *   2. The Ice Lab — weigh the ice core against the right standard.
 *   3. The Observatory — dial the dome to the rescue azimuth and open it.
 *
 * Handles: power, card (S1); scale, weights, log (S2); dial, dome, scope (S3).
 */

const WALL = (d: number): number => -d / 2 + 0.25;
function angleDiff(a: number, b: number): number {
  return ((a - b + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
}

// ── Stage 1 — Generator Room ─────────────────────────────────────────────────

const S1 = { w: 10, h: 3.6, d: 11 };
const BOOT_SEQ = [3, 1, 4, 0, 2]; // button order

export const generatorSpec: RoomSpec = {
  name: 'The Generator Room',
  paletteName: 'arctic',
  seed: 'frost-generator:v1',
  size: S1,
  shell: { floor: 0x9fb4c2, walls: 0xb4c8d4, ceiling: 0x8aa2b0 },
  lighting: {
    ambient: { color: 0xbcd6e6, intensity: 0.6 },
    points: [
      { x: 2.6, y: 2.4, z: -2.6, color: 0xffd9a0, intensity: 8, distance: 8 }, // one working bulb
      { x: -2.6, y: 2.4, z: 1.6, color: 0x9fd4ff, intensity: 6, distance: 8 },
      { x: 0, y: 3.2, z: 0, color: 0x66d9ff, intensity: 4, distance: 12 },
    ],
  },
  pieces: [
    { id: 'power', at: [0, WALL(S1.d)], clearRadius: 0.4, build: (rng, pal) => S.sequenceButtons(rng, pal, { count: 5 }) },
    { id: 'card', at: [-2.8, WALL(S1.d) + 0.1], clearRadius: 0.5, build: (rng, pal) => S.noticeBoard(rng, pal) },
    { at: [3.0, -2.8], build: (rng, pal) => S.generatorUnit(rng, pal) },
    { at: [-3.4, 2.8], rotY: 0.4, build: (rng, pal) => S.logPile(rng, pal) },
    { at: [3.4, 2.8], build: (rng, pal) => S.snowyLampPost(rng, pal) },
    { at: [-3.4, -2.6], build: (rng, pal) => S.iceBlockWall(rng, pal, { width: 1.6 }) },
    { at: [0, 1.8], clearRadius: 0, build: (rng) => S.snowfall(rng, { width: S1.w - 1, depth: S1.d - 1, height: S1.h, count: 160 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('frost:wind') },
  ],
};

export function generatorGame(handles: Record<string, unknown>, ctx: GameCtx): RoomGame {
  const power = handles.power as ReturnType<typeof S.sequenceButtons>;
  const card = handles.card as THREE.Group;

  let read = false;
  let entered: number[] = [];
  let solved = false;
  const flash = power.lampMaterials.map(() => 0);

  ctx.setObjective('The station is dark and freezing. Restore the generator.');
  ctx.setHint('Read the startup card, then press the panel buttons in its order: 4 · 2 · 5 · 1 · 3 (left to right = 1..5).');

  ctx.register('card', card, () => {
    read = true;
    ctx.toast('Startup card: "COLD-START ORDER — 4 · 2 · 5 · 1 · 3."');
    ctx.setObjective('Press the buttons in order: 4 · 2 · 5 · 1 · 3.');
  });

  power.buttons.forEach((_b, i) => {
    ctx.register(`btn:${i}`, power.buttons[i], () => {
      if (solved) return;
      if (!read) {
        ctx.toast('The panel is dead-cold. In what order?');
        return;
      }
      flash[i] = 0.4;
      entered.push(i);
      if (!entered.every((v, k) => v === BOOT_SEQ[k])) {
        entered = [];
        ctx.toast('A fault buzzer. The sequence resets.');
        return;
      }
      if (entered.length === BOOT_SEQ.length) {
        solved = true;
        ctx.win('The generator coughs, catches, and roars. Lights flood the corridor — the lab door releases.');
      } else {
        ctx.toast(`Contactor clunks in. (${entered.length}/${BOOT_SEQ.length})`);
      }
    });
  });

  return {
    update: (delta) => {
      power.lampMaterials.forEach((mat, i) => {
        if (flash[i] > 0) flash[i] -= delta;
        mat.emissiveIntensity = approach(mat.emissiveIntensity, flash[i] > 0 ? 1.8 : 0.35, delta, 10);
      });
    },
  };
}

// ── Stage 2 — The Ice Lab ────────────────────────────────────────────────────

const S2 = { w: 10, h: 3.6, d: 12 };
const CORE_WEIGHT = 3; // the matching standard (of 5)

export const iceLabSpec: RoomSpec = {
  name: 'The Ice Lab',
  paletteName: 'arctic',
  seed: 'frost-lab:v1',
  size: S2,
  shell: { floor: 0xaebfca, walls: 0xc2d2dc, ceiling: 0x93a8b6 },
  lighting: {
    ambient: { color: 0xc8dae6, intensity: 0.65 },
    points: [
      { x: 0, y: 3.0, z: 0, color: 0xeaf6ff, intensity: 12, distance: 9 },
      { x: -3.0, y: 2.4, z: -3.0, color: 0x9fd4ff, intensity: 6, distance: 8 },
      { x: 3.0, y: 2.4, z: 3.0, color: 0xffd9a0, intensity: 5, distance: 7 },
    ],
  },
  pieces: [
    { id: 'scale', at: [0, -2.5], clearRadius: 1.4, build: (rng, pal) => S.balanceScale(rng, pal) },
    { id: 'weights', at: [-2.8, -0.6], build: (rng, pal) => S.weightSet(rng, pal) },
    { id: 'log', at: [3.0, WALL(S2.d) + 0.1], rotY: 0, clearRadius: 0.5, build: (rng, pal) => S.noticeBoard(rng, pal) },
    { at: [-3.4, -4.0], rotY: 0.6, build: (rng, pal) => S.iceBlockWall(rng, pal, { width: 1.8 }) },
    { at: [3.4, -1.5], build: (rng, pal) => S.snowPine(rng, pal, { height: 1.6 }) },
    { at: [-2.6, 3.6], build: (rng, pal) => S.frozenPond(rng, pal, { radius: 0.8 }) },
    { at: [2.6, 3.8], build: (rng, pal) => S.icicleRow(rng, pal, { span: 1.4 }) },
    { at: [0, 1.6], clearRadius: 0, build: (rng) => S.snowfall(rng, { width: S2.w - 1, depth: S2.d - 1, height: S2.h, count: 120 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('frost:hum') },
  ],
};

export function iceLabGame(handles: Record<string, unknown>, ctx: GameCtx): RoomGame {
  const scale = handles.scale as ReturnType<typeof S.balanceScale>;
  const weights = handles.weights as ReturnType<typeof S.weightSet>;
  const log = handles.log as THREE.Group;

  let read = false;
  let held = -1;
  let balanced = false;
  let settle = 0;

  ctx.setObjective('A core sample sits on the balance. Match it against the right standard.');
  ctx.setHint('Read the lab log for the core’s mass class, then lift that standard weight (the FOURTH) onto the scale to balance it.');

  ctx.register('log', log, () => {
    read = true;
    ctx.toast('Lab log: "Core CX-118 masses as the FOURTH reference standard."');
    ctx.setObjective('Lift the fourth weight onto the balance.');
  });

  weights.weights.forEach((weight, i) => {
    ctx.register(`weight:${i}`, weight, () => {
      if (balanced) return;
      held = i;
      ctx.toast(`You heft the ${['first', 'second', 'third', 'fourth', 'fifth'][i]} standard.`);
    });
  });

  ctx.register('scale', scale.group, () => {
    if (balanced) return;
    if (held < 0) {
      ctx.toast('The empty pan waits. Bring a standard weight.');
      return;
    }
    if (!read) {
      ctx.toast('Guessing risks snapping the beam. Read the log first.');
      return;
    }
    if (held === CORE_WEIGHT) {
      balanced = true;
      ctx.win('The beam settles dead level — a match. A cabinet unlocks: the observatory key.');
    } else {
      ctx.toast('The beam slams down. Wrong mass — take it back.');
      held = -1;
    }
  });

  return {
    update: (delta) => {
      if (balanced && settle < 1) {
        settle = approach(settle, 1, delta, 1.5);
        scale.beam.rotation.z = approach(scale.beam.rotation.z, 0, delta, 1.5);
        scale.panLeft.rotation.z = -scale.beam.rotation.z;
        scale.panRight.rotation.z = -scale.beam.rotation.z;
      }
    },
  };
}

// ── Stage 3 — The Observatory ────────────────────────────────────────────────

const S3 = { w: 10, h: 4.2, d: 11 };
const AZIMUTH = 2.2; // dial target
const DIAL_STEP = 0.5;
const AZIMUTH_TOL = 0.3;

export const observatorySpec: RoomSpec = {
  name: 'The Observatory',
  paletteName: 'arctic',
  seed: 'frost-observatory:v1',
  size: S3,
  shell: { floor: 0x9fb4c2, walls: 0xaec2ce, ceiling: 0x0a1420 },
  lighting: {
    ambient: { color: 0xbcd6e6, intensity: 0.55 },
    points: [
      { x: 0, y: 2.6, z: 2.0, color: 0xffd9a0, intensity: 8, distance: 8 },
      { x: -3.0, y: 2.6, z: -2.6, color: 0x66d9ff, intensity: 7, distance: 9 },
      { x: 3.0, y: 2.6, z: -2.6, color: 0x9fd4ff, intensity: 6, distance: 9 },
    ],
  },
  pieces: [
    { id: 'dial', at: [0, WALL(S3.d)], clearRadius: 0.4, build: (rng, pal) => S.combinationDial(rng, pal) },
    { id: 'dome', at: [2.8, 1.2], rotY: -0.4, clearRadius: 0.8, build: (rng, pal) => S.leverBank(rng, pal, { levers: 1 }) },
    { id: 'scope', at: [-2.8, WALL(S3.d) + 0.1], clearRadius: 0.5, build: (rng, pal) => S.noticeBoard(rng, pal) },
    { at: [-3.4, 3.0], build: (rng, pal) => S.iglooArch(rng, pal) },
    { at: [3.4, 3.2], build: (rng, pal) => S.snowPine(rng, pal, { height: 1.8 }) },
    { at: [2.8, -3.6], build: (rng, pal) => S.icicleRow(rng, pal, { span: 1.6 }) },
    { at: [0, 3.4], clearRadius: 0, build: (rng) => S.godRays(rng, { color: 0x9fe8ff, height: S3.h }) },
    { at: [0, 1.6], clearRadius: 0, build: (rng) => S.snowfall(rng, { width: S3.w - 1, depth: S3.d - 1, height: S3.h, count: 120 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('frost:aurora') },
  ],
};

export function observatoryGame(handles: Record<string, unknown>, ctx: GameCtx): RoomGame {
  const dialH = handles.dial as ReturnType<typeof S.combinationDial>;
  const dome = handles.dome as ReturnType<typeof S.leverBank>;
  const scope = handles.scope as THREE.Group;

  let read = false;
  let goal = dialH.dial.rotation.z;
  let aligned = false;
  let escaped = false;

  ctx.setObjective('The dome is frozen shut. A rescue plane is somewhere overhead — signal it.');
  ctx.setHint('Read the observation slip for the rescue azimuth, dial the dome bearing to it, then throw the dome lever.');

  ctx.register('scope', scope, () => {
    read = true;
    ctx.toast('Observation slip: "Rescue corridor bears on the marked azimuth — dial it to hold."');
    ctx.setObjective('Dial the dome to the rescue azimuth, then open it.');
  });

  ctx.register('dial', dialH.dial, () => {
    if (aligned) return;
    goal += DIAL_STEP;
    if (read && Math.abs(angleDiff(goal, AZIMUTH)) < AZIMUTH_TOL) {
      aligned = true;
      ctx.toast('The bearing indexer clicks green — the dome drive engages.');
      ctx.setObjective('Throw the dome lever.');
    }
  });

  ctx.register('dome', dome.levers[0], () => {
    if (!aligned) {
      ctx.toast('The dome drive is locked until the bearing is set.');
      return;
    }
    if (escaped) return;
    escaped = true;
    ctx.win('The dome grinds open on the aurora — your flare catches the plane’s eye. Rescue is coming. You made it.');
  });

  return {
    update: (delta) => {
      dialH.dial.rotation.z = approach(dialH.dial.rotation.z, goal, delta, 6);
    },
  };
}
