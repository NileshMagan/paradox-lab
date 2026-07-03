import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Architectural elements — the bones a room's dressing hangs off. All are
 * palette-driven (any theme), deterministic, origin on the floor, and built
 * facing +Z unless noted.
 */

/** A framed doorway opening: jambs, lintel, threshold. Wall goes around it. */
export function doorFrame(
  pal: Palette,
  opts: { width?: number; height?: number; depth?: number } = {},
): THREE.Group {
  const width = opts.width ?? 1.4;
  const height = opts.height ?? 2.4;
  const depth = opts.depth ?? 0.3;
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.18, height, depth), pal.trim);
    jamb.position.set((side * (width + 0.18)) / 2, height / 2, 0);
    jamb.castShadow = true;
    g.add(jamb);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(width + 0.54, 0.24, depth), pal.trim);
  lintel.position.y = height + 0.12;
  lintel.castShadow = true;
  g.add(lintel);
  const threshold = new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, depth + 0.08), pal.metal);
  threshold.position.y = 0.02;
  g.add(threshold);
  return g;
}

/** A masonry archway: two piers and a half-ring of voussoirs. Spans local X. */
export function archway(
  pal: Palette,
  opts: { span?: number; height?: number; depth?: number } = {},
): THREE.Group {
  const span = opts.span ?? 2.2;
  const height = opts.height ?? 2.2;
  const depth = opts.depth ?? 0.5;
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.4, height, depth), pal.body);
    pier.position.set((side * (span + 0.4)) / 2, height / 2, 0);
    pier.castShadow = true;
    g.add(pier);
  }
  // Half-torus arch resting on the piers.
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(span / 2 + 0.2, 0.2, 8, 20, Math.PI),
    pal.body,
  );
  arch.position.y = height;
  arch.castShadow = true;
  g.add(arch);
  const key = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, depth + 0.04), pal.trim);
  key.position.y = height + span / 2 + 0.16;
  g.add(key);
  return g;
}

/** A straight flight of stairs climbing along +Z. Origin at the bottom step. */
export function stairFlight(
  pal: Palette,
  opts: { steps?: number; width?: number; rise?: number; run?: number } = {},
): THREE.Group {
  const steps = opts.steps ?? 7;
  const width = opts.width ?? 1.4;
  const rise = opts.rise ?? 0.19;
  const run = opts.run ?? 0.3;
  const g = new THREE.Group();
  for (let i = 0; i < steps; i++) {
    const tread = new THREE.Mesh(new THREE.BoxGeometry(width, rise, run), pal.body);
    tread.position.set(0, i * rise + rise / 2, -(i * run) - run / 2);
    tread.castShadow = true;
    tread.receiveShadow = true;
    g.add(tread);
  }
  // Stringers close the sawtooth sides.
  const len = Math.hypot(steps * rise, steps * run);
  for (const side of [-1, 1]) {
    const stringer = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, len), pal.trim);
    stringer.position.set((side * width) / 2, (steps * rise) / 2, -(steps * run) / 2);
    stringer.rotation.x = Math.atan2(steps * rise, steps * run);
    g.add(stringer);
  }
  return g;
}

/** Guard railing with posts and two rails, running along local X. */
export function railing(pal: Palette, opts: { length?: number; height?: number } = {}): THREE.Group {
  const length = opts.length ?? 3;
  const height = opts.height ?? 1;
  const g = new THREE.Group();
  const posts = Math.max(2, Math.round(length / 1) + 1);
  for (let i = 0; i < posts; i++) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, height, 0.05), pal.metal);
    post.position.set(-length / 2 + (i / (posts - 1)) * length, height / 2, 0);
    g.add(post);
  }
  for (const y of [height, height * 0.55]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, length, 8), pal.metal);
    rail.rotation.z = Math.PI / 2;
    rail.position.y = y;
    g.add(rail);
  }
  return g;
}

