import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Furniture — the human layer that makes a facility read as *lived in*.
 * Palette-driven, deterministic, origin on the floor. Fronts face +Z.
 */

/** A work desk with a drawer pedestal and slightly shoved-back stance. */
export function workDesk(rng: Rng, pal: Palette, opts: { width?: number } = {}): THREE.Group {
  const width = opts.width ?? 1.5;
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, 0.7), pal.body);
  top.position.y = 0.76;
  top.castShadow = true;
  g.add(top);
  // Drawer pedestal one side, legs the other.
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.68, 0.62), pal.trim);
  pedestal.position.set(width / 2 - 0.26, 0.34, 0);
  g.add(pedestal);
  for (let d = 0; d < 3; d++) {
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.02), pal.metal);
    handle.position.set(width / 2 - 0.26, 0.15 + d * 0.21, 0.32);
    g.add(handle);
  }
  for (const z of [-0.3, 0.3]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.74, 0.05), pal.metal);
    leg.position.set(-width / 2 + 0.06, 0.37, z);
    g.add(leg);
  }
  // One drawer left open, sometimes.
  if (rng.chance(0.4)) {
    const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.3), pal.trim);
    drawer.position.set(width / 2 - 0.26, 0.57, 0.45);
    g.add(drawer);
  }
  return g;
}

/** A five-footed swivel chair, seat spun to a random heading. */
export function swivelChair(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.36, 8), pal.metal);
  post.position.y = 0.28;
  g.add(post);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.05), pal.metal);
    foot.position.set(Math.cos(a) * 0.16, 0.06, Math.sin(a) * 0.16);
    foot.rotation.y = -a;
    g.add(foot);
  }
  const seatGroup = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.07, 0.42), pal.soft);
  seat.position.y = 0.48;
  seat.castShadow = true;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.06), pal.soft);
  back.position.set(0, 0.78, -0.21);
  back.rotation.x = 0.12;
  seatGroup.add(seat, back);
  seatGroup.rotation.y = rng.angle();
  g.add(seatGroup);
  return g;
}

/** Open shelving unit; upper shelves sparsely stocked with box shapes. */
export function shelvingUnit(
  rng: Rng,
  pal: Palette,
  opts: { tiers?: number; width?: number } = {},
): THREE.Group {
  const tiers = opts.tiers ?? 4;
  const width = opts.width ?? 1.2;
  const g = new THREE.Group();
  const height = tiers * 0.45 + 0.1;
  for (const x of [-width / 2, width / 2]) {
    for (const z of [-0.25, 0.25]) {
      const upright = new THREE.Mesh(new THREE.BoxGeometry(0.05, height, 0.05), pal.metal);
      upright.position.set(x, height / 2, z);
      g.add(upright);
    }
  }
  for (let t = 0; t <= tiers; t++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, 0.56), pal.body);
    shelf.position.y = 0.08 + t * 0.45;
    shelf.castShadow = true;
    g.add(shelf);
    if (t === tiers) continue;
    // Sparse stock.
    let cursor = -width / 2 + 0.1;
    while (cursor < width / 2 - 0.15 && rng.chance(0.75)) {
      const bw = rng.range(0.12, 0.3);
      const bh = rng.range(0.12, 0.3);
      const box = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, rng.range(0.2, 0.4)), pal.trim);
      box.position.set(cursor + bw / 2, 0.1 + t * 0.45 + bh / 2, rng.jitter(0.06));
      box.rotation.y = rng.jitter(0.15);
      g.add(box);
      cursor += bw + rng.range(0.04, 0.25);
    }
  }
  return g;
}

/** A bank of tall lockers; one door usually hangs open. */
export function lockerBank(rng: Rng, pal: Palette, opts: { units?: number } = {}): THREE.Group {
  const units = opts.units ?? 4;
  const g = new THREE.Group();
  const uw = 0.42;
  const openIndex = rng.chance(0.7) ? rng.int(units) : -1;
  for (let i = 0; i < units; i++) {
    const x = (i - (units - 1) / 2) * uw;
    const shell = new THREE.Mesh(new THREE.BoxGeometry(uw - 0.02, 1.9, 0.5), pal.body);
    shell.position.set(x, 0.95, 0);
    shell.castShadow = true;
    g.add(shell);
    const door = new THREE.Mesh(new THREE.BoxGeometry(uw - 0.08, 1.78, 0.03), pal.trim);
    if (i === openIndex) {
      // Hinge on the left edge, swung out.
      door.position.set(x - (uw - 0.08) / 2, 0.95, 0.26 + (uw - 0.08) / 2);
      door.rotation.y = -Math.PI / 2 + rng.range(0.2, 0.6);
    } else {
      door.position.set(x, 0.95, 0.26);
    }
    g.add(door);
    // Vent slits.
    for (let v = 0; v < 3 && i !== openIndex; v++) {
      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.015, 0.01), pal.metal);
      slit.position.set(x, 1.55 + v * 0.06, 0.285);
      g.add(slit);
    }
  }
  return g;
}

