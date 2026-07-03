import * as THREE from 'three';
import type { Rng } from '@/scenery/rng';

/**
 * Shared-silhouette builders. These take explicit materials instead of a kit:
 * call them with the SAME rng seed and different materials in each dimension
 * and the players see the same shape in the same place — mossy timber for
 * Alpha, brushed alloy for Beta. That silhouette agreement is what lets one
 * player describe an object the other can find (the mirrored-footprint rule,
 * docs/DESIGN.md §2).
 */

export interface SharedMats {
  /** Primary body material. */
  body: THREE.Material;
  /** Trim/secondary material (edges, bands, legs). */
  trim: THREE.Material;
}

/** A leaning stack of storage crates. */
export function crateStack(
  rng: Rng,
  mats: SharedMats,
  opts: { tiers?: number; size?: number } = {},
): THREE.Group {
  const tiers = opts.tiers ?? 3;
  const size = opts.size ?? 0.6;
  const g = new THREE.Group();
  let y = 0;
  for (let i = 0; i < tiers; i++) {
    const s = size * rng.range(0.75, 1);
    const crate = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.8, s), mats.body);
    crate.position.set(rng.jitter(size * 0.18), y + s * 0.4, rng.jitter(size * 0.18));
    crate.rotation.y = rng.jitter(0.35);
    crate.castShadow = true;
    g.add(crate);
    // Lid band so the crate reads as a container from across the room.
    const band = new THREE.Mesh(new THREE.BoxGeometry(s + 0.02, s * 0.08, s + 0.02), mats.trim);
    band.position.copy(crate.position).y += s * 0.3;
    band.rotation.copy(crate.rotation);
    g.add(band);
    y += s * 0.8;
  }
  // Sometimes one crate has toppled off the stack.
  if (rng.chance(0.5)) {
    const s = size * rng.range(0.7, 0.9);
    const fallen = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.8, s), mats.body);
    fallen.position.set(rng.range(0.5, 0.8) * size * (rng.chance(0.5) ? 1 : -1), s * 0.35, rng.jitter(0.5));
    fallen.rotation.set(rng.jitter(0.2), rng.angle(), Math.PI / 2 + rng.jitter(0.15));
    fallen.castShadow = true;
    g.add(fallen);
  }
  return g;
}

/** A load-bearing column with base and capital. */
export function pillar(
  mats: SharedMats,
  opts: { height?: number; radius?: number } = {},
): THREE.Group {
  const height = opts.height ?? 3.5;
  const radius = opts.radius ?? 0.28;
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.06, height, 10), mats.body);
  shaft.position.y = height / 2;
  shaft.castShadow = true;
  g.add(shaft);
  for (const [y, s] of [
    [0.15, 1.5],
    [height - 0.15, 1.35],
  ] as const) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(radius * s * 2, 0.3, radius * s * 2), mats.trim);
    cap.position.y = y;
    g.add(cap);
  }
  return g;
}

/** Storage drums — most upright, one usually toppled. */
export function barrelCluster(
  rng: Rng,
  mats: SharedMats,
  opts: { count?: number } = {},
): THREE.Group {
  const count = opts.count ?? 4;
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const r = rng.range(0.2, 0.26);
    const h = rng.range(0.62, 0.78);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), mats.body);
    const a = rng.angle();
    const dist = rng.range(0, 0.55);
    const toppled = i === count - 1 && rng.chance(0.6);
    if (toppled) {
      barrel.rotation.set(Math.PI / 2, 0, rng.angle());
      barrel.position.set(Math.cos(a) * (dist + 0.5), r, Math.sin(a) * (dist + 0.5));
    } else {
      barrel.position.set(Math.cos(a) * dist, h / 2, Math.sin(a) * dist);
    }
    barrel.castShadow = true;
    g.add(barrel);
    // Rim rings top and bottom.
    for (const t of [0.12, 0.88]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.008, 0.014, 6, 16), mats.trim);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, -h / 2 + h * t, 0);
      barrel.add(ring);
    }
  }
  return g;
}

/** An overhead gantry frame: two A-legs and a crossbeam, spanning local X. */
export function gantryFrame(
  mats: SharedMats,
  opts: { span?: number; height?: number } = {},
): THREE.Group {
  const span = opts.span ?? 3.5;
  const height = opts.height ?? 2.8;
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    for (const lean of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, height / Math.cos(0.18), 0.12), mats.body);
      leg.position.set((side * span) / 2, height / 2, lean * Math.tan(0.18) * (height / 2));
      leg.rotation.x = lean * 0.18;
      leg.castShadow = true;
      g.add(leg);
    }
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 1.2), mats.trim);
    foot.position.set((side * span) / 2, 0.04, 0);
    g.add(foot);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(span + 0.4, 0.18, 0.18), mats.body);
  beam.position.y = height;
  beam.castShadow = true;
  g.add(beam);
  // Hook block hanging from the beam.
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), mats.trim);
  cable.position.set(0, height - 0.34, 0);
  g.add(cable);
  const block = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.14), mats.trim);
  block.position.set(0, height - 0.66, 0);
  g.add(block);
  return g;
}
