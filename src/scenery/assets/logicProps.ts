import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import { openings, type PipeKind } from '@/scenery/puzzleLogic';
import type { Rng } from '@/scenery/rng';

/**
 * Structural puzzle mechanisms — the classes the asset audit found missing:
 * flow-routing, cipher decoding, and spatial sliding. Wall-mounted (face +Z);
 * rotatable parts turn about z. Connectivity/solve logic lives in puzzleLogic.
 */

const PIPE_CELL = 0.44;

/**
 * Grid of rotatable pipe tiles for a flow-routing puzzle. `tiles[r][c]` rotates
 * about z (game sets rotation.z = -orient * π/2); `kinds[r][c]` is its shape.
 * Feed kinds + the game's orientation grid to puzzleLogic.pipeConnected(src,dst).
 * The layout is fixed and solvable: the path cells are elbows/straights that can
 * be oriented to link src→dst; the rest are decoys.
 */
export function pipeGrid(
  rng: Rng,
  pal: Palette,
): {
  group: THREE.Group;
  tiles: THREE.Group[][];
  kinds: PipeKind[][];
  cols: number;
  rows: number;
  src: [number, number];
  dst: [number, number];
} {
  const kinds: PipeKind[][] = [
    ['elbow', 'straight', 'elbow'],
    ['elbow', 'tee', 'straight'],
    ['straight', 'elbow', 'elbow'],
  ];
  const rows = kinds.length;
  const cols = kinds[0].length;
  const group = new THREE.Group();
  const span = cols * PIPE_CELL;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(span + 0.12, rows * PIPE_CELL + 0.12, 0.08), pal.body);
  plate.position.set(0, 1.5, -0.06);
  plate.castShadow = true;
  group.add(plate);

  const armGeo = new THREE.BoxGeometry(0.06, PIPE_CELL / 2 + 0.03, 0.06);
  const tiles: THREE.Group[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: THREE.Group[] = [];
    for (let c = 0; c < cols; c++) {
      const tile = new THREE.Group();
      const socket = new THREE.Mesh(new THREE.CylinderGeometry(PIPE_CELL / 2 - 0.02, PIPE_CELL / 2 - 0.02, 0.04, 16), pal.trim);
      socket.rotation.x = Math.PI / 2;
      tile.add(socket);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 12), pal.metal);
      hub.rotation.x = Math.PI / 2;
      tile.add(hub);
      // Arms toward each base opening: N=+Y, E=+X, S=-Y, W=-X.
      const open = openings(kinds[r][c], 0);
      const dirs: Array<[number, number, number]> = [
        [0, 1, 0], // N
        [1, 0, Math.PI / 2], // E
        [0, -1, 0], // S
        [-1, 0, Math.PI / 2], // W
      ];
      open.forEach((on, d) => {
        if (!on) return;
        const arm = new THREE.Mesh(armGeo, pal.metal);
        const [ux, uy, rot] = dirs[d];
        arm.position.set(ux * (PIPE_CELL / 4 + 0.015), uy * (PIPE_CELL / 4 + 0.015), 0.02);
        arm.rotation.z = rot;
        tile.add(arm);
      });
      const x = (c - (cols - 1) / 2) * PIPE_CELL;
      const y = 1.5 + ((rows - 1) / 2 - r) * PIPE_CELL; // row 0 on top
      tile.position.set(x, y, 0.02);
      group.add(tile);
      row.push(tile);
    }
    tiles.push(row);
  }
  // Inlet/outlet studs marking source (top-left) and sink (bottom-right).
  const inlet = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 10), pal.glow(0x2bff88));
  inlet.rotation.z = Math.PI / 2;
  inlet.position.set(-(span / 2) - 0.05, tiles[0][0].position.y, 0.04);
  const outlet = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 10), pal.glow(pal.accent));
  outlet.rotation.z = -Math.PI / 2;
  outlet.position.set(span / 2 + 0.05, tiles[rows - 1][cols - 1].position.y, 0.04);
  group.add(inlet, outlet);
  rng.jitter(0.001); // keep the seeded signature honest

  return { group, tiles, kinds, cols, rows, src: [0, 0], dst: [rows - 1, cols - 1] };
}