/** Simple four-legged stool. */
export function stool(pal: Palette, opts: { height?: number } = {}): THREE.Group {
  const height = opts.height ?? 0.55;
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12), pal.soft);
  seat.position.y = height;
  seat.castShadow = true;
  g.add(seat);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, height, 6), pal.metal);
    leg.position.set(Math.cos(a) * 0.13, height / 2, Math.sin(a) * 0.13);
    leg.rotation.z = Math.cos(a) * 0.1;
    leg.rotation.x = -Math.sin(a) * 0.1;
    g.add(leg);
  }
  return g;
}

/** A two-tier bunk with frame posts and sagging mattresses. */
export function bunkBed(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const L = 1.9;
  const W = 0.85;
  for (const x of [-L / 2, L / 2]) {
    for (const z of [-W / 2, W / 2]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 0.06), pal.metal);
      post.position.set(x, 0.8, z);
      g.add(post);
    }
  }
  for (const y of [0.4, 1.15]) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(L, 0.06, W), pal.metal);
    frame.position.y = y;
    g.add(frame);
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(L - 0.1, 0.1, W - 0.08), pal.soft);
    mattress.position.y = y + 0.08;
    mattress.rotation.z = rng.jitter(0.015);
    mattress.castShadow = true;
    g.add(mattress);
  }
  // Ladder at one end.
  for (const y of [0.55, 0.8, 1.05]) {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, W - 0.2, 6), pal.metal);
    rung.rotation.x = Math.PI / 2;
    rung.position.set(L / 2 + 0.05, y, 0);
    g.add(rung);
  }
  return g;
}

/** Low storage cabinet with double doors and handles. */
export function cabinet(rng: Rng, pal: Palette, opts: { width?: number } = {}): THREE.Group {
  const width = opts.width ?? 1;
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, 0.9, 0.5), pal.body);
  body.position.y = 0.47;
  body.castShadow = true;
  g.add(body);
  for (const side of [-1, 1]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(width / 2 - 0.04, 0.8, 0.03), pal.trim);
    door.position.set((side * width) / 4, 0.47, 0.26);
    door.rotation.y = side < 0 && rng.chance(0.3) ? -0.5 : 0; // left door ajar sometimes
    g.add(door);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.02), pal.metal);
    handle.position.set(side * 0.06, 0.5, 0.29);
    g.add(handle);
  }
  return g;
}

/** A pin board with scattered, slightly crooked notes. Facing +Z. */
export function noticeBoard(
  rng: Rng,
  pal: Palette,
  opts: { width?: number; height?: number } = {},
): THREE.Group {
  const width = opts.width ?? 1.2;
  const height = opts.height ?? 0.8;
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.04), pal.trim);
  board.position.y = 1.5;
  g.add(board);
  const cork = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.08, height - 0.08), pal.soft);
  cork.position.set(0, 1.5, 0.025);
  g.add(cork);
  const notes = 4 + rng.int(6);
  for (let i = 0; i < notes; i++) {
    const note = new THREE.Mesh(
      new THREE.PlaneGeometry(rng.range(0.08, 0.16), rng.range(0.1, 0.18)),
      pal.body,
    );
    note.position.set(
      rng.jitter((width - 0.25) / 2),
      1.5 + rng.jitter((height - 0.25) / 2),
      0.035,
    );
    note.rotation.z = rng.jitter(0.25);
    g.add(note);
  }
  return g;
}

/** Freestanding three-fold partition screen. */
export function partitionScreen(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const fold = rng.range(0.3, 0.6);
  for (let i = 0; i < 3; i++) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.7, 0.04), pal.body);
    const angle = (i - 1) * fold;
    panel.position.set((i - 1) * 0.66 * Math.cos(fold), 0.85, Math.abs(i - 1) * -0.18);
    panel.rotation.y = angle;
    panel.castShadow = true;
    g.add(panel);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.36), pal.metal);
    foot.position.set(panel.position.x, 0.02, panel.position.z);
    foot.rotation.y = angle;
    g.add(foot);
  }
  return g;
}
