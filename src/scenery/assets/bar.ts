import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Bar / speakeasy — hospitality set (pairs with the 'speakeasy' palette).
 * Origins on the floor; dartBoard is a wall prop, glassRack hangs into -Y.
 */

/** L-less straight bar counter with foot rail and bar mat. */
export function barCounter(rng: Rng, pal: Palette, opts: { length?: number } = {}): THREE.Group {
  const length = opts.length ?? 2.4;
  const g = new THREE.Group();
  const front = new THREE.Mesh(new THREE.BoxGeometry(length, 1.05, 0.12), pal.body);
  front.position.set(0, 0.525, 0.24);
  front.castShadow = true;
  g.add(front);
  const top = new THREE.Mesh(new THREE.BoxGeometry(length + 0.16, 0.06, 0.7), pal.trim);
  top.position.y = 1.08;
  top.castShadow = true;
  g.add(top);
  // Brass foot rail.
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, length - 0.2, 8), pal.metal);
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, 0.18, 0.38);
  g.add(rail);
  for (const x of [-length / 3, length / 3]) {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.12), pal.metal);
    bracket.position.set(x, 0.16, 0.33);
    g.add(bracket);
  }
  // A couple of abandoned glasses on the top.
  for (let i = 0, n = 1 + rng.int(3); i < n; i++) {
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.028, 0.11, 8), pal.glass);
    glass.position.set(rng.jitter(length / 2 - 0.2), 1.165, rng.jitter(0.2));
    g.add(glass);
  }
  return g;
}

/** Back-bar: mirrored shelf wall stacked with lit bottles. */
export function backBar(rng: Rng, pal: Palette, opts: { width?: number } = {}): THREE.Group {
  const width = opts.width ?? 1.8;
  const g = new THREE.Group();
  const panel = new THREE.Mesh(new THREE.BoxGeometry(width, 2.1, 0.08), pal.body);
  panel.position.set(0, 1.05, -0.04);
  panel.castShadow = true;
  g.add(panel);
  const mirror = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.3, 1.1),
    new THREE.MeshStandardMaterial({ color: 0xd6e4ec, metalness: 1, roughness: 0.08 }),
  );
  mirror.userData.disposeMaterial = true;
  mirror.position.set(0, 1.35, 0.001);
  g.add(mirror);
  const colors = [0xffb347, 0x9fd8ff, 0x2bff88, 0xff5a2b, 0xe344c4];
  for (const shelfY of [0.9, 1.35, 1.8]) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, 0.035, 0.24), pal.trim);
    shelf.position.set(0, shelfY, 0.1);
    g.add(shelf);
    // Under-shelf glow strip lights the bottles from below.
    const strip = new THREE.Mesh(new THREE.BoxGeometry(width - 0.24, 0.012, 0.02), pal.glow(0xffe2b0));
    strip.position.set(0, shelfY + 0.02, 0.2);
    g.add(strip);
    let x = -width / 2 + 0.2;
    while (x < width / 2 - 0.24) {
      const r = rng.range(0.03, 0.05);
      const h = rng.range(0.18, 0.32);
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, h, 8),
        rng.chance(0.4) ? pal.glow(rng.pick(colors)) : pal.glass,
      );
      bottle.position.set(x + r, shelfY + 0.02 + h / 2, 0.1);
      g.add(bottle);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.35, r * 0.5, 0.07, 6), pal.glass);
      neck.position.set(x + r, shelfY + 0.02 + h + 0.035, 0.1);
      g.add(neck);
      x += r * 2 + rng.range(0.02, 0.07);
    }
  }
  return g;
}

/** Bank of beer taps on a counter stub. `handles` tilt about x to pour. */
export function beerTaps(
  rng: Rng,
  pal: Palette,
  opts: { taps?: number } = {},
): { group: THREE.Group; handles: THREE.Group[] } {
  const taps = opts.taps ?? 3;
  const group = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(taps * 0.2 + 0.15, 1.05, 0.35), pal.body);
  plinth.position.y = 0.525;
  group.add(plinth);
  const manifold = new THREE.Mesh(new THREE.BoxGeometry(taps * 0.2 + 0.05, 0.12, 0.14), pal.metal);
  manifold.position.set(0, 1.16, 0);
  group.add(manifold);
  const handles: THREE.Group[] = [];
  for (let i = 0; i < taps; i++) {
    const x = (i - (taps - 1) / 2) * 0.2;
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.014, 0.12, 8), pal.metal);
    spout.position.set(x, 1.1, 0.12);
    spout.rotation.x = 0.7;
    group.add(spout);
    const handle = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.22, 8).translate(0, 0.11, 0), pal.trim);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), pal.glow(rng.pick([0xffb347, 0x2bff88, 0xff5a2b])));
    knob.position.y = 0.24;
    handle.add(stick, knob);
    handle.position.set(x, 1.2, 0);
    handle.rotation.x = rng.chance(0.3) ? 0.5 : -0.1; // one mid-pour
    group.add(handle);
    handles.push(handle);
  }
  return { group, handles };
}

