import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Puzzle objects & mechanisms — free-standing puzzle furniture. Every builder
 * returns named handles with their axis/range documented, so game code can
 * animate locks, lids, and dials without digging through the scene graph.
 * Origins on the floor.
 */

/** Banded chest. `lid` rotates about x at its back edge (0 closed, ~-1.8 open); `hasp` flips up about x. */
export function lockedChest(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; lid: THREE.Group; hasp: THREE.Mesh } {
  const group = new THREE.Group();
  const w = 0.9;
  const d = 0.55;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, 0.45, d), pal.body);
  body.position.y = 0.225;
  body.castShadow = true;
  group.add(body);
  for (const x of [-w / 3, w / 3]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.47, d + 0.02), pal.trim);
    band.position.set(x, 0.225, 0);
    group.add(band);
  }
  const lid = new THREE.Group();
  const lidSlab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d).translate(0, 0.05, d / 2), pal.body);
  lidSlab.castShadow = true;
  lid.add(lidSlab);
  for (const x of [-w / 3, w / 3]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, d + 0.02).translate(0, 0.05, d / 2), pal.trim);
    band.position.x = x;
    lid.add(band);
  }
  lid.position.set(0, 0.45, -d / 2); // hinge line at the back edge
  lid.rotation.x = rng.chance(0.3) ? -0.35 : 0; // sometimes found ajar
  group.add(lid);
  const haspGeo = new THREE.BoxGeometry(0.08, 0.14, 0.02).translate(0, -0.07, 0);
  const hasp = new THREE.Mesh(haspGeo, pal.metal);
  hasp.position.set(0, 0.47, d / 2 + 0.012);
  group.add(hasp);
  return { group, lid, hasp };
}

/** Squat floor safe. `door` swings about y at its hinge edge; `dial` spins about z. */
export function safeBox(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; door: THREE.Group; dial: THREE.Group } {
  const group = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.65), pal.body);
  shell.position.y = 0.425;
  shell.castShadow = true;
  group.add(shell);
  const door = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.72, 0.05).translate(0.29, 0, 0.025), pal.trim);
  door.add(slab);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.03), pal.metal);
  handle.position.set(0.46, -0.1, 0.06);
  door.add(handle);
  const dial = new THREE.Group();
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 20), pal.metal);
  wheel.rotation.x = Math.PI / 2;
  dial.add(wheel);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.025, 0.01), pal.body);
    tick.position.set(Math.sin(a) * 0.08, Math.cos(a) * 0.08, 0.025);
    tick.rotation.z = -a;
    dial.add(tick);
  }
  dial.position.set(0.29, 0.08, 0.055);
  dial.rotation.z = rng.angle();
  door.add(dial);
  door.position.set(-0.29, 0.425, 0.33); // hinge on the safe's left front edge
  group.add(door);
  return { group, door, dial };
}

/**
 * Tall balance scale. Rotate `beam` about z and the pans follow (they're
 * parented to the beam's ends); each pan counter-rotates to hang plumb if the
 * game sets `pan.rotation.z = -beam.rotation.z`.
 */
export function balanceScale(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; beam: THREE.Group; panLeft: THREE.Group; panRight: THREE.Group } {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.08, 14), pal.trim);
  base.position.y = 0.04;
  group.add(base);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.15, 10), pal.metal);
  column.position.y = 0.65;
  column.castShadow = true;
  group.add(column);
  const beam = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.045, 0.045), pal.metal);
  beam.add(bar);
  const makePan = (side: number): THREE.Group => {
    const pan = new THREE.Group();
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.05, 14), pal.body);
    dish.position.y = -0.42;
    pan.add(dish);
    for (const a of [0.5, 2.6, 4.2]) {
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.4, 4), pal.trim);
      chain.position.set(Math.cos(a) * 0.1, -0.21, Math.sin(a) * 0.1);
      chain.rotation.z = Math.cos(a) * 0.24;
      chain.rotation.x = -Math.sin(a) * 0.24;
      pan.add(chain);
    }
    pan.position.x = side * 0.55;
    beam.add(pan);
    return pan;
  };
  const panLeft = makePan(-1);
  const panRight = makePan(1);
  beam.position.y = 1.25;
  beam.rotation.z = rng.jitter(0.12); // found out of balance
  panLeft.rotation.z = -beam.rotation.z;
  panRight.rotation.z = -beam.rotation.z;
  group.add(beam);
  return { group, beam, panLeft, panRight };
}

