import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Small clutter — the last 10% that makes a space believable. Cheap meshes
 * meant to be scattered liberally with the dressing kit. Palette-driven,
 * deterministic, origin on the floor.
 */

/** A run of books leaning along local X (for shelves, desks, floors). */
export function bookRow(rng: Rng, pal: Palette, opts: { length?: number } = {}): THREE.Group {
  const length = opts.length ?? 0.8;
  const g = new THREE.Group();
  let cursor = -length / 2;
  let lean = 0;
  while (cursor < length / 2 - 0.03) {
    const w = rng.range(0.02, 0.05);
    const h = rng.range(0.16, 0.26);
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, rng.range(0.1, 0.16)),
      rng.chance(0.5) ? pal.soft : pal.trim,
    );
    // Occasionally a gap makes the next book lean into it.
    if (rng.chance(0.2)) {
      cursor += rng.range(0.03, 0.08);
      lean = 0.35;
    }
    book.position.set(cursor + w / 2, h / 2 - (lean ? 0.01 : 0), 0);
    book.rotation.z = lean;
    lean = 0;
    g.add(book);
    cursor += w + 0.004;
  }
  return g;
}

/** Bottles, jars, and vials clustered on a surface. */
export function bottleCluster(rng: Rng, pal: Palette, opts: { count?: number } = {}): THREE.Group {
  const count = opts.count ?? 6;
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const r = rng.range(0.025, 0.055);
    const h = rng.range(0.1, 0.28);
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 10), pal.glass);
    const a = rng.angle();
    const d = rng.range(0, 0.22);
    const fallen = rng.chance(0.15);
    if (fallen) {
      bottle.rotation.x = Math.PI / 2;
      bottle.rotation.z = rng.angle();
      bottle.position.set(Math.cos(a) * (d + 0.1), r, Math.sin(a) * (d + 0.1));
    } else {
      bottle.position.set(Math.cos(a) * d, h / 2, Math.sin(a) * d);
    }
    g.add(bottle);
    if (!fallen && rng.chance(0.7)) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, 0.02, 8), pal.metal);
      cap.position.set(bottle.position.x, h + 0.01, bottle.position.z);
      g.add(cap);
    }
  }
  return g;
}

/** Dropped tools: wrenches, a hammer, loose rods and small parts. */
export function toolScatter(rng: Rng, pal: Palette, opts: { radius?: number } = {}): THREE.Group {
  const radius = opts.radius ?? 0.5;
  const g = new THREE.Group();
  const pieces = 5 + rng.int(4);
  for (let i = 0; i < pieces; i++) {
    const kind = rng.int(3);
    let tool: THREE.Mesh;
    if (kind === 0) {
      // Wrench-ish: bar with a lump at one end.
      tool = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.015, 0.03), pal.metal);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8), pal.metal);
      head.position.x = 0.11;
      tool.add(head);
    } else if (kind === 1) {
      // Rod / screwdriver.
      tool = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, rng.range(0.14, 0.24), 6), pal.metal);
      tool.rotation.z = Math.PI / 2;
    } else {
      // Small part / nut.
      tool = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.015, 6), pal.trim);
    }
    tool.position.set(rng.jitter(radius), 0.015, rng.jitter(radius));
    tool.rotation.y = rng.angle();
    g.add(tool);
  }
  return g;
}

/** Loose paper sheets drifted across the floor. */
export function paperScatter(rng: Rng, pal: Palette, opts: { radius?: number; count?: number } = {}): THREE.Group {
  const radius = opts.radius ?? 0.7;
  const count = opts.count ?? 9;
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const sheet = new THREE.Mesh(
      new THREE.PlaneGeometry(rng.range(0.14, 0.2), rng.range(0.2, 0.28)),
      pal.soft,
    );
    sheet.rotation.set(-Math.PI / 2 + rng.jitter(0.06), 0, rng.angle());
    sheet.position.set(rng.jitter(radius), 0.005 + i * 0.0015, rng.jitter(radius));
    g.add(sheet);
  }
  return g;
}