/** Pool table with racked triangle of balls and a leaning cue. */
export function poolTable(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2, 0.18, 1.1), pal.body);
  bed.position.y = 0.72;
  bed.castShadow = true;
  g.add(bed);
  const felt = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x1d5c3a, roughness: 1 }),
  );
  felt.userData.disposeMaterial = true;
  felt.rotation.x = -Math.PI / 2;
  felt.position.y = 0.815;
  g.add(felt);
  for (const [x, z] of [
    [-0.9, -0.45],
    [-0.9, 0.45],
    [0.9, -0.45],
    [0.9, 0.45],
  ]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.66, 0.14), pal.trim);
    leg.position.set(x, 0.33, z);
    g.add(leg);
  }
  // Racked triangle + cue ball.
  const ballColors = [0xffd23f, 0xff2b3a, 0x1f6dd1, 0x2b8a3a, 0x772bd1, 0xff7733];
  let ball = 0;
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i <= row; i++) {
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 8, 6),
        new THREE.MeshStandardMaterial({ color: ballColors[ball % ballColors.length], roughness: 0.25 }),
      );
      bead.userData.disposeMaterial = true;
      bead.position.set(0.35 + row * 0.05, 0.845, (i - row / 2) * 0.06);
      g.add(bead);
      ball++;
    }
  }
  const cueBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xf4f0e6, roughness: 0.25 }),
  );
  cueBall.userData.disposeMaterial = true;
  cueBall.position.set(-0.5 + rng.jitter(0.15), 0.845, rng.jitter(0.2));
  g.add(cueBall);
  // Cue leaning against the rail.
  const cue = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.016, 1.45, 6), pal.trim);
  cue.position.set(-1.05, 0.72, 0.3);
  cue.rotation.z = 0.35;
  cue.rotation.x = rng.jitter(0.1);
  g.add(cue);
  return g;
}

/** Wall dartboard with ring segments and three seeded darts — scoreable clue. */
export function dartBoard(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.translate(64, 64);
    // 20 alternating wedges + rings — legible as a dartboard at a glance.
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = i % 2 ? '#1a1614' : '#e8e0cc';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 60, (i / 20) * Math.PI * 2, ((i + 1) / 20) * Math.PI * 2);
      ctx.fill();
    }
    for (const [r, color] of [
      [38, '#2b8a3a'],
      [37, 'rgba(0,0,0,0)'],
      [60, '#c22b2b'],
    ] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#c22b2b';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  const board = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.05, 24),
    new THREE.MeshStandardMaterial({ color: 0x1a1614, roughness: 0.9 }),
  );
  board.userData.disposeMaterial = true;
  board.rotation.x = Math.PI / 2;
  board.position.set(0, 1.6, 0.03);
  g.add(board);
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(0.29, 24),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), roughness: 0.9 }),
  );
  face.userData.disposeMaterial = true;
  face.position.set(0, 1.6, 0.057);
  g.add(face);
  // Three darts stuck at seeded angles — read them as a 3-digit code.
  for (let i = 0; i < 3; i++) {
    const a = rng.angle();
    const r = rng.range(0.06, 0.26);
    const dart = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.002, 0.1, 6), pal.metal);
    body.rotation.x = Math.PI / 2 - 0.3;
    const flight = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.04, 4), pal.glow());
    flight.rotation.x = -0.3;
    flight.position.set(0, 0.015, 0.05);
    dart.add(body, flight);
    dart.position.set(Math.cos(a) * r, 1.6 + Math.sin(a) * r, 0.075);
    g.add(dart);
  }
  return g;
}