/** Loose glyph tiles laid out on the floor; each glyph is distinct (arrangement puzzles). */
export function symbolTiles(
  rng: Rng,
  pal: Palette,
  opts: { count?: number } = {},
): { group: THREE.Group; tiles: THREE.Group[] } {
  const count = Math.min(opts.count ?? 6, 7);
  const group = new THREE.Group();
  const tiles: THREE.Group[] = [];
  // Distinct glyph recipes: [bars, ring?, diagonal?] combinations.
  const recipes: Array<{ bars: number; ring: boolean; diag: boolean }> = [
    { bars: 1, ring: false, diag: false },
    { bars: 0, ring: true, diag: false },
    { bars: 2, ring: false, diag: false },
    { bars: 1, ring: true, diag: false },
    { bars: 0, ring: false, diag: true },
    { bars: 2, ring: true, diag: false },
    { bars: 1, ring: false, diag: true },
  ];
  for (let i = 0; i < count; i++) {
    const tile = new THREE.Group();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.28), pal.body);
    slab.position.y = 0.02;
    tile.add(slab);
    const recipe = recipes[i];
    for (let b = 0; b < recipe.bars; b++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.035), pal.trim);
      bar.position.set(0, 0.05, -0.05 + b * 0.1);
      tile.add(bar);
    }
    if (recipe.ring) {
      const ringMark = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 14), pal.trim);
      ringMark.rotation.x = Math.PI / 2;
      ringMark.position.y = 0.05;
      tile.add(ringMark);
    }
    if (recipe.diag) {
      const diag = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.035), pal.trim);
      diag.position.y = 0.05;
      diag.rotation.y = Math.PI / 4;
      tile.add(diag);
    }
    tile.position.set((i - (count - 1) / 2) * 0.36 + rng.jitter(0.03), 0, rng.jitter(0.1));
    tile.rotation.y = rng.jitter(0.3);
    group.add(tile);
    tiles.push(tile);
  }
  return { group, tiles };
}

/**
 * Heavy mirror on a wheeled track yoke — kin to the game's core.mirrors.
 * `yoke` rotates about y (aiming); `mirror` tilts about x (elevation).
 */
export function pivotMirror(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; yoke: THREE.Group; mirror: THREE.Group } {
  const group = new THREE.Group();
  const truck = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.5), pal.trim);
  truck.position.y = 0.12;
  group.add(truck);
  for (const [wx, wz] of [
    [-0.28, -0.2],
    [-0.28, 0.2],
    [0.28, -0.2],
    [0.28, 0.2],
  ]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12), pal.metal);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.07, wz);
    group.add(wheel);
  }
  const yoke = new THREE.Group();
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), pal.metal);
    arm.position.set(side * 0.42, 0.45, 0);
    yoke.add(arm);
  }
  const mirror = new THREE.Group();
  const backing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.95, 0.05), pal.body);
  mirror.add(backing);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.87),
    new THREE.MeshStandardMaterial({ color: 0xd6e4ec, metalness: 1, roughness: 0.04 }),
  );
  face.userData.disposeMaterial = true;
  face.position.z = 0.028;
  mirror.add(face);
  mirror.position.y = 0.85; // pivot at the yoke's bearing height
  mirror.rotation.x = rng.jitter(0.25);
  yoke.add(mirror);
  yoke.position.y = 0.18;
  yoke.rotation.y = rng.angle();
  group.add(yoke);
  return { group, yoke, mirror };
}

/** Five graded ring-handled weights on a tray, ascending size. */
export function weightSet(rng: Rng, pal: Palette): { group: THREE.Group; weights: THREE.Group[] } {
  const group = new THREE.Group();
  const tray = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.4), pal.trim);
  tray.position.y = 0.02;
  group.add(tray);
  const weights: THREE.Group[] = [];
  for (let i = 0; i < 5; i++) {
    const r = 0.05 + i * 0.02;
    const h = 0.1 + i * 0.045;
    const weight = new THREE.Group();
    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.15, h, 12), pal.metal);
    bodyMesh.position.y = h / 2;
    bodyMesh.castShadow = true;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(r * 0.55, 0.012, 6, 12), pal.trim);
    handle.position.y = h + r * 0.35;
    weight.add(bodyMesh, handle);
    weight.position.set(-0.45 + i * 0.22, 0.04, rng.jitter(0.04));
    group.add(weight);
    weights.push(weight);
  }
  return { group, weights };
}

