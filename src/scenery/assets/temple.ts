import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * South-Asian temple — carved stone, gold leaf, marigold and silk (pairs with
 * the 'temple' palette). Origins on the floor; bellChain hangs into -Y.
 */

/** Richly banded temple pillar with a lotus capital. */
export function carvedPillar(rng: Rng, pal: Palette, opts: { height?: number } = {}): THREE.Group {
  const height = opts.height ?? 2.6;
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.2, 0.56), pal.trim);
  base.position.y = 0.1;
  g.add(base);
  // Alternating square/octagonal drum sections — the classic carved profile.
  let y = 0.2;
  let section = 0;
  while (y < height - 0.4) {
    const h = rng.range(0.28, 0.45);
    const drum =
      section % 2 === 0
        ? new THREE.Mesh(new THREE.BoxGeometry(0.4, h, 0.4), pal.body)
        : new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, h, 8), pal.body);
    drum.position.y = y + h / 2;
    drum.castShadow = true;
    g.add(drum);
    const ring = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.46), pal.metal);
    ring.position.y = y + h;
    g.add(ring);
    y += h + 0.05;
    section++;
  }
  // Lotus capital: flared petals under the abacus.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.04), pal.metal);
    petal.position.set(Math.cos(a) * 0.2, height - 0.22, Math.sin(a) * 0.2);
    petal.rotation.y = -a;
    petal.rotation.x = 0.35;
    g.add(petal);
  }
  const abacus = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.6), pal.trim);
  abacus.position.y = height - 0.06;
  g.add(abacus);
  return g;
}

/** Tiered lotus fountain with a still pool. */
export function lotusFountain(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.85, 0.22, 18), pal.body);
  pool.position.y = 0.11;
  g.add(pool);
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 18),
    new THREE.MeshStandardMaterial({ color: 0x1d3a42, roughness: 0.05, metalness: 0.3 }),
  );
  water.userData.disposeMaterial = true;
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.225;
  g.add(water);
  for (const [r, y] of [
    [0.36, 0.42],
    [0.2, 0.62],
  ] as const) {
    const tier = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.6, 0.1, 14), pal.trim);
    tier.position.y = y;
    g.add(tier);
  }
  const bud = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 8), pal.glow());
  bud.position.y = 0.78;
  g.add(bud);
  // Floating lotus buds around the pool.
  for (let i = 0, n = 3 + rng.int(3); i < n; i++) {
    const a = rng.angle();
    const flower = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.07, 6), pal.soft);
    flower.position.set(Math.cos(a) * rng.range(0.35, 0.6), 0.25, Math.sin(a) * rng.range(0.35, 0.6));
    g.add(flower);
  }
  return g;
}

/** Caparisoned temple elephant statue, trunk raised. */
export function elephantStatue(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 1.2), pal.trim);
  plinth.position.y = 0.07;
  g.add(plinth);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 9), pal.body);
  body.position.set(0, 0.62, -0.1);
  body.scale.set(0.95, 0.9, 1.25);
  body.castShadow = true;
  g.add(body);
  for (const [x, z] of [
    [-0.18, -0.35],
    [0.18, -0.35],
    [-0.18, 0.2],
    [0.18, 0.2],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.35, 8), pal.body);
    leg.position.set(x, 0.31, z);
    g.add(leg);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), pal.body);
  head.position.set(0, 0.78, 0.42);
  g.add(head);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 10), pal.body);
    ear.rotation.z = Math.PI / 2;
    ear.rotation.y = side * 0.5;
    ear.position.set(side * 0.2, 0.8, 0.36);
    g.add(ear);
  }
  // Raised trunk: curved tube.
  const trunk = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.72, 0.56),
        new THREE.Vector3(0, 0.55, 0.72),
        new THREE.Vector3(rng.jitter(0.05), 0.75, 0.82),
      ]),
      10,
      0.045,
      8,
    ),
    pal.body,
  );
  g.add(trunk);
  // Caparison: gold blanket + headplate.
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.3, 0.6), pal.metal);
  blanket.position.set(0, 0.78, -0.15);
  g.add(blanket);
  const headplate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.03), pal.metal);
  headplate.position.set(0, 0.86, 0.58);
  headplate.rotation.x = -0.4;
  g.add(headplate);
  return g;
}