/** Glowing jukebox with an arched crown. Returns its lamp materials. */
export function jukebox(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; lampMaterials: THREE.MeshStandardMaterial[] } {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.5), pal.body);
  body.position.y = 0.6;
  body.castShadow = true;
  group.add(body);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16, 1, false, 0, Math.PI), pal.trim);
  crown.rotation.z = Math.PI / 2;
  crown.rotation.y = Math.PI / 2;
  crown.position.set(0, 1.2, 0);
  group.add(crown);
  const lampMaterials: THREE.MeshStandardMaterial[] = [];
  // Arched tube lights following the crown + side pillars.
  const archTube = pal.glow(0xffb347).clone();
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.02, 8, 16, Math.PI), archTube);
  arch.position.set(0, 1.2, 0.255);
  arch.userData.disposeMaterial = true;
  group.add(arch);
  lampMaterials.push(archTube);
  for (const side of [-1, 1]) {
    const pillarMat = pal.glow(rng.pick([0xff5a2b, 0xe344c4, 0x2bff88])).clone();
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.0, 0.03), pillarMat);
    pillar.position.set(side * 0.34, 0.65, 0.255);
    pillar.userData.disposeMaterial = true;
    group.add(pillar);
    lampMaterials.push(pillarMat);
  }
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), pal.glow(0xffe2b0));
  screen.position.set(0, 1.05, 0.255);
  group.add(screen);
  const grill = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.4), pal.soft);
  grill.position.set(0, 0.45, 0.253);
  group.add(grill);
  return { group, lampMaterials };
}

/** High-backed booth seat with a table stub. */
export function boothSeat(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 0.14), pal.soft);
  back.position.set(0, 0.55, -0.4);
  back.castShadow = true;
  g.add(back);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 0.55), pal.soft);
  seat.position.set(0, 0.42, -0.1);
  g.add(seat);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 0.5), pal.body);
  plinth.position.set(0, 0.175, -0.12);
  g.add(plinth);
  // Button tufting studs on the back.
  for (let c = 0; c < 5; c++) {
    for (let r = 0; r < 2; r++) {
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 5), pal.metal);
      stud.position.set(-0.56 + c * 0.28, 0.42 + r * 0.36, -0.325);
      g.add(stud);
    }
  }
  const table = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 14), pal.trim);
  table.position.set(0, 0.72, 0.42);
  g.add(table);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.12, 0.7, 10), pal.metal);
  stem.position.set(0, 0.35, 0.42);
  stem.rotation.y = rng.angle();
  g.add(stem);
  return g;
}

/** CEILING: overhead stemware rack with hanging glasses. */
export function glassRack(rng: Rng, pal: Palette, opts: { length?: number } = {}): THREE.Group {
  const length = opts.length ?? 1.4;
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(length, 0.05, 0.5), pal.trim);
  frame.position.y = -0.15;
  g.add(frame);
  for (const z of [-0.15, 0.15]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length - 0.1, 0.02, 0.04), pal.metal);
    rail.position.set(0, -0.19, z);
    g.add(rail);
    let x = -length / 2 + 0.12;
    while (x < length / 2 - 0.1) {
      if (rng.chance(0.8)) {
        const bowl = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 8, 1, true), pal.glass);
        bowl.rotation.x = Math.PI;
        bowl.position.set(x, -0.3, z);
        g.add(bowl);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.08, 5), pal.glass);
        stem.position.set(x, -0.235, z);
        g.add(stem);
      }
      x += 0.13;
    }
  }
  return g;
}

/** Stack of kegs, one on its side with a spigot. */
export function kegStack(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const keg = (x: number, y: number, z: number, upright: boolean): void => {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.55, 14), pal.metal);
    if (!upright) drum.rotation.x = Math.PI / 2;
    drum.position.set(x, y, z);
    drum.castShadow = true;
    g.add(drum);
    for (const t of [-0.2, 0.2]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.014, 6, 16), pal.trim);
      if (upright) {
        band.rotation.x = Math.PI / 2;
        band.position.set(x, y + t, z);
      } else {
        band.position.set(x, y, z + t);
      }
      g.add(band);
    }
  };
  keg(-0.3, 0.275, 0, true);
  keg(0.25, 0.275, 0.1, true);
  keg(-0.05, 0.24, 0.62, false);
  const spigot = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 6), pal.trim);
  spigot.rotation.x = Math.PI / 2;
  spigot.position.set(-0.05, 0.24 + rng.jitter(0.02), 0.93);
  g.add(spigot);
  return g;
}
