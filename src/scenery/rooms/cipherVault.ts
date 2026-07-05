import type * as THREE from 'three';
import * as S from '@/scenery';
import type { RoomSpec } from '@/scenery/compose';
import { approach, type GameCtx, type RoomGame } from '@/scenery/play';
import { createPuzzle, pipeConnected, type PipeKind } from '@/scenery/puzzleLogic';

/**
 * "The Cipher Vault" — the showcase for the new puzzle-logic layer and the
 * three structural mechanisms. Each stage pairs a new mechanism with an
 * order-independent multi-fact gate from puzzleLogic (createPuzzle), so props
 * are genuinely interdependent rather than a linear A-then-B chain:
 *   1. Decoding Room — cipher wheel + coded panel, gated on power AND decoded.
 *   2. Waterworks — rotate the pipe grid to route real flow (pipeConnected),
 *      gated on flow AND the main valve (either order).
 *   3. The Tumbler — a sliding-tile lock, gated on order AND the release.
 *
 * Handles: cipher, panel, power, note (S1); pipes, valve, note (S2);
 * tiles, release, note (S3).
 */

const WALL = (d: number): number => -d / 2 + 0.25;

// ── Stage 1 — The Decoding Room ──────────────────────────────────────────────

const S1 = { w: 9, h: 3.6, d: 10 };
const CIPHER_SHIFT = 5;
const PANEL_ORDER = [3, 1, 4, 0, 2];