/** Inlaid mandala floor medallion (procedural, seeded). Lies flat at y≈0. */
export function mandalaMedallion(rng: Rng, pal: Palette, opts: { radius?: number } = {}): THREE.Group {
  const radius = opts.radius ?? 0.9;
  const g = new THREE.Group();
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.translate(128, 128);
    const hue = 20 + rng.int(40);
    for (let ringIndex = 5; ringIndex >= 1; ringIndex--) {
      ctx.fillStyle = `hsl(${hue + ringIndex * 12}, ${45 + rng.int(20)}%, ${28 + ringIndex * 7}%)`;
      ctx.beginPath();
      ctx.arc(0, 0, ringIndex * 24, 0, Math.PI * 2);
      ctx.fill();
    }
    // Petal ring.
    ctx.fillStyle = `hsl(${hue}, 60%, 70%)`;
    const petals = 8 + rng.int(5);
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 88, Math.sin(a) * 88, 20, 9, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `hsl(${hue + 30}, 70%, 80%)`;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  const medallion = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 32),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), roughness: 0.85 }),
  );
  medallion.userData.disposeMaterial = true;
  medallion.rotation.x = -Math.PI / 2;
  medallion.position.y = 0.012;
  g.add(medallion);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.02, 6, 32), pal.metal);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.015;
  g.add(rim);
  return g;
}

/** CEILING: chain of temple bells of descending size. Hangs into -Y. */
export function bellChain(rng: Rng, pal: Palette, opts: { drop?: number } = {}): THREE.Group {
  const drop = opts.drop ?? 1.6;
  const g = new THREE.Group();
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, drop, 6), pal.trim);
  rope.position.y = -drop / 2;
  g.add(rope);
  const bells = 3 + rng.int(2);
  for (let i = 0; i < bells; i++) {
    const r = 0.11 - i * 0.02;
    const y = -(drop / bells) * (i + 0.7);
    const bell = new THREE.Mesh(new THREE.ConeGeometry(r, r * 1.6, 12, 1, true), pal.metal);
    bell.position.set(rng.jitter(0.02), y, rng.jitter(0.02));
    g.add(bell);
    const clapper = new THREE.Mesh(new THREE.SphereGeometry(r * 0.3, 6, 5), pal.trim);
    clapper.position.set(bell.position.x, y - r * 0.7, bell.position.z);
    g.add(clapper);
  }
  return g;
}

/** Brass incense burner with slow smoke wisps (static curls). */
export function incenseBurner(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 0.5, 10), pal.metal);
  stand.position.y = 0.25;
  g.add(stand);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), pal.metal);
  bowl.position.y = 0.6;
  bowl.rotation.x = Math.PI;
  g.add(bowl);
  const ember = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 10), pal.glow(0xff7733));
  ember.position.y = 0.6;
  g.add(ember);
  // Smoke: two translucent rising curls.
  const smokeMat = new THREE.MeshStandardMaterial({
    color: 0xcfd4da,
    transparent: true,
    opacity: 0.18,
    roughness: 1,
  });
  for (let i = 0; i < 2; i++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.62, 0),
      new THREE.Vector3(rng.jitter(0.12), 0.9, rng.jitter(0.12)),
      new THREE.Vector3(rng.jitter(0.2), 1.25, rng.jitter(0.2)),
    ]);
    const wisp = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.02 + i * 0.012, 5), smokeMat);
    wisp.userData.disposeMaterial = i === 0;
    g.add(wisp);
  }
  return g;
}