/**
 * Two concentric decoder rings. `inner` rotates about z in `steps` detents; the
 * shift (clicks mod steps) is the Caesar offset. `outer` is fixed reference.
 */
export function cipherWheel(
  rng: Rng,
  pal: Palette,
  opts: { steps?: number } = {},
): { group: THREE.Group; inner: THREE.Group; outer: THREE.Group; steps: number } {
  const steps = opts.steps ?? 12;
  const group = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.06), pal.body);
  plate.position.set(0, 1.5, -0.04);
  plate.castShadow = true;
  group.add(plate);

  const outer = new THREE.Group();
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 10, 40), pal.trim);
  outer.add(outerRing);
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.02), i === 0 ? pal.glow(pal.accent) : pal.metal);
    mark.position.set(Math.sin(a) * 0.36, Math.cos(a) * 0.36, 0.03);
    mark.rotation.z = -a;
    outer.add(mark);
  }
  outer.position.set(0, 1.5, 0.02);
  group.add(outer);

  const inner = new THREE.Group();
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 10, 32), pal.metal);
  inner.add(innerRing);
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.05, 0.02), i === 0 ? pal.glow(0x2bff88) : pal.trim);
    mark.position.set(Math.sin(a) * 0.24, Math.cos(a) * 0.24, 0.02);
    mark.rotation.z = -a;
    inner.add(mark);
  }
  const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 8), pal.glow(0x2bff88));
  pointer.position.set(0, 0.3, 0.04);
  inner.add(pointer);
  inner.position.set(0, 1.5, 0.05);
  inner.rotation.z = rng.angle();
  group.add(inner);

  return { group, inner, outer, steps };
}

/**
 * A 3×3 sliding-tile (fifteen-puzzle) frame with 8 numbered tiles + one gap.
 * `tiles[k]` is the tile bearing k+1 pips; the game owns the layout and eases
 * each `tiles[k].position` to its slot. `slotOf(cell)` gives a slot's local x/y.
 */
export function slidingTiles(
  rng: Rng,
  pal: Palette,
  opts: { n?: number } = {},
): { group: THREE.Group; tiles: THREE.Group[]; n: number; slotOf: (cell: number) => { x: number; y: number } } {
  const n = opts.n ?? 3;
  const cell = 0.4;
  const gap = 0.02;
  const pitch = cell + gap;
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(n * pitch + 0.1, n * pitch + 0.1, 0.06), pal.body);
  frame.position.set(0, 1.5, -0.05);
  frame.castShadow = true;
  group.add(frame);

  const slotOf = (i: number): { x: number; y: number } => {
    const r = Math.floor(i / n);
    const c = i % n;
    return { x: (c - (n - 1) / 2) * pitch, y: 1.5 + ((n - 1) / 2 - r) * pitch };
  };

  const tiles: THREE.Group[] = [];
  for (let k = 0; k < n * n - 1; k++) {
    const tile = new THREE.Group();
    const face = new THREE.Mesh(new THREE.BoxGeometry(cell, cell, 0.05), pal.trim);
    tile.add(face);
    // (k+1) pips so the target order is legible.
    const count = k + 1;
    for (let p = 0; p < count; p++) {
      const pip = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 8), pal.glow(pal.accent));
      pip.rotation.x = Math.PI / 2;
      const pc = p % 3;
      const pr = Math.floor(p / 3);
      pip.position.set(-0.09 + pc * 0.09, 0.09 - pr * 0.09, 0.035);
      tile.add(pip);
    }
    tile.position.set(0, 1.5, 0.04); // game repositions
    group.add(tile);
    tiles.push(tile);
  }
  rng.jitter(0.001);
  return { group, tiles, n, slotOf };
}
