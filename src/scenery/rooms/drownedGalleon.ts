import type * as THREE from 'three';
import * as S from '@/scenery';
import type { RoomSpec } from '@/scenery/compose';
import { approach, type GameCtx, type RoomGame } from '@/scenery/play';

/**
 * "The Drowned Galleon" — a nautical wreck, three stages:
 *   1. The Helm — steer the ship's wheel to the logged heading.
 *   2. The Flooded Hold — set the four bilge-pump faders to the chalked levels.
 *   3. The Chart Room — align the astrolabe rings to the plotted stars, then
 *      fire the signal flare to be found.
 *
 * Handles: helm, bell (S1); pumps, manifest (S2); rings, flare, chart (S3).
 */

const WALL = (d: number): number => -d / 2 + 0.25;
function angleDiff(a: number, b: number): number {
  return ((a - b + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
}

// ── Stage 1 — The Helm ───────────────────────────────────────────────────────

const S1 = { w: 10, h: 3.8, d: 11 };
const HEADING = 1.7; // radians to steer the wheel to
const WHEEL_STEP = 0.45;
const HEADING_TOL = 0.3;

export const helmSpec: RoomSpec = {
  name: 'The Helm',
  paletteName: 'abyssal',
  seed: 'galleon-helm:v1',
  size: S1,
  shell: { floor: 0x123038, walls: 0x0e2830, ceiling: 0x0a1c22 },
  lighting: {
    ambient: { color: 0x1e4650, intensity: 0.55 },
    points: [
      { x: -2.6, y: 2.4, z: 1.6, color: 0xffcf8a, intensity: 8, distance: 7 }, // storm lantern
      { x: 3.0, y: 2.6, z: -2.6, color: 0x39f0a0, intensity: 6, distance: 8 }, // phosphor
      { x: 0, y: 3.2, z: 0, color: 0x6fd8d0, intensity: 4, distance: 12 },
    ],
  },
  pieces: [
    { id: 'helm', at: [0, 0.8], clearRadius: 1.0, build: (rng, pal) => S.shipWheel(rng, pal) },
    { id: 'bell', at: [2.6, WALL(S1.d) + 0.2], clearRadius: 0.6, build: (rng, pal) => S.shipBell(rng, pal) },
    { at: [-3.4, WALL(S1.d) + 0.2], build: (rng, pal) => S.portholeWall(rng, pal) },
    { at: [3.4, 2.8], build: (rng, pal) => S.anchorProp(rng, pal) },
    { at: [-3.4, 2.6], rotY: 0.5, build: (rng, pal) => S.cannonBarrel(rng, pal) },
    { at: [0, 3.4], build: (rng, pal) => S.oarRack(rng, pal) },
    { at: [0, 0], clearRadius: 0, build: (rng) => S.waterSurface(rng, { width: S1.w - 1, depth: S1.d - 1, color: 0x0d3b40 }) },
    { at: [0, 1], clearRadius: 0, build: (rng) => S.groundMist(rng, { width: S1.w - 1, depth: S1.d - 1 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('galleon:creak') },
  ],
};

export function helmGame(handles: Record<string, unknown>, ctx: GameCtx): RoomGame {
  const helm = handles.helm as ReturnType<typeof S.shipWheel>;
  const bell = handles.bell as THREE.Group;

  let read = false;
  let goal = helm.wheel.rotation.z;
  let solved = false;

  ctx.setObjective('The galleon wallows, wheel spinning free. Someone must steer.');
  ctx.setHint('Ring the bell to read the last log heading, then haul the wheel over until it holds on that bearing.');

  ctx.register('bell', bell, () => {
    read = true;
    ctx.toast('The bell’s log plate: "Last heading — NORTH BY EAST. Bring her over and hold."');
    ctx.setObjective('Steer the wheel to the logged heading and hold it there.');
  });

  ctx.register('helm', helm.wheel, () => {
    if (solved) return;
    goal += WHEEL_STEP;
    if (read && Math.abs(angleDiff(goal, HEADING)) < HEADING_TOL) {
      solved = true;
      ctx.win('The bow swings true and the wheel locks on the bearing. The hatch below thuds open.');
    } else if (read) {
      ctx.toast('The wheel groans over…');
    } else {
      ctx.toast('The wheel spins uselessly — to what heading?');
    }
  });

  return {
    update: (delta) => {
      helm.wheel.rotation.z = approach(helm.wheel.rotation.z, goal, delta, 6);
    },
  };
}

// ── Stage 2 — The Flooded Hold ───────────────────────────────────────────────

const S2 = { w: 9, h: 3.6, d: 11 };
const PUMP_CODE = [3, 1, 4, 2]; // fader levels (0..levels-1)

export const holdSpec: RoomSpec = {
  name: 'The Flooded Hold',
  paletteName: 'abyssal',
  seed: 'galleon-hold:v1',
  size: S2,
  shell: { floor: 0x0e2a30, walls: 0x0c242b, ceiling: 0x081a20 },
  lighting: {
    ambient: { color: 0x1c4048, intensity: 0.5 },
    points: [
      { x: 0, y: 2.4, z: 1.4, color: 0xffcf8a, intensity: 8, distance: 7 },
      { x: -3.0, y: 2.2, z: -2.6, color: 0x39f0a0, intensity: 6, distance: 8 },
      { x: 3.0, y: 2.2, z: -2.2, color: 0x6fd8d0, intensity: 4, distance: 8 },
    ],
  },
  pieces: [
    { id: 'pumps', at: [0, WALL(S2.d) + 0.3], clearRadius: 0.6, build: (rng, pal) => S.sliderBank(rng, pal, { count: 4 }) },
    { id: 'manifest', at: [-3.0, WALL(S2.d) + 0.2], clearRadius: 0.6, build: (rng, pal) => S.portholeWall(rng, pal) },
    { at: [3.2, 2.6], build: (rng, pal) => S.anchorProp(rng, pal) },
    { at: [3.2, -2.8], rotY: -0.5, build: (rng, pal) => S.oarRack(rng, pal) },
    { at: [-3.2, 2.8], build: (rng, pal) => S.cannonBarrel(rng, pal) },
    { at: [0, 0], clearRadius: 0, build: (rng) => S.waterSurface(rng, { width: S2.w - 1, depth: S2.d - 1, color: 0x0d3b40 }) },
    { at: [2.4, 1.5], clearRadius: 0, build: (rng) => S.dripLine(rng, { span: 1.4 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('galleon:water') },
  ],
};

export function holdGame(handles: Record<string, unknown>, ctx: GameCtx): RoomGame {
  const pumps = handles.pumps as ReturnType<typeof S.sliderBank>;
  const manifest = handles.manifest as THREE.Group;
  const { knobs, travel, levels, base } = pumps;

  const yFor = (level: number): number => base + (level / (levels - 1)) * travel;
  const state = knobs.map((k) => Math.round(((k.position.y - base) / travel) * (levels - 1)));
  let read = false;
  let solved = false;

  ctx.setObjective('The hold is filling fast. The bilge pumps can save her — if set right.');
  ctx.setHint('Read the manifest chalked on the hull, then raise each of the four pump faders to its number: 3 · 1 · 4 · 2.');

  ctx.register('manifest', manifest, () => {
    read = true;
    ctx.toast('Chalked on a beam: "BILGE PUMPS — set the four to 3 · 1 · 4 · 2 (of 4)."');
    ctx.setObjective('Raise the four pump faders to 3 · 1 · 4 · 2.');
  });

  knobs.forEach((_k, i) => {
    ctx.register(`pump:${i}`, knobs[i], () => {
      if (solved) return;
      state[i] = (state[i] + 1) % levels;
      if (read && state.every((v, k) => v === PUMP_CODE[k])) {
        solved = true;
        ctx.toast('All four pumps thrum in time — the water level drops.');
        ctx.win('The hold drains with a filthy gurgle, uncovering the ladder aft. Onward.');
      } else {
        ctx.toast(`Pump ${i + 1} → level ${state[i]}.`);
      }
    });
  });

  return {
    update: (delta) => {
      knobs.forEach((knob, i) => {
        knob.position.y = approach(knob.position.y, yFor(state[i]), delta, 8);
      });
    },
  };
}

// ── Stage 3 — The Chart Room ─────────────────────────────────────────────────

const S3 = { w: 9, h: 3.6, d: 10 };
const STAR_TARGET = [2, 5, 1]; // ring clicks (of 8)
const RING_STEP = Math.PI / 4;

export const chartSpec: RoomSpec = {
  name: 'The Chart Room',
  paletteName: 'abyssal',
  seed: 'galleon-chart:v1',
  size: S3,
  shell: { floor: 0x123038, walls: 0x102c34, ceiling: 0x0a1e24 },
  lighting: {
    ambient: { color: 0x1e4650, intensity: 0.55 },
    points: [
      { x: 0, y: 2.6, z: 1.6, color: 0xffcf8a, intensity: 9, distance: 8 },
      { x: -3.0, y: 2.4, z: -2.4, color: 0x39f0a0, intensity: 6, distance: 8 },
      { x: 3.0, y: 2.6, z: -2.4, color: 0x6fd8d0, intensity: 5, distance: 9 },
    ],
  },
  pieces: [
    { id: 'rings', at: [0, 1.0], clearRadius: 1.0, build: (rng, pal) => S.rotaryRings(rng, pal) },
    { id: 'flare', at: [2.6, 1.2], rotY: -0.4, clearRadius: 0.8, build: (rng, pal) => S.leverBank(rng, pal, { levers: 1 }) },
    { id: 'chart', at: [-3.0, WALL(S3.d) + 0.2], clearRadius: 0.6, build: (rng, pal) => S.portholeWall(rng, pal) },
    { at: [3.2, 2.8], build: (rng, pal) => S.buoyFloat(rng, pal) },
    { at: [-3.2, 2.8], build: (rng, pal) => S.shipBell(rng, pal) },
    { at: [0, 3.2], clearRadius: 0, build: (rng) => S.godRays(rng, { color: 0x9fe8e0, height: S3.h }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('galleon:wind') },
  ],
};

export function chartGame(handles: Record<string, unknown>, ctx: GameCtx): RoomGame {
  const ringsH = handles.rings as ReturnType<typeof S.rotaryRings>;
  const flare = handles.flare as ReturnType<typeof S.leverBank>;
  const chart = handles.chart as THREE.Group;
  const rings = ringsH.rings;

  const rest = rings.map((r) => r.rotation.z);
  const clicks = rings.map(() => 0);
  let read = false;
  let aligned = false;
  let escaped = false;

  ctx.setObjective('A chart room, and a flare gun. But the astrolabe must be set to be found.');
  ctx.setHint('Read the plotted chart, then click each astrolabe ring until all three sit at 2 · 5 · 1. Then pull the flare lever.');

  ctx.register('chart', chart, () => {
    read = true;
    ctx.toast('The plotted fix: the three star rings read 2 · 5 · 1 from the outer.');
    ctx.setObjective('Set the astrolabe rings to 2 · 5 · 1.');
  });

  rings.forEach((ring, i) => {
    ctx.register(`ring:${i}`, ring, () => {
      if (aligned) return;
      clicks[i] = (clicks[i] + 1) % 8;
      if (read && clicks.every((c, k) => c === STAR_TARGET[k])) {
        aligned = true;
        ctx.toast('The rings click home — a star fix locks in.');
        ctx.setObjective('Fire the signal flare.');
      } else {
        ctx.toast(`Ring ${i + 1} → ${clicks[i]}.`);
      }
    });
  });

  ctx.register('flare', flare.levers[0], () => {
    if (!aligned) {
      ctx.toast('No sense firing blind — set the fix first.');
      return;
    }
    if (escaped) return;
    escaped = true;
    ctx.win('The flare screams up through the fog — and an answering horn sounds close by. You’re found. You’re out.');
  });

  return {
    update: (delta) => {
      rings.forEach((ring, i) => {
        ring.rotation.z = approach(ring.rotation.z, rest[i] + clicks[i] * RING_STEP, delta, 7);
      });
    },
  };
}