/** Arched shrine alcove with a glowing deity silhouette and offering ledge. */
export function shrineAlcove(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.9, 0.12), pal.body);
  back.position.set(0, 0.95, -0.06);
  back.castShadow = true;
  g.add(back);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.08, 8, 16, Math.PI), pal.metal);
  arch.position.set(0, 1.25, 0.02);
  g.add(arch);
  for (const side of [-1, 1]) {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 0.1), pal.metal);
    jamb.position.set(side * 0.42, 0.82, 0.02);
    g.add(jamb);
  }
  // Deity: abstract glowing figure — head, torso, crossed base.
  const aura = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), pal.glow());
  aura.position.set(0, 1.05, 0.005);
  g.add(aura);
  const torso = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 8), pal.trim);
  torso.position.set(0, 0.85, 0.06);
  g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), pal.trim);
  head.position.set(0, 1.13, 0.06);
  g.add(head);
  // Offering ledge with marigold dabs.
  const ledge = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.07, 0.3), pal.trim);
  ledge.position.set(0, 0.42, 0.15);
  g.add(ledge);
  for (let i = 0, n = 4 + rng.int(4); i < n; i++) {
    const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), pal.glow(0xff9633));
    bloom.position.set(rng.jitter(0.42), 0.47, 0.15 + rng.jitter(0.08));
    g.add(bloom);
  }
  return g;
}

/** Torana: a free-standing carved gateway arch. Spans local X. */
export function toranArch(rng: Rng, pal: Palette, opts: { span?: number } = {}): THREE.Group {
  const span = opts.span ?? 1.8;
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.2, 0.22), pal.body);
    post.position.set((side * span) / 2, 1.1, 0);
    post.castShadow = true;
    g.add(post);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), pal.metal);
    cap.position.set((side * span) / 2, 2.25, 0);
    g.add(cap);
  }
  for (let i = 0; i < 2; i++) {
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(span + 0.6, 0.14, 0.2), i ? pal.metal : pal.body);
    lintel.position.y = 2.35 + i * 0.24;
    lintel.rotation.z = rng.jitter(0.005);
    g.add(lintel);
  }
  // Hanging marigold garlands between the lintels.
  for (let i = 0; i < 4; i++) {
    const x = -span / 2 + 0.2 + (i / 3) * (span - 0.4);
    const garland = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.24, 6), pal.glow(0xff9633));
    garland.position.set(x, 2.2, 0.06);
    g.add(garland);
  }
  return g;
}

/** Row of lit clay diyas (oil lamps) along a low step. */
export function diyaRow(rng: Rng, pal: Palette, opts: { count?: number } = {}): THREE.Group {
  const count = opts.count ?? 6;
  const g = new THREE.Group();
  const step = new THREE.Mesh(new THREE.BoxGeometry(count * 0.22 + 0.15, 0.08, 0.28), pal.body);
  step.position.y = 0.04;
  g.add(step);
  for (let i = 0; i < count; i++) {
    const x = (i - (count - 1) / 2) * 0.22;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.025, 0.035, 8), pal.soft);
    cup.position.set(x, 0.1, rng.jitter(0.03));
    g.add(cup);
    if (rng.chance(0.85)) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.045, 6), pal.glow(0xffd9a0));
      flame.position.set(x, 0.14, cup.position.z);
      g.add(flame);
    }
  }
  return g;
}

/** Rangoli floor decal: concentric dotted diamond pattern (procedural). */
export function rangoliDecal(rng: Rng, _pal: Palette, opts: { size?: number } = {}): THREE.Mesh {
  const size = opts.size ?? 1.2;
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.translate(96, 96);
    const hue = rng.int(360);
    for (let ringIndex = 3; ringIndex >= 0; ringIndex--) {
      ctx.strokeStyle = `hsl(${(hue + ringIndex * 60) % 360}, 70%, 60%)`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      const r = 20 + ringIndex * 22;
      // Diamond ring.
      ctx.moveTo(0, -r);
      ctx.lineTo(r, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r, 0);
      ctx.closePath();
      ctx.stroke();
      // Dots at the diamond points.
      ctx.fillStyle = `hsl(${(hue + ringIndex * 60 + 30) % 360}, 80%, 70%)`;
      for (const [dx, dy] of [
        [0, -r],
        [r, 0],
        [0, r],
        [-r, 0],
      ]) {
        ctx.beginPath();
        ctx.arc(dx, dy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }),
  );
  decal.userData.disposeMaterial = true;
  decal.rotation.x = -Math.PI / 2;
  decal.rotation.z = Math.PI / 4;
  decal.position.y = 0.011;
  return decal;
}