/** A window frame with mullion bars and a pane. Facing +Z, origin at sill base. */
export function windowFrame(
  rng: Rng,
  pal: Palette,
  opts: { width?: number; height?: number; sillHeight?: number; broken?: boolean } = {},
): THREE.Group {
  const width = opts.width ?? 1.2;
  const height = opts.height ?? 1.1;
  const sill = opts.sillHeight ?? 1;
  const broken = opts.broken ?? rng.chance(0.3);
  const g = new THREE.Group();
  const frameMat = pal.trim;
  const bar = (w: number, h: number, x: number, y: number): THREE.Mesh => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), frameMat);
    m.position.set(x, y, 0);
    return m;
  };
  g.add(
    bar(width + 0.16, 0.08, 0, sill),
    bar(width + 0.16, 0.08, 0, sill + height),
    bar(0.08, height, -width / 2, sill + height / 2),
    bar(0.08, height, width / 2, sill + height / 2),
    bar(0.05, height, 0, sill + height / 2), // centre mullion
    bar(width, 0.05, 0, sill + height / 2), // transom
  );
  // Panes: four quarters; a broken window loses a couple.
  for (const [qx, qy] of [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ] as const) {
    if (broken && rng.chance(0.5)) continue;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(width / 2 - 0.06, height / 2 - 0.06), pal.glass);
    pane.position.set((qx * width) / 4, sill + height / 2 + (qy * height) / 4, 0);
    g.add(pane);
  }
  return g;
}

/** Exposed ceiling I-beams spanning local X, at intervals down Z. Origin at ceiling. */
export function ceilingBeams(
  rng: Rng,
  pal: Palette,
  opts: { span?: number; depth?: number; count?: number } = {},
): THREE.Group {
  const span = opts.span ?? 4;
  const depth = opts.depth ?? 4;
  const count = opts.count ?? 4;
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const z = -depth / 2 + (i / Math.max(1, count - 1)) * depth;
    const beam = new THREE.Group();
    const web = new THREE.Mesh(new THREE.BoxGeometry(span, 0.22, 0.05), pal.metal);
    const flangeTop = new THREE.Mesh(new THREE.BoxGeometry(span, 0.05, 0.2), pal.metal);
    flangeTop.position.y = 0.13;
    const flangeBot = flangeTop.clone();
    flangeBot.position.y = -0.13;
    beam.add(web, flangeTop, flangeBot);
    beam.position.set(0, -0.2, z + rng.jitter(0.1));
    g.add(beam);
  }
  return g;
}

/** A raised stepped platform (dais) of concentric slabs. */
export function platformDais(
  pal: Palette,
  opts: { radius?: number; tiers?: number } = {},
): THREE.Group {
  const radius = opts.radius ?? 1.4;
  const tiers = opts.tiers ?? 3;
  const g = new THREE.Group();
  for (let i = 0; i < tiers; i++) {
    const r = radius * (1 - i * 0.25);
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.14, 24), i % 2 ? pal.trim : pal.body);
    slab.position.y = i * 0.14 + 0.07;
    slab.receiveShadow = true;
    slab.castShadow = true;
    g.add(slab);
  }
  return g;
}

/** Recessed floor grate with frame and slats, flush with the floor. */
export function floorGrate(pal: Palette, opts: { width?: number; depth?: number } = {}): THREE.Group {
  const width = opts.width ?? 1.2;
  const depth = opts.depth ?? 0.8;
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.12, 0.05, depth + 0.12), pal.trim);
  frame.position.y = 0.025;
  g.add(frame);
  const slats = Math.round(width / 0.09);
  for (let i = 0; i < slats; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, depth - 0.06), pal.metal);
    slat.position.set(-width / 2 + 0.06 + (i / (slats - 1)) * (width - 0.12), 0.045, 0);
    g.add(slat);
  }
  return g;
}

/** A run of wall panelling with seams and kick plate, facing +Z. */
export function wallPanelling(
  rng: Rng,
  pal: Palette,
  opts: { length?: number; height?: number } = {},
): THREE.Group {
  const length = opts.length ?? 3.6;
  const height = opts.height ?? 2.4;
  const g = new THREE.Group();
  const panels = Math.max(2, Math.round(length / 0.9));
  const pw = length / panels;
  for (let i = 0; i < panels; i++) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(pw - 0.04, height - 0.3, 0.06), pal.body);
    panel.position.set(-length / 2 + pw / 2 + i * pw, (height - 0.3) / 2 + 0.24, 0);
    // The odd loose panel hangs slightly askew.
    if (rng.chance(0.15)) panel.rotation.z = rng.jitter(0.03);
    g.add(panel);
  }
  const kick = new THREE.Mesh(new THREE.BoxGeometry(length, 0.24, 0.08), pal.trim);
  kick.position.y = 0.12;
  g.add(kick);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.08), pal.trim);
  cap.position.y = height - 0.04;
  g.add(cap);
  return g;
}
