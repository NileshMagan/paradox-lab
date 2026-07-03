import * as THREE from 'three';
import { scatter as scatterPoints, applyPlacement, insetArea, type KeepOut } from '@/scenery/dress';
import { disposeSceneryObject } from '@/scenery/kits';
import { createPalette, PALETTE_SPECS, type Palette } from '@/scenery/palettes';
import { Rng } from '@/scenery/rng';

/**
 * Room composition — the layer that turns the asset library into a themed
 * escape room. A `RoomSpec` is a recipe: shell + lighting + named set pieces
 * + scatter dressing, all deterministic from one seed. `composeRoom` builds
 * it and hands back per-frame updates plus a `handles` map so game code can
 * wire the puzzle props (keypads, vault doors, rotary rings…) by id.
 *
 * This lives beside the game's mirrored-footprint rooms, not inside them:
 * specs here are standalone themed rooms (viewer: /rooms.html). When one
 * graduates into the game, its prop positions move into config/facility.ts.
 */

/**
 * Whatever a library builder returns. Handle objects (keypads, vault doors…)
 * carry richer fields than this shape; `handles` preserves the original value
 * so game code can narrow it back to the builder's declared return type.
 */
type BuilderOut =
  | THREE.Object3D
  | { group: THREE.Group; update?: (delta: number, elapsed: number) => void };

export interface PieceSpec {
  /** Name this piece to receive its raw builder return in `handles`. */
  id?: string;
  /** Room-local floor position (y up is optional for tabletop props). */
  at: [number, number];
  y?: number;
  rotY?: number;
  /** Radius reserved around this piece so scatter never crowds it. */
  clearRadius?: number;
  build: (rng: Rng, pal: Palette) => BuilderOut;
}

export interface ScatterSpec {
  count: number;
  minSpacing?: number;
  /** Inset from the walls (default 0.9). */
  margin?: number;
  scaleRange?: [number, number];
  build: (rng: Rng, pal: Palette) => BuilderOut;
}

export interface RoomSpec {
  name: string;
  paletteName: string;
  seed: string;
  size: { w: number; h: number; d: number };
  /** Shell surface colours (defaults derive from the palette). */
  shell?: { floor?: number; walls?: number; ceiling?: number };
  lighting: {
    ambient: { color: number; intensity: number };
    points: Array<{
      x: number;
      y: number;
      z: number;
      color: number;
      intensity: number;
      distance?: number;
    }>;
  };
  pieces: PieceSpec[];
  scatter?: ScatterSpec[];
}

export interface ComposedRoom {
  group: THREE.Group;
  palette: Palette;
  /** Raw builder returns for every piece that declared an `id`. */
  handles: Record<string, BuilderOut>;
  update: (delta: number, elapsed: number) => void;
  dispose: () => void;
}

export function paletteByName(name: string): Palette {
  const spec = PALETTE_SPECS.find((p) => p.name === name);
  if (!spec) throw new Error(`unknown palette: ${name}`);
  return createPalette(spec);
}

function normalize(out: BuilderOut): {
  object: THREE.Object3D;
  update?: (delta: number, elapsed: number) => void;
} {
  if (out instanceof THREE.Object3D) return { object: out };
  return out.update ? { object: out.group, update: out.update } : { object: out.group };
}

/** Build a complete room from its spec. Same spec + seed ⇒ identical room. */
export function composeRoom(spec: RoomSpec): ComposedRoom {
  const palette = paletteByName(spec.paletteName);
  const rng = new Rng(spec.seed);
  const group = new THREE.Group();
  group.name = `composed:${spec.name}`;
  const updates: Array<(delta: number, elapsed: number) => void> = [];
  const handles: Record<string, BuilderOut> = {};
  const { w, h, d } = spec.size;

  // ── Shell: floor, four walls, ceiling ────────────────────────────────────
  const shellMats: THREE.MeshStandardMaterial[] = [];
  const surface = (color: number, roughness: number): THREE.MeshStandardMaterial => {
    const mat = new THREE.MeshStandardMaterial({ color, roughness });
    shellMats.push(mat);
    return mat;
  };
  const floorMat = surface(spec.shell?.floor ?? palette.trim.color.getHex(), 0.95);
  const wallMat = surface(spec.shell?.walls ?? palette.body.color.getHex(), 0.92);
  const ceilMat = surface(spec.shell?.ceiling ?? palette.trim.color.getHex(), 0.95);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), floorMat);
  floor.position.y = -0.1;
  floor.receiveShadow = true;
  group.add(floor);
  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), ceilMat);
  ceiling.position.y = h + 0.1;
  ceiling.name = 'ceiling'; // viewers hide this for the dollhouse angle
  group.add(ceiling);
  const wallGeoZ = new THREE.BoxGeometry(w, h, 0.2);
  const wallGeoX = new THREE.BoxGeometry(0.2, h, d);
  for (const [geo, x, z] of [
    [wallGeoZ, 0, -d / 2],
    [wallGeoZ.clone(), 0, d / 2],
    [wallGeoX, -w / 2, 0],
    [wallGeoX.clone(), w / 2, 0],
  ] as const) {
    const wall = new THREE.Mesh(geo, wallMat);
    wall.position.set(x, h / 2, z);
    wall.receiveShadow = true;
    group.add(wall);
  }

  // ── Lighting ─────────────────────────────────────────────────────────────
  group.add(new THREE.AmbientLight(spec.lighting.ambient.color, spec.lighting.ambient.intensity));
  for (const p of spec.lighting.points) {
    const light = new THREE.PointLight(p.color, p.intensity, p.distance ?? 12, 1.8);
    light.position.set(p.x, p.y, p.z);
    group.add(light);
  }

  // ── Set pieces ───────────────────────────────────────────────────────────
  const keepOuts: KeepOut[] = [];
  for (const piece of spec.pieces) {
    const out = piece.build(rng.fork(`piece:${piece.id ?? piece.at.join(',')}`), palette);
    const { object, update } = normalize(out);
    object.position.x += piece.at[0];
    object.position.z += piece.at[1];
    if (piece.y) object.position.y += piece.y;
    if (piece.rotY) object.rotation.y = piece.rotY;
    group.add(object);
    if (update) updates.push(update);
    if (piece.id) handles[piece.id] = out;
    keepOuts.push({ x: piece.at[0], z: piece.at[1], radius: piece.clearRadius ?? 1.1 });
  }

  // ── Scatter dressing around the pieces ───────────────────────────────────
  (spec.scatter ?? []).forEach((sc, index) => {
    const placements = scatterPoints({
      seed: `${spec.seed}:scatter:${index}`,
      area: insetArea(w, d, sc.margin ?? 0.9),
      count: sc.count,
      minSpacing: sc.minSpacing ?? 1.1,
      avoid: keepOuts,
      scaleRange: sc.scaleRange ?? [0.85, 1.15],
    });
    for (const p of placements) {
      const out = sc.build(rng.fork(`scatter:${index}:${p.x.toFixed(2)},${p.z.toFixed(2)}`), palette);
      const { object, update } = normalize(out);
      applyPlacement(object, p);
      group.add(object);
      if (update) updates.push(update);
      keepOuts.push({ x: p.x, z: p.z, radius: 0.7 });
    }
  });

  return {
    group,
    palette,
    handles,
    update: (delta, elapsed) => {
      for (const update of updates) update(delta, elapsed);
    },
    dispose: () => {
      disposeSceneryObject(group);
      for (const mat of shellMats) mat.dispose();
      palette.dispose();
    },
  };
}
