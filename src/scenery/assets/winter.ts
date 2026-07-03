import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Snow & ice — winter exterior set (pairs with the 'arctic' palette; its
 * `soft` role reads as snow). Origins on the floor; icicleRow hangs into -Y.
 */

/** Wind-sculpted snow drift — long, low, feathered at the edges. */
export function snowDrift(rng: Rng, pal: Palette, opts: { width?: number } = {}): THREE.Group {
  const width = opts.width ?? 2;
  const g = new THREE.Group();
  for (let i = 0, n = 4 + rng.int(3); i < n; i++) {
    const r = rng.range(0.3, 0.6) * (width / 2);
    const lump = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 7), pal.soft);
    lump.position.set(rng.jitter(width / 2), r * 0.25, rng.jitter(0.3));
    lump.scale.set(1.7, 0.4, 1.1);
    lump.receiveShadow = true;
    g.add(lump);
  }
  return g;
}

/** Three-ball snowman with coal buttons, twig arms, and a carrot nose. */
export function snowman(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const sizes = [0.42, 0.3, 0.2];
  let y = 0;
  sizes.forEach((r, i) => {
    y += r * (i === 0 ? 0.85 : 1.4);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), pal.soft);
    ball.position.set(rng.jitter(0.02), y, rng.jitter(0.02));
    ball.castShadow = true;
    g.add(ball);
    y += r * 0.35;
  });
  const headY = y - sizes[2] * 0.5;
  // Face + buttons.
  const coal = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.9 });
  for (const [cx, cy, cz] of [
    [-0.06, headY + 0.05, 0.17],
    [0.06, headY + 0.05, 0.17],
    [0, headY - 0.35, 0.27],
    [0, headY - 0.5, 0.29],
  ]) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), coal);
    dot.userData.disposeMaterial = cx === -0.06 && cz === 0.17; // one owner for the shared coal
    dot.position.set(cx, cy, cz);
    g.add(dot);
  }
  const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.16, 8), pal.glow(0xff7733));
  carrot.rotation.x = Math.PI / 2;
  carrot.position.set(0, headY, 0.26);
  g.add(carrot);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.55, 5), pal.trim);
    arm.position.set(side * 0.42, y - 0.55, 0);
    arm.rotation.z = side * (1.1 + rng.jitter(0.2));
    g.add(arm);
  }
  return g;
}

/** CEILING: row of icicles along local X, dripping into -Y. */
export function icicleRow(rng: Rng, pal: Palette, opts: { span?: number; count?: number } = {}): THREE.Group {
  const span = opts.span ?? 2.2;
  const count = opts.count ?? 11;
  const g = new THREE.Group();
  const ledge = new THREE.Mesh(new THREE.BoxGeometry(span + 0.2, 0.08, 0.24), pal.soft);
  ledge.position.y = -0.04;
  g.add(ledge);
  for (let i = 0; i < count; i++) {
    const len = rng.range(0.12, 0.55);
    const icicle = new THREE.Mesh(new THREE.ConeGeometry(len * 0.12, len, 6), pal.glass);
    icicle.rotation.x = Math.PI;
    icicle.position.set(-span / 2 + (i / (count - 1)) * span + rng.jitter(0.04), -0.08 - len / 2, rng.jitter(0.06));
    g.add(icicle);
  }
  return g;
}

/** Snow-capped conifer: stacked green cones with white rims. */
export function snowPine(rng: Rng, pal: Palette, opts: { height?: number } = {}): THREE.Group {
  const height = opts.height ?? 2.4;
  const g = new THREE.Group();
  const needle = new THREE.MeshStandardMaterial({ color: 0x1d4030, roughness: 1 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, height * 0.25, 8), pal.trim);
  trunk.position.y = height * 0.12;
  g.add(trunk);
  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const r = (0.65 - t * 0.4) * (height / 2.4);
    const tierY = height * (0.3 + t * 0.55);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, height * 0.32, 8), needle);
    cone.userData.disposeMaterial = i === 0; // shared needle material, one owner
    cone.position.set(rng.jitter(0.03), tierY, rng.jitter(0.03));
    cone.castShadow = true;
    g.add(cone);
    // Snow cap: a slightly smaller white cone sitting on each tier.
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.85, height * 0.1, 8), pal.soft);
    cap.position.set(cone.position.x, tierY + height * 0.12, cone.position.z);
    g.add(cap);
  }
  return g;
}

/** Frozen pond: irregular ice sheet with pressure-crack ridges. */
export function frozenPond(rng: Rng, pal: Palette, opts: { radius?: number } = {}): THREE.Group {
  const radius = opts.radius ?? 1.1;
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  const points = 14;
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = radius * rng.range(0.7, 1);
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  const ice = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 4),
    new THREE.MeshStandardMaterial({ color: 0x9fd4e8, roughness: 0.05, metalness: 0.2 }),
  );
  ice.userData.disposeMaterial = true;
  ice.rotation.x = -Math.PI / 2;
  ice.position.y = 0.01;
  g.add(ice);
  // Cracks: thin white ridges radiating off-centre.
  for (let i = 0, n = 3 + rng.int(3); i < n; i++) {
    const a = rng.angle();
    const crack = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.006, radius * rng.range(0.5, 0.95)), pal.soft);
    crack.position.set(Math.cos(a) * radius * 0.25, 0.015, Math.sin(a) * radius * 0.25);
    crack.rotation.y = rng.angle();
    g.add(crack);
  }
  // Snow rim bank around one side.
  const bank = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.5, 10, 6), pal.soft);
  bank.position.set(radius * 0.75, 0.05, rng.jitter(radius * 0.4));
  bank.scale.set(1.4, 0.25, 0.8);
  g.add(bank);
  return g;
}

