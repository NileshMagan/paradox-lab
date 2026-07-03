import type * as THREE from 'three';
import { Rng } from '@/scenery/rng';

/**
 * The deterministic dressing kit: seed → placements.
 *
 * Placements are pure data (no THREE objects), computed only from a seed and
 * a spec. That split mirrors the blueprint/renderer split of the facility
 * itself: generate ONE placement list per room from a shared seed, then let
 * each dimension map every placement to its own themed asset — the clutter
 * silhouettes line up across dimensions ("the pile next to the third pillar")
 * without either dimension knowing what the other drew.
 */

export interface Placement {
  x: number;
  z: number;
  rotationY: number;
  scale: number;
}

/** Keep-out disc, e.g. a puzzle prop slot, doorway, or the camera spawn. */
export interface KeepOut {
  x: number;
  z: number;
  radius: number;
}

/** Axis-aligned floor region in room-local coordinates. */
export interface Area {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Floor area of a `size.x × size.z` room, inset by `margin` from the walls. */
export function insetArea(sizeX: number, sizeZ: number, margin = 0.6): Area {
  return {
    minX: -sizeX / 2 + margin,
    maxX: sizeX / 2 - margin,
    minZ: -sizeZ / 2 + margin,
    maxZ: sizeZ / 2 - margin,
  };
}

/**
 * Scatter points across an area with a minimum spacing (deterministic
 * dart-throwing). Points landing inside a keep-out disc are rejected, so
 * clutter never blocks a puzzle prop or door. May return fewer than `count`
 * if the area is too tight — by design, never overcrowds.
 */
export function scatter(opts: {
  seed: number | string;
  area: Area;
  count: number;
  minSpacing?: number;
  avoid?: KeepOut[];
  scaleRange?: [number, number];
}): Placement[] {
  const rng = new Rng(opts.seed);
  const minSpacing = opts.minSpacing ?? 0.9;
  const avoid = opts.avoid ?? [];
  const [sMin, sMax] = opts.scaleRange ?? [0.85, 1.15];
  const placed: Placement[] = [];
  let attempts = 0;
  const maxAttempts = opts.count * 30;
  while (placed.length < opts.count && attempts < maxAttempts) {
    attempts++;
    const x = rng.range(opts.area.minX, opts.area.maxX);
    const z = rng.range(opts.area.minZ, opts.area.maxZ);
    if (avoid.some((k) => (x - k.x) ** 2 + (z - k.z) ** 2 < k.radius ** 2)) continue;
    if (placed.some((p) => (x - p.x) ** 2 + (z - p.z) ** 2 < minSpacing ** 2)) continue;
    placed.push({ x, z, rotationY: rng.angle(), scale: rng.range(sMin, sMax) });
  }
  return placed;
}

/**
 * Evenly spaced placements along a wall segment, jittered so the line doesn't
 * read as machine-placed. `rotationY` faces every placement the same way
 * (pass the wall's inward normal angle); `rotationJitter` roughs that up.
 */
export function alongWall(opts: {
  seed: number | string;
  from: { x: number; z: number };
  to: { x: number; z: number };
  count: number;
  rotationY?: number;
  jitter?: number;
  rotationJitter?: number;
  scaleRange?: [number, number];
}): Placement[] {
  const rng = new Rng(opts.seed);
  const jitter = opts.jitter ?? 0.15;
  const rotationY = opts.rotationY ?? 0;
  const rotationJitter = opts.rotationJitter ?? 0.1;
  const [sMin, sMax] = opts.scaleRange ?? [0.9, 1.1];
  const dx = opts.to.x - opts.from.x;
  const dz = opts.to.z - opts.from.z;
  const len = Math.hypot(dx, dz) || 1;
  // Perpendicular (for jitter off the wall line).
  const px = -dz / len;
  const pz = dx / len;
  const placements: Placement[] = [];
  for (let i = 0; i < opts.count; i++) {
    const t = opts.count === 1 ? 0.5 : i / (opts.count - 1);
    const along = rng.jitter(jitter);
    const off = rng.jitter(jitter);
    placements.push({
      x: opts.from.x + dx * t + (dx / len) * along + px * off,
      z: opts.from.z + dz * t + (dz / len) * along + pz * off,
      rotationY: rotationY + rng.jitter(rotationJitter),
      scale: rng.range(sMin, sMax),
    });
  }
  return placements;
}

/** Placements around a circle, each rotated to face the centre. */
export function ring(opts: {
  seed: number | string;
  centerX?: number;
  centerZ?: number;
  radius: number;
  count: number;
  startAngle?: number;
  radiusJitter?: number;
  scaleRange?: [number, number];
}): Placement[] {
  const rng = new Rng(opts.seed);
  const cx = opts.centerX ?? 0;
  const cz = opts.centerZ ?? 0;
  const start = opts.startAngle ?? 0;
  const radiusJitter = opts.radiusJitter ?? 0;
  const [sMin, sMax] = opts.scaleRange ?? [0.9, 1.1];
  const placements: Placement[] = [];
  for (let i = 0; i < opts.count; i++) {
    const a = start + (i / opts.count) * Math.PI * 2 + rng.jitter(0.35 / opts.count);
    const r = opts.radius + rng.jitter(radiusJitter);
    placements.push({
      x: cx + Math.cos(a) * r,
      z: cz + Math.sin(a) * r,
      // Face the centre: -a puts local +Z toward (cx, cz) for a at 0 along +X.
      rotationY: -a - Math.PI / 2,
      scale: rng.range(sMin, sMax),
    });
  }
  return placements;
}

/** Apply a placement to a built prop (keeps the prop's own Y). */
export function applyPlacement(object: THREE.Object3D, p: Placement): void {
  object.position.x = p.x;
  object.position.z = p.z;
  object.rotation.y = p.rotationY;
  object.scale.multiplyScalar(p.scale);
}
