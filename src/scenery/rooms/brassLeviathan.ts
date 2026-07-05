import type * as THREE from 'three';
import * as S from '@/scenery';
import type { RoomSpec } from '@/scenery/compose';
import { approach, type GameCtx, type RoomGame } from '@/scenery/play';

/**
 * "The Brass Leviathan" — a steampunk airship in trouble, three stages, three
 * new analog mechanics:
 *   1. Boiler Deck — turn valves to bring three pressure gauges into the green.
 *   2. Telegraph Cabin — tap S·O·S on the iambic key (dot/dash paddles).
 *   3. Bridge — align a meshed cog train (turning one counter-turns its
 *      neighbours) so every notch points up, then throw the ascent lever.
 *
 * Handles: valves, gauges (S1); telegraph, radio (S2); cogs, lever (S3).
 */

const WALL = (d: number): number => -d / 2 + 0.25;

/** Shortest signed angle a→b, in (-π, π]. */
function angleDiff(a: number, b: number): number {
  return ((a - b + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
}

// ── Stage 1 — The Boiler Deck ────────────────────────────────────────────────

const S1 = { w: 10, h: 3.8, d: 11 };
const VALVE_STEP = 0.5; // radians the needle turns per valve click

export const boilerDeckSpec: RoomSpec = {
  name: 'The Boiler Deck',
  paletteName: 'brass',
  seed: 'leviathan-boiler:v1',
  size: S1,
  shell: { floor: 0x2e2418, walls: 0x3a2d1e, ceiling: 0x241c13 },
  lighting: {
    ambient: { color: 0x4a3826, intensity: 0.55 },
    points: [
      { x: 3.0, y: 1.0, z: -3.0, color: 0xff7a2a, intensity: 14, distance: 8 }, // furnace
      { x: -2.5, y: 2.4, z: 1.5, color: 0xffcf8a, intensity: 8, distance: 7 },
      { x: 0, y: 3.2, z: 0, color: 0x66ffd9, intensity: 4, distance: 12 }, // verdigris accent
    ],
  },
  pieces: [
    { id: 'gauges', at: [0, WALL(S1.d)], clearRadius: 0.4, build: (rng, pal) => S.pressureGauges(rng, pal, { count: 3 }) },
    { id: 'valves', at: [0, 1.4], clearRadius: 1.0, build: (rng, pal) => S.valveManifold(rng, pal, { count: 3 }) },
    { at: [3.2, -3.2], build: (rng, pal) => S.furnaceBox(rng, pal) },
    { at: [-3.4, -2.5], build: (rng, pal) => S.boilerRig(rng, pal) },
    { at: [-3.6, 2.6], build: (rng, pal) => S.pumpAssembly(rng, pal) },
    { at: [3.4, 2.8], build: (rng, pal) => S.storageTank(rng, pal) },
    { at: [0, 2], clearRadius: 0, build: (rng) => S.dustMotes(rng, { width: S1.w - 1, height: S1.h, depth: S1.d - 1, count: 140 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('leviathan:boiler') },
  ],
};

export function boilerDeckGame(handles: Record<string, unknown>, ctx: GameCtx): RoomGame {
  const gauges = handles.gauges as ReturnType<typeof S.pressureGauges>;
  const valves = handles.valves as ReturnType<typeof S.valveManifold>;

  const needleGoal = gauges.needles.map((n) => n.rotation.z);
  const wheelGoal = valves.wheels.map((w) => w.rotation.z);
  const wasIn = gauges.needles.map(() => false);
  let solved = false;

  ctx.setObjective('Boiler pressure is critical. Bring all three gauges into the green.');
  ctx.setHint(
    'Each brass valve drives the gauge above it. Turn a valve to swing its needle; stop when the needle sits inside the green band. All three green at once stabilises the boiler.',
  );

  valves.wheels.forEach((_wheel, i) => {
    ctx.register(`valve:${i}`, valves.wheels[i], () => {
      if (solved) return;
      needleGoal[i] += VALVE_STEP;
      wheelGoal[i] += VALVE_STEP * 1.5;
    });
  });

  return {
    update: (delta) => {
      let allIn = true;
      gauges.needles.forEach((needle, i) => {
        needle.rotation.z = approach(needle.rotation.z, needleGoal[i], delta, 6);
        valves.wheels[i].rotation.z = approach(valves.wheels[i].rotation.z, wheelGoal[i], delta, 6);
        const inBand = Math.abs(angleDiff(needle.rotation.z, gauges.targets[i])) < gauges.tolerance;
        if (inBand && !wasIn[i]) ctx.toast(`Gauge ${i + 1} holds in the green.`);
        if (!inBand && wasIn[i]) ctx.toast(`Gauge ${i + 1} slips out of the green.`);
        wasIn[i] = inBand;
        if (!inBand) allIn = false;
      });
      if (allIn && !solved) {
        solved = true;
        ctx.win('All three needles settle green. The boiler stops screaming — the deck hatch unseals.');
      }
    },
  };
}

// ── Stage 2 — The Telegraph Cabin ────────────────────────────────────────────

const S2 = { w: 9, h: 3.6, d: 10 };
const SOS: Array<'dot' | 'dash'> = ['dot', 'dot', 'dot', 'dash', 'dash', 'dash', 'dot', 'dot', 'dot'];

export const telegraphSpec: RoomSpec = {
  name: 'The Telegraph Cabin',
  paletteName: 'brass',
  seed: 'leviathan-telegraph:v1',
  size: S2,
  shell: { floor: 0x2e2418, walls: 0x38301f, ceiling: 0x221b12 },
  lighting: {
    ambient: { color: 0x4a3a28, intensity: 0.6 },
    points: [
      { x: 0, y: 2.4, z: 1.5, color: 0xffcf8a, intensity: 9, distance: 8 },
      { x: -3.0, y: 2.2, z: -2.5, color: 0xffb060, intensity: 7, distance: 7 },
      { x: 2.6, y: 2.6, z: -2.0, color: 0x66ffd9, intensity: 4, distance: 8 },
    ],
  },
  pieces: [
    { id: 'telegraph', at: [0, 1.6], clearRadius: 1.0, build: (rng, pal) => S.telegraphKey(rng, pal) },
    { id: 'radio', at: [-2.8, WALL(S2.d)], clearRadius: 0.8, build: (rng, pal) => S.consoleBank(rng, pal) },
    { at: [2.8, WALL(S2.d) + 0.2], build: (rng, pal) => S.orrery(rng, pal) },
    { at: [3.4, 2.6], rotY: -0.6, build: (rng, pal) => S.brassTelescope(rng, pal) },
    { at: [-3.4, 2.8], build: (rng, pal) => S.automatonBust(rng, pal) },
    { at: [0, 2], clearRadius: 0, build: (rng) => S.dustMotes(rng, { width: S2.w - 1, height: S2.h, depth: S2.d - 1, count: 130 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('leviathan:static') },
  ],
};

export function telegraphGame(handles: Record<string, unknown>, ctx: GameCtx): RoomGame {
  const telegraph = handles.telegraph as ReturnType<typeof S.telegraphKey>;
  const radio = handles.radio as THREE.Group;

  let read = false;
  let entered: Array<'dot' | 'dash'> = [];
  let done = false;
  const dip = { dot: 0, dash: 0 };

  ctx.setObjective('The cabin is sealed. The airship is going down — someone must signal.');
  ctx.setHint(
    'Read the distress card on the radio set — it spells the universal call in Morse: · · · — — — · · · . Tap the key: three dots, three dashes, three dots.',
  );

  ctx.register('radio', radio, () => {
    read = true;
    ctx.toast('The distress card by the set: " · · ·  — — —  · · · ".  Signal it on the key.');
    ctx.setObjective('Tap the key: 3 dots (left), 3 dashes (right), 3 dots.');
  });

  const tap = (kind: 'dot' | 'dash'): void => {
    if (done) return;
    if (!read) {
      ctx.toast('The key chatters, unanswered. What message?');
      return;
    }
    dip[kind] = 0.18;
    entered.push(kind);
    const ok = entered.every((s, k) => s === SOS[k]);
    if (!ok) {
      entered = [];
      ctx.toast('The operator garbles the message. Start the call again.');
      return;
    }
    if (entered.length === SOS.length) {
      done = true;
      ctx.win('· · · — — — · · ·  — a reply crackles back. The cabin hatch blows on its hinges.');
    } else {
      ctx.toast(`${kind === 'dot' ? '·' : '—'}  (${entered.length}/${SOS.length})`);
    }
  };

  ctx.register('dot', telegraph.dotPaddle, () => tap('dot'));
  ctx.register('dash', telegraph.dashPaddle, () => tap('dash'));

  return {
    update: (delta) => {
      (['dot', 'dash'] as const).forEach((k) => {
        const paddle = k === 'dot' ? telegraph.dotPaddle : telegraph.dashPaddle;
        if (dip[k] > 0) dip[k] -= delta;
        paddle.rotation.x = approach(paddle.rotation.x, dip[k] > 0 ? 0.28 : 0, delta, 12);
      });
    },
  };
}

// ── Stage 3 — The Bridge ─────────────────────────────────────────────────────

const S3 = { w: 10, h: 3.8, d: 11 };
const SCRAMBLE = [0, 1, 2, 1, 0, 2, 1]; // deterministic, so the start is always solvable

export const bridgeSpec: RoomSpec = {
  name: 'The Bridge',
  paletteName: 'brass',
  seed: 'leviathan-bridge:v1',
  size: S3,
  shell: { floor: 0x2e2418, walls: 0x3a2f1f, ceiling: 0x241c13 },
  lighting: {
    ambient: { color: 0x4a3a28, intensity: 0.6 },
    points: [
      { x: 0, y: 2.6, z: 1.8, color: 0xffcf8a, intensity: 9, distance: 9 },
      { x: -3.2, y: 2.2, z: -2.5, color: 0x66ffd9, intensity: 6, distance: 8 },
      { x: 3.2, y: 2.2, z: -2.5, color: 0xffb060, intensity: 7, distance: 8 },
    ],
  },
  pieces: [
    { id: 'cogs', at: [0, WALL(S3.d)], clearRadius: 0.5, build: (rng, pal) => S.cogTrain(rng, pal, { count: 3 }) },
    { id: 'lever', at: [2.6, 1.2], rotY: -0.4, clearRadius: 0.8, build: (rng, pal) => S.leverBank(rng, pal, { levers: 1 }) },
    { at: [-3.4, 2.6], build: (rng, pal) => S.gearWall(rng, pal) },
    { at: [3.4, 3.0], build: (rng, pal) => S.orrery(rng, pal) },
    { at: [-3.0, -3.2], rotY: 0.5, build: (rng, pal) => S.automatonBust(rng, pal) },
    { at: [0, 3.2], build: (rng, pal) => S.airshipProp(rng, pal) },
    { at: [0, 2], clearRadius: 0, build: (rng) => S.dustMotes(rng, { width: S3.w - 1, height: S3.h, depth: S3.d - 1, count: 140 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('leviathan:engine') },
  ],
};

export function bridgeGame(handles: Record<string, unknown>, ctx: GameCtx): RoomGame {
  const cogTrain = handles.cogs as ReturnType<typeof S.cogTrain>;
  const lever = handles.lever as ReturnType<typeof S.leverBank>;
  const { cogs, step } = cogTrain;

  // Reset to aligned, then apply the fixed scramble THROUGH the meshing so the
  // start is guaranteed solvable by the same coupled moves.
  const goal = cogs.map(() => 0);
  const turn = (i: number, dir: number): void => {
    goal[i] += dir * step;
    if (i > 0) goal[i - 1] -= dir * step;
    if (i < cogs.length - 1) goal[i + 1] -= dir * step;
  };
  for (const i of SCRAMBLE) turn(i, 1);
  cogs.forEach((c, i) => (c.rotation.z = goal[i]));

  let aligned = false;
  let escaped = false;

  ctx.setObjective('The bridge. Engage the ascent drive, then take her up.');
  ctx.setHint(
    'The gears are meshed — turning one turns its neighbours the other way. Work them until every glowing notch points straight up, then throw the ascent lever.',
  );

  cogs.forEach((_c, i) => {
    ctx.register(`cog:${i}`, cogs[i], () => {
      if (aligned) return;
      turn(i, 1);
    });
  });

  ctx.register('lever', lever.levers[0], () => {
    if (!aligned) {
      ctx.toast('The ascent lever is locked — the drive train isn’t engaged.');
      return;
    }
    if (escaped) return;
    escaped = true;
    ctx.win('The lever slams home. Propellers bite the air and the Brass Leviathan claws into the sky — you’re away.');
  });

  const isUp = (a: number): boolean => Math.abs(angleDiff(a, 0)) < 0.08;

  return {
    update: (delta) => {
      cogs.forEach((cog, i) => {
        cog.rotation.z = approach(cog.rotation.z, goal[i], delta, 7);
      });
      if (!aligned && goal.every(isUp)) {
        aligned = true;
        ctx.toast('Every notch snaps to vertical — the drive train engages with a shudder.');
        ctx.setObjective('Throw the ascent lever.');
      }
    },
  };
}