/** Snow-dusted stacked firewood pile. */
export function logPile(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.95 });
  let owner = true;
  for (let row = 0; row < 3; row++) {
    const n = 5 - row;
    for (let i = 0; i < n; i++) {
      const r = rng.range(0.07, 0.09);
      const log = new THREE.Mesh(new THREE.CylinderGeometry(r, r, rng.range(0.6, 0.75), 9), wood);
      log.userData.disposeMaterial = owner; // shared wood material, single owner
      owner = false;
      log.rotation.x = Math.PI / 2;
      log.position.set((i - (n - 1) / 2) * 0.17 + rng.jitter(0.02), 0.08 + row * 0.15, rng.jitter(0.04));
      log.castShadow = true;
      g.add(log);
    }
  }
  const snowCap = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 6), pal.soft);
  snowCap.position.set(0, 0.48, 0);
  snowCap.scale.set(1.4, 0.3, 1);
  g.add(snowCap);
  return g;
}

/** Wooden runner sled with rope pull. */
export function sled(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  for (const side of [-0.22, 0.22]) {
    // Runner: flat rail with an upturned nose.
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.1), pal.trim);
    rail.position.set(side, 0.05, 0);
    g.add(rail);
    const nose = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.02, 6, 8, Math.PI / 2),
      pal.trim,
    );
    nose.rotation.y = Math.PI / 2;
    nose.position.set(side, 0.15, 0.55);
    g.add(nose);
    for (const z of [-0.35, 0.35]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.12, 0.035), pal.trim);
      strut.position.set(side, 0.13, z);
      g.add(strut);
    }
  }
  for (let i = 0; i < 5; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.025, 0.12), pal.body);
    slat.position.set(0, 0.2, -0.4 + i * 0.19);
    g.add(slat);
  }
  const rope = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.15, 0.2, 0.5),
        new THREE.Vector3(rng.jitter(0.2), 0.06, 0.85),
        new THREE.Vector3(0.15, 0.2, 0.5),
      ]),
      10,
      0.012,
      5,
    ),
    pal.soft,
  );
  g.add(rope);
  g.rotation.y = rng.jitter(0.2);
  return g;
}

/** Wall of translucent packed ice blocks, offset like brickwork. */
export function iceBlockWall(rng: Rng, pal: Palette, opts: { width?: number; height?: number } = {}): THREE.Group {
  const width = opts.width ?? 2;
  const height = opts.height ?? 1.4;
  const g = new THREE.Group();
  const rows = Math.round(height / 0.28);
  for (let r = 0; r < rows; r++) {
    let x = -width / 2 + (r % 2) * 0.2;
    while (x < width / 2 - 0.1) {
      const w = rng.range(0.3, 0.45);
      const block = new THREE.Mesh(new THREE.BoxGeometry(w, 0.26, 0.35), pal.glass);
      block.position.set(x + w / 2, 0.14 + r * 0.28, rng.jitter(0.015));
      block.rotation.y = rng.jitter(0.02);
      g.add(block);
      x += w + 0.025;
    }
  }
  return g;
}

/** Lamp post buried to the knees in snow, warm light against the white. */
export function snowyLampPost(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const drift = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 7), pal.soft);
  drift.position.y = 0.05;
  drift.scale.set(1.2, 0.35, 1.2);
  g.add(drift);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 2.2, 8), pal.metal);
  post.position.y = 1.1;
  post.castShadow = true;
  g.add(post);
  const cage = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), pal.trim);
  cage.position.y = 2.32;
  g.add(cage);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), pal.glow(0xffd9a0));
  lamp.position.y = 2.32;
  g.add(lamp);
  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.14, 8), pal.trim);
  finial.position.y = 2.54;
  g.add(finial);
  // Snow cap on the crown.
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), pal.soft);
  cap.position.set(rng.jitter(0.01), 2.6, rng.jitter(0.01));
  cap.scale.y = 0.5;
  g.add(cap);
  return g;
}

/** Partial igloo arch — curved block doorway. Spans local X. */
export function iglooArch(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const R = 0.85;
  const blocks = 9;
  for (let i = 0; i < blocks; i++) {
    const a = (i / (blocks - 1)) * Math.PI;
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.26, 0.4),
      rng.chance(0.8) ? pal.soft : pal.glass,
    );
    block.position.set(Math.cos(a) * R, 0.15 + Math.sin(a) * R, rng.jitter(0.02));
    block.rotation.z = a - Math.PI / 2;
    block.castShadow = true;
    g.add(block);
  }
  // Footing blocks either side.
  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.45), pal.soft);
    foot.position.set(side * R, 0.15, 0);
    g.add(foot);
  }
  return g;
}