export const decodingSpec: RoomSpec = {
  name: 'The Decoding Room',
  paletteName: 'noir',
  seed: 'vault-decoding:v1',
  size: S1,
  shell: { floor: 0x14161b, walls: 0x1a1d24, ceiling: 0x0e1014 },
  lighting: {
    ambient: { color: 0x2a3340, intensity: 0.5 },
    points: [
      { x: 0, y: 2.4, z: 1.4, color: 0xdfe9ff, intensity: 8, distance: 8 },
      { x: -2.8, y: 2.2, z: -2.4, color: 0x1fd1ff, intensity: 6, distance: 8 },
      { x: 2.8, y: 2.2, z: -2.4, color: 0xff2b3a, intensity: 4, distance: 7 },
    ],
  },
  pieces: [
    { id: 'cipher', at: [-1.4, WALL(S1.d)], clearRadius: 0.6, build: (rng, pal) => S.cipherWheel(rng, pal) },
    { id: 'panel', at: [1.6, WALL(S1.d)], clearRadius: 0.5, build: (rng, pal) => S.sequenceButtons(rng, pal, { count: 5 }) },
    { id: 'power', at: [3.0, 1.2], rotY: -0.5, clearRadius: 0.7, build: (rng, pal) => S.leverBank(rng, pal, { levers: 1 }) },
    { id: 'note', at: [-3.2, WALL(S1.d) + 0.1], clearRadius: 0.5, build: (rng, pal) => S.noticeBoard(rng, pal) },
    { at: [-3.2, 2.8], build: (rng, pal) => S.consoleBank(rng, pal) },
    { at: [3.2, 3.0], rotY: -0.6, build: (rng, pal) => S.storageTank(rng, pal) },
    { at: [0, 2], clearRadius: 0, build: (rng) => S.dustMotes(rng, { width: S1.w - 1, height: S1.h, depth: S1.d - 1, count: 120 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('vault:hum') },
  ],
};

export function decodingGame(handles: Record<string, unknown>, ctx: GameCtx): RoomGame {
  const cipher = handles.cipher as ReturnType<typeof S.cipherWheel>;
  const panel = handles.panel as ReturnType<typeof S.sequenceButtons>;
  const power = handles.power as ReturnType<typeof S.leverBank>;
  const note = handles.note as THREE.Group;
  const pz = createPuzzle();

  let read = false;
  let clicks = 0;
  let innerGoal = cipher.inner.rotation.z;
  let leverGoal = power.levers[0].rotation.x;
  let entered: number[] = [];
  const flash = panel.lampMaterials.map(() => 0);

  ctx.setObjective('A locked cipher vault. Nothing responds — the board is dead.');
  ctx.setHint(
    'Throw the power lever, then turn the cipher’s inner ring to a +5 shift to decode the panel order (3·1·4·2·... shown on the note). Power AND a decoded panel are both needed — in any order.',
  );

  // The win gate: three independent facts, satisfied in ANY order.
  pz.when(() => pz.is('power') && pz.is('decoded') && pz.is('entered'), () => {
    ctx.win('Relays cascade — the cipher vault sighs open. Through it, a flooded maintenance shaft.');
  });

  ctx.register('note', note, () => {
    read = true;
    ctx.toast('Ops note: "Power first. Set the wheel to +5. Then key the panel: 4·2·5·1·3."');
    ctx.setObjective('Restore power and set the cipher to +5.');
  });

  ctx.register('power', power.levers[0], () => {
    if (pz.is('power')) return;
    pz.set('power');
    leverGoal = -leverGoal;
    ctx.toast('The lever thunks over — the board’s lamps flicker awake.');
  });

  ctx.register('cipher', cipher.inner, () => {
    if (!pz.is('power')) {
      ctx.toast('The wheel turns, but its index lamp is dark. No power.');
      return;
    }
    if (pz.is('decoded')) return;
    clicks += 1;
    innerGoal = -clicks * ((Math.PI * 2) / cipher.steps);
    const shift = clicks % cipher.steps;
    if (shift === CIPHER_SHIFT) {
      pz.set('decoded');
      ctx.toast('The rings lock at +5 — the panel order resolves: 4·2·5·1·3.');
      ctx.setObjective('Key the panel: 4·2·5·1·3.');
    } else {
      ctx.toast(`Cipher shift +${shift}.`);
    }
  });

  panel.buttons.forEach((_b, i) => {
    ctx.register(`btn:${i}`, panel.buttons[i], () => {
      if (pz.is('entered')) return;
      if (!pz.is('power') || !pz.is('decoded')) {
        ctx.toast('The panel is inert until powered and decoded.');
        return;
      }
      flash[i] = 0.4;
      entered.push(i);
      if (!entered.every((v, k) => v === PANEL_ORDER[k])) {
        entered = [];
        ctx.toast('Reject buzzer — the sequence clears.');
        return;
      }
      if (entered.length === PANEL_ORDER.length) {
        pz.set('entered');
      } else {
        ctx.toast(`Accepted (${entered.length}/${PANEL_ORDER.length}).`);
      }
    });
  });

  void read;
  return {
    update: (delta) => {
      pz.tick();
      cipher.inner.rotation.z = approach(cipher.inner.rotation.z, innerGoal, delta, 7);
      power.levers[0].rotation.x = approach(power.levers[0].rotation.x, leverGoal, delta, 8);
      panel.lampMaterials.forEach((mat, i) => {
        if (flash[i] > 0) flash[i] -= delta;
        mat.emissiveIntensity = approach(mat.emissiveIntensity, flash[i] > 0 ? 1.8 : 0.35, delta, 10);
      });
    },
  };
}

// ── Stage 2 — The Waterworks ─────────────────────────────────────────────────

const S2 = { w: 10, h: 3.8, d: 11 };

export const waterworksSpec: RoomSpec = {
  name: 'The Waterworks',
  paletteName: 'noir',
  seed: 'vault-waterworks:v1',
  size: S2,
  shell: { floor: 0x141a1c, walls: 0x1a2226, ceiling: 0x0e1214 },
  lighting: {
    ambient: { color: 0x2a3840, intensity: 0.55 },
    points: [
      { x: 0, y: 2.4, z: 1.4, color: 0xdfe9ff, intensity: 8, distance: 8 },
      { x: -3.0, y: 2.2, z: -2.4, color: 0x2bff88, intensity: 6, distance: 8 },
      { x: 3.0, y: 2.2, z: -2.4, color: 0x1fd1ff, intensity: 6, distance: 8 },
    ],
  },
  pieces: [
    { id: 'pipes', at: [0, WALL(S2.d)], clearRadius: 0.4, build: (rng, pal) => S.pipeGrid(rng, pal) },
    { id: 'valve', at: [3.0, 1.2], rotY: -0.5, clearRadius: 0.7, build: (rng, pal) => S.leverBank(rng, pal, { levers: 1 }) },
    { id: 'note', at: [-3.2, WALL(S2.d) + 0.1], clearRadius: 0.5, build: (rng, pal) => S.noticeBoard(rng, pal) },
    { at: [-3.2, 2.8], build: (rng, pal) => S.pumpAssembly(rng, pal) },
    { at: [3.2, 3.0], build: (rng, pal) => S.storageTank(rng, pal) },
    { at: [0, 0], clearRadius: 0, build: (rng) => S.waterSurface(rng, { width: S2.w - 1, depth: S2.d - 1, color: 0x0d2b30 }) },
    { at: [0, 2], clearRadius: 0, build: (rng) => S.groundMist(rng, { width: S2.w - 1, depth: S2.d - 1 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('vault:drip') },
  ],
};

export function waterworksGame(handles: Record<string, unknown>, ctx: GameCtx): RoomGame {
  const pipes = handles.pipes as ReturnType<typeof S.pipeGrid>;
  const valve = handles.valve as ReturnType<typeof S.leverBank>;
  const note = handles.note as THREE.Group;
  const pz = createPuzzle();
  const { tiles, kinds, src, dst, rows, cols } = pipes;

  // Deterministic scramble of every tile's orientation (still solvable — the
  // path cells can be rotated back to link src→dst).
  const orient: number[][] = kinds.map((row: PipeKind[], r: number) =>
    row.map((_k: PipeKind, c: number) => (r * 3 + c * 2 + 1) % 4),
  );
  let valveGoal = valve.levers[0].rotation.x;

  const applyRotations = (): void => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) tiles[r][c].rotation.z = -orient[r][c] * (Math.PI / 2);
    }
  };
  applyRotations();

  ctx.setObjective('A flooded shaft. Route the flow to crack the sluice.');
  ctx.setHint(
    'Rotate the pipe tiles so an unbroken line runs from the green inlet (top-left) to the amber outlet (bottom-right), then throw the main valve. Both are needed — either order.',
  );

  pz.when(() => pz.is('connected') && pz.is('valve'), () => {
    ctx.win('Flow surges the whole route, the sluice bangs open, and the water drains away down the shaft.');
  });

  ctx.register('note', note, () => {
    ctx.toast('Stencilled on the wall: "GREEN inlet → AMBER outlet. Then main valve."');
    ctx.setObjective('Connect inlet to outlet, then open the main valve.');
  });

  tiles.forEach((row: THREE.Group[], r: number) => {
    row.forEach((_tile: THREE.Group, c: number) => {
      ctx.register(`pipe:${r},${c}`, tiles[r][c], () => {
        if (pz.is('connected')) return;
        orient[r][c] = (orient[r][c] + 1) % 4;
        tiles[r][c].rotation.z = -orient[r][c] * (Math.PI / 2);
        if (pipeConnected(kinds, orient, src, dst)) {
          pz.set('connected');
          ctx.toast('The line runs green to amber — flow is routed.');
        }
      });
    });
  });

  ctx.register('valve', valve.levers[0], () => {
    if (pz.is('valve')) return;
    pz.set('valve');
    valveGoal = -valveGoal;
    ctx.toast(pz.is('connected') ? 'Main valve open.' : 'Main valve open — but nothing flows yet.');
  });

  return {
    update: (delta) => {
      pz.tick();
      valve.levers[0].rotation.x = approach(valve.levers[0].rotation.x, valveGoal, delta, 8);
    },
  };
}

// ── Stage 3 — The Tumbler ────────────────────────────────────────────────────

const S3 = { w: 9, h: 3.6, d: 10 };
// Scramble the sliding lock by these blank moves from solved (guarantees solvable).
const SLIDE_SCRAMBLE = [3, 4, 5, 2, 1, 4, 7, 6, 3, 4, 5, 8, 7, 4];

export const tumblerSpec: RoomSpec = {
  name: 'The Tumbler',
  paletteName: 'noir',
  seed: 'vault-tumbler:v1',
  size: S3,
  shell: { floor: 0x14161b, walls: 0x1a1d24, ceiling: 0x0e1014 },
  lighting: {
    ambient: { color: 0x2a3340, intensity: 0.5 },
    points: [
      { x: 0, y: 2.4, z: 1.6, color: 0xdfe9ff, intensity: 9, distance: 8 },
      { x: -2.8, y: 2.2, z: -2.4, color: 0x1fd1ff, intensity: 6, distance: 8 },
      { x: 2.8, y: 2.4, z: -2.4, color: 0x2bff88, intensity: 5, distance: 8 },
    ],
  },
  pieces: [
    { id: 'tiles', at: [0, WALL(S3.d)], clearRadius: 0.4, build: (rng, pal) => S.slidingTiles(rng, pal, { n: 3 }) },
    { id: 'release', at: [2.8, 1.2], rotY: -0.5, clearRadius: 0.7, build: (rng, pal) => S.leverBank(rng, pal, { levers: 1 }) },
    { id: 'note', at: [-3.2, WALL(S3.d) + 0.1], clearRadius: 0.5, build: (rng, pal) => S.noticeBoard(rng, pal) },
    { at: [-3.0, 2.8], build: (rng, pal) => S.consoleBank(rng, pal) },
    { at: [3.2, 3.0], build: (rng, pal) => S.storageTank(rng, pal) },
    { at: [0, 2], clearRadius: 0, build: (rng) => S.dustMotes(rng, { width: S3.w - 1, height: S3.h, depth: S3.d - 1, count: 120 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('vault:tick') },
  ],
};

export function tumblerGame(handles: Record<string, unknown>, ctx: GameCtx): RoomGame {
  const lock = handles.tiles as ReturnType<typeof S.slidingTiles>;
  const release = handles.release as ReturnType<typeof S.leverBank>;
  const note = handles.note as THREE.Group;
  const pz = createPuzzle();
  const n = lock.n;
  const N = n * n;

  // layout[cell] = tile id (0..N-2) or -1 for the gap. Solved = identity, gap last.
  const layout: number[] = [...Array(N - 1).keys(), -1];
  let blank = N - 1;
  const slide = (cell: number): boolean => {
    const adj = [cell - n, cell + n, cell % n ? cell - 1 : -1, cell % n !== n - 1 ? cell + 1 : -1];
    if (!adj.includes(blank)) return false;
    layout[blank] = layout[cell];
    layout[cell] = -1;
    blank = cell;
    return true;
  };
  for (const cell of SLIDE_SCRAMBLE) slide(cell); // scramble by legal moves
  let releaseGoal = release.levers[0].rotation.x;

  const solved = (): boolean => layout.every((id, cell) => id === (cell === N - 1 ? -1 : cell));

  ctx.setObjective('The final door is a sliding tumbler lock, scrambled.');
  ctx.setHint(
    'Slide the pip tiles (click one next to the gap) until they read 1→8 in order with the gap last, then throw the release. Both the solved lock AND the release are needed.',
  );

  pz.when(() => pz.is('ordered') && pz.is('released'), () => {
    ctx.win('The tumblers align, the release drops, and the vault door rolls back. You walk out into daylight.');
  });

  ctx.register('note', note, () => {
    ctx.toast('Etched plate: "Order the tumblers 1 → 8, gap last. Then the release."');
    ctx.setObjective('Order the tiles 1→8 (gap last), then throw the release.');
  });

  lock.tiles.forEach((_t, id) => {
    ctx.register(`tile:${id}`, lock.tiles[id], () => {
      if (pz.is('ordered')) return;
      const cell = layout.indexOf(id);
      if (cell < 0 || !slide(cell)) {
        ctx.toast('That tile has nowhere to slide.');
        return;
      }
      if (solved()) {
        pz.set('ordered');
        ctx.toast('Every tumbler clicks into line.');
      }
    });
  });

  ctx.register('release', release.levers[0], () => {
    if (pz.is('released')) return;
    pz.set('released');
    releaseGoal = -releaseGoal;
    ctx.toast(pz.is('ordered') ? 'The release drops home.' : 'The release throws — but the tumblers aren’t set.');
  });

  return {
    update: (delta) => {
      pz.tick();
      lock.tiles.forEach((tile, id) => {
        const cell = layout.indexOf(id);
        const slot = lock.slotOf(cell);
        tile.position.x = approach(tile.position.x, slot.x, delta, 10);
        tile.position.y = approach(tile.position.y, slot.y, delta, 10);
      });
      release.levers[0].rotation.x = approach(release.levers[0].rotation.x, releaseGoal, delta, 8);
    },
  };
}