/** Waist-high pillar with three rotatable glyph bands. `bands` rotate about y. */
export function glyphPillar(rng: Rng, pal: Palette): { group: THREE.Group; bands: THREE.Group[] } {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.1, 12), pal.body);
  core.position.y = 0.55;
  core.castShadow = true;
  group.add(core);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.08, 12), pal.trim);
  cap.position.y = 1.14;
  group.add(cap);
  const bands: THREE.Group[] = [];
  [0.42, 0.65, 0.88].forEach((y, bandIndex) => {
    const band = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 12), pal.metal);
    band.add(ring);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const glyph = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.07, 0.03),
        i === bandIndex ? pal.glow() : pal.trim, // one lit glyph per band = current selection
      );
      glyph.position.set(Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2);
      glyph.rotation.y = -a + Math.PI / 2;
      band.add(glyph);
    }
    band.position.y = y;
    band.rotation.y = rng.angle();
    group.add(band);
    bands.push(band);
  });
  return { group, bands };
}

/** Frame of five hanging tube chimes, descending length (audio-sequence puzzles). */
export function chimeRack(rng: Rng, pal: Palette): { group: THREE.Group; chimes: THREE.Mesh[] } {
  const group = new THREE.Group();
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.7, 8), pal.body);
    post.position.set(side * 0.55, 0.85, 0);
    group.add(post);
  }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 8), pal.trim);
  beam.rotation.z = Math.PI / 2;
  beam.position.y = 1.66;
  group.add(beam);
  const chimes: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const len = 0.75 - i * 0.11;
    const x = -0.4 + i * 0.2;
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 4), pal.trim);
    cord.position.set(x, 1.6, 0);
    group.add(cord);
    const chime = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, len, 10), pal.metal);
    chime.position.set(x, 1.54 - len / 2, 0);
    chime.rotation.z = rng.jitter(0.02);
    group.add(chime);
    chimes.push(chime);
  }
  return { group, chimes };
}

/** Five rune plates set in an arc; light them in sequence via `runeMaterials`. */
export function runeFloor(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; runeMaterials: THREE.MeshStandardMaterial[] } {
  const group = new THREE.Group();
  const runeMaterials: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * 0.75 + (i / 4) * Math.PI * 1.5;
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.05, 8), pal.trim);
    plate.position.set(Math.cos(a) * 0.75, 0.025, Math.sin(a) * 0.75);
    plate.rotation.y = rng.angle();
    group.add(plate);
    const mat = pal.glow().clone();
    mat.emissiveIntensity = 0.3; // dormant; sequence logic flares each rune
    const rune = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.03), mat);
    rune.position.set(plate.position.x, 0.06, plate.position.z);
    rune.rotation.y = rng.angle();
    rune.userData.disposeMaterial = true;
    group.add(rune);
    runeMaterials.push(mat);
  }
  return { group, runeMaterials };
}

/** A tray of chunky pickup relics — key, keycard, gear — for hide-and-find loops. */
export function keyRelics(rng: Rng, pal: Palette): { group: THREE.Group; items: THREE.Group[] } {
  const group = new THREE.Group();
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.3), pal.body);
  tray.position.y = 0.015;
  group.add(tray);
  const items: THREE.Group[] = [];
  // Key: shaft + bow ring + two teeth.
  const key = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8), pal.metal);
  shaft.rotation.z = Math.PI / 2;
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.01, 6, 12), pal.metal);
  bow.position.x = -0.09;
  key.add(shaft, bow);
  for (const t of [0.05, 0.08]) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.03, 0.012), pal.metal);
    tooth.position.set(t, -0.02, 0);
    key.add(tooth);
  }
  // Keycard: slab + glow stripe.
  const card = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.008, 0.09), pal.trim);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.002, 0.02), pal.glow());
  stripe.position.set(0, 0.005, 0.025);
  card.add(slab, stripe);
  // Gear: disc + teeth + hub hole suggested by a darker inset.
  const gear = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16), pal.metal);
  gear.add(disc);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.02, 0.02), pal.metal);
    tooth.position.set(Math.cos(a) * 0.065, 0, Math.sin(a) * 0.065);
    tooth.rotation.y = -a;
    gear.add(tooth);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.022, 10), pal.trim);
  gear.add(hub);
  [key, card, gear].forEach((item, i) => {
    item.position.set(-0.22 + i * 0.22, 0.05, rng.jitter(0.05));
    item.rotation.y = rng.angle();
    group.add(item);
    items.push(item);
  });
  return { group, items };
}