/** A coil of heavy cable dumped on the floor, tail trailing off. */
export function cableCoil(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const loops = 3 + rng.int(3);
  for (let i = 0; i < loops; i++) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.2 + rng.jitter(0.03), 0.025, 6, 18), pal.trim);
    loop.rotation.x = Math.PI / 2 + rng.jitter(0.12);
    loop.position.set(rng.jitter(0.03), 0.03 + i * 0.045, rng.jitter(0.03));
    loop.rotation.z = rng.angle();
    g.add(loop);
  }
  const tail = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.2, 0.03, 0),
    new THREE.Vector3(0.5, 0.02, rng.jitter(0.3)),
    new THREE.Vector3(0.85, 0.02, rng.jitter(0.5)),
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(tail, 10, 0.025, 6), pal.trim));
  return g;
}

/** A stack of slatted shipping pallets. */
export function palletStack(rng: Rng, pal: Palette, opts: { count?: number } = {}): THREE.Group {
  const count = opts.count ?? 3;
  const g = new THREE.Group();
  for (let p = 0; p < count; p++) {
    const pallet = new THREE.Group();
    for (let s = 0; s < 5; s++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(1, 0.025, 0.14), pal.soft);
      slat.position.set(0, 0.09, -0.4 + s * 0.2);
      pallet.add(slat);
    }
    for (const x of [-0.42, 0, 0.42]) {
      const bearer = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.95), pal.trim);
      bearer.position.set(x, 0.04, 0);
      pallet.add(bearer);
    }
    pallet.position.set(rng.jitter(0.05), p * 0.115, rng.jitter(0.05));
    pallet.rotation.y = rng.jitter(0.15);
    g.add(pallet);
  }
  return g;
}

/** Equipment hidden under a draped tarp — lumpy, anonymous, story-rich. */
export function tarpPile(rng: Rng, pal: Palette, opts: { radius?: number } = {}): THREE.Group {
  const radius = opts.radius ?? 0.7;
  const g = new THREE.Group();
  const lumps = 3 + rng.int(3);
  for (let i = 0; i < lumps; i++) {
    const r = rng.range(0.3, 0.55) * radius;
    const lump = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 7), pal.soft);
    lump.position.set(rng.jitter(radius * 0.5), r * 0.55, rng.jitter(radius * 0.5));
    lump.scale.y = 0.7;
    lump.castShadow = true;
    g.add(lump);
  }
  // Skirt where the tarp meets the floor.
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.15, 0.16, 14), pal.soft);
  skirt.position.y = 0.08;
  g.add(skirt);
  return g;
}

/** Small utility crates (mini siblings of the shared crateStack). */
export function smallCrates(rng: Rng, pal: Palette, opts: { count?: number } = {}): THREE.Group {
  const count = opts.count ?? 4;
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const s = rng.range(0.18, 0.3);
    const crate = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.7, s), pal.trim);
    const a = rng.angle();
    const d = rng.range(0, 0.35);
    crate.position.set(Math.cos(a) * d, s * 0.35, Math.sin(a) * d);
    crate.rotation.y = rng.angle();
    crate.castShadow = true;
    g.add(crate);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(s + 0.015, s * 0.08, s + 0.015), pal.metal);
    lid.position.copy(crate.position).y += s * 0.3;
    lid.rotation.copy(crate.rotation);
    g.add(lid);
  }
  return g;
}

/**
 * Hanging industrial lamp: cord, shade, glowing bulb. Origin at the ceiling
 * mount; hangs into -Y. Pass `drop` for cord length.
 */
export function lightFixture(
  rng: Rng,
  pal: Palette,
  opts: { drop?: number; color?: number } = {},
): THREE.Group {
  const drop = opts.drop ?? 1;
  const g = new THREE.Group();
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, drop, 6), pal.trim);
  cord.position.y = -drop / 2;
  g.add(cord);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.18, 14, 1, true), pal.metal);
  shade.position.y = -drop - 0.09;
  g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), pal.glow(opts.color ?? 0xffd9a0));
  bulb.position.y = -drop - 0.16;
  g.add(bulb);
  // Many old fixtures hang slightly off true.
  g.rotation.z = rng.jitter(0.06);
  return g;
}
