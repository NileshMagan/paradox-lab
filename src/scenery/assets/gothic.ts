import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Gothic crypt — dark/horror set (pairs with the 'gothic' and 'noir'
 * palettes). Origins on the floor; chandelier hangs into -Y; cobweb is a
 * wall-corner prop facing +Z.
 */

/** Coffin on trestles. `lid` hinges along its long edge about z. */
export function coffin(rng: Rng, pal: Palette): { group: THREE.Group; lid: THREE.Group } {
  const group = new THREE.Group();
  for (const z of [-0.55, 0.55]) {
    const trestle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.1), pal.trim);
    trestle.position.set(0, 0.175, z);
    group.add(trestle);
  }
  // Tapered hexagonal profile: wide at the shoulders, narrow at the feet.
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.32, 1.9), pal.body);
  body.position.y = 0.51;
  body.castShadow = true;
  group.add(body);
  for (const z of [0.6, -0.8]) {
    const taper = new THREE.Mesh(new THREE.BoxGeometry(z > 0 ? 0.68 : 0.44, 0.32, 0.5), pal.body);
    taper.position.set(0, 0.51, z);
    taper.rotation.y = rng.jitter(0.01);
    group.add(taper);
  }
  const lid = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 1.94).translate(0.31, 0.03, 0), pal.trim);
  lid.add(slab);
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.7).translate(0.31, 0.07, 0.1), pal.metal);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.06).translate(0.31, 0.07, 0.32), pal.metal);
  lid.add(crossV, crossH);
  lid.position.set(-0.31, 0.67, 0);
  lid.rotation.z = rng.chance(0.4) ? 0.5 + rng.next() * 0.4 : 0; // creaked open
  group.add(lid);
  return { group, lid };
}

/** Standing candelabra: branched arms, dripping wax, flame cones. */
export function candelabra(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.06, 12), pal.metal);
  base.position.y = 0.03;
  g.add(base);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 1.3, 8), pal.metal);
  stem.position.y = 0.7;
  g.add(stem);
  const positions: Array<[number, number]> = [[0, 1.42]];
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.015, 6, 12, Math.PI / 2),
      pal.metal,
    );
    arm.rotation.z = side < 0 ? Math.PI : Math.PI / 2;
    arm.position.set(side * 0.18, 1.18, 0);
    g.add(arm);
    positions.push([side * 0.36, 1.32]);
  }
  for (const [x, y] of positions) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.04, 8), pal.metal);
    cup.position.set(x, y, 0);
    g.add(cup);
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, rng.range(0.08, 0.2), 8), pal.soft);
    candle.position.set(x, y + 0.08, 0);
    g.add(candle);
    if (rng.chance(0.8)) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.045, 6), pal.glow(0xffd9a0));
      flame.position.set(x, y + 0.2, 0);
      g.add(flame);
    }
  }
  return g;
}

/** Crouched gargoyle on a pedestal: folded wings, hunched shoulders. */
export function gargoyle(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.55), pal.trim);
  pedestal.position.y = 0.35;
  pedestal.castShadow = true;
  g.add(pedestal);
  const haunch = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), pal.body);
  haunch.position.set(0, 0.85, -0.05);
  haunch.scale.set(1, 0.85, 1.1);
  g.add(haunch);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), pal.body);
  chest.position.set(0, 1.02, 0.12);
  g.add(chest);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), pal.body);
  head.position.set(0, 1.18, 0.16);
  head.rotation.y = rng.jitter(0.2); // watching somewhere specific
  g.add(head);
  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.09, 6), pal.body);
    horn.position.set(side * 0.06, 1.28, 0.14);
    horn.rotation.z = side * -0.3;
    g.add(horn);
    // Folded wing: swept flat box.
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.28), pal.trim);
    wing.position.set(side * 0.2, 1.0, -0.12);
    wing.rotation.z = side * 0.35;
    wing.rotation.x = -0.25;
    g.add(wing);
    const claw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.12), pal.body);
    claw.position.set(side * 0.12, 0.75, 0.22);
    g.add(claw);
  }
  return g;
}

/** Row of leaning tombstones with mossy feet. */
export function tombstoneRow(rng: Rng, pal: Palette, opts: { count?: number } = {}): THREE.Group {
  const count = opts.count ?? 3;
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const x = (i - (count - 1) / 2) * 0.6;
    const kind = rng.int(3);
    let stone: THREE.Mesh;
    if (kind === 0) {
      // Round-top slab.
      stone = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.6, 0.08), pal.body);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12, 1, false, 0, Math.PI), pal.body);
      cap.rotation.x = Math.PI / 2;
      cap.rotation.z = Math.PI / 2;
      cap.position.y = 0.3;
      stone.add(cap);
    } else if (kind === 1) {
      // Cross.
      stone = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.08), pal.body);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.08), pal.body);
      bar.position.y = 0.16;
      stone.add(bar);
    } else {
      // Plain slab.
      stone = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.55, 0.09), pal.body);
    }
    stone.position.set(x, 0.32, rng.jitter(0.12));
    stone.rotation.z = rng.jitter(0.14); // centuries of subsidence
    stone.rotation.y = rng.jitter(0.15);
    stone.castShadow = true;
    g.add(stone);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), pal.trim);
    foot.position.set(x, 0.03, 0.06);
    foot.scale.set(1.4, 0.3, 1);
    g.add(foot);
  }
  return g;
}

/** Spiked wrought-iron fence run, one bar bent. Spans local X. */
export function ironFence(rng: Rng, pal: Palette, opts: { length?: number } = {}): THREE.Group {
  const length = opts.length ?? 2.2;
  const g = new THREE.Group();
  for (const y of [0.25, 1.05]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.045, 0.045), pal.metal);
    rail.position.y = y;
    g.add(rail);
  }
  const bars = Math.round(length / 0.18);
  const bent = rng.int(bars);
  for (let i = 0; i < bars; i++) {
    const x = -length / 2 + 0.09 + i * 0.18;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.25, 6), pal.metal);
    bar.position.set(x, 0.625, 0);
    if (i === bent) {
      bar.rotation.z = 0.35; // someone forced their way through
      bar.rotation.x = rng.jitter(0.2);
    }
    g.add(bar);
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.09, 6), pal.metal);
    spike.position.set(x + (i === bent ? 0.2 : 0), i === bent ? 1.2 : 1.3, i === bent ? rng.jitter(0.1) : 0);
    g.add(spike);
  }
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.45, 0.09), pal.trim);
    post.position.set((side * length) / 2, 0.725, 0);
    g.add(post);
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), pal.metal);
    finial.position.set((side * length) / 2, 1.5, 0);
    g.add(finial);
  }
  return g;
}

/** CEILING: ringed candle chandelier on chains. Hangs into -Y. */
export function chandelier(rng: Rng, pal: Palette, opts: { drop?: number } = {}): THREE.Group {
  const drop = opts.drop ?? 0.9;
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, drop, 5), pal.metal);
    chain.position.set(Math.cos(a) * 0.18, -drop / 2, Math.sin(a) * 0.18);
    chain.rotation.z = Math.cos(a) * 0.35;
    chain.rotation.x = -Math.sin(a) * 0.35;
    g.add(chain);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.03, 8, 20), pal.metal);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -drop;
  g.add(ring);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), pal.metal);
  hub.position.y = -drop;
  g.add(hub);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * 0.38;
    const z = Math.sin(a) * 0.38;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.025, 0.04, 8), pal.metal);
    cup.position.set(x, -drop + 0.04, z);
    g.add(cup);
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, rng.range(0.06, 0.14), 6), pal.soft);
    candle.position.set(x, -drop + 0.12, z);
    g.add(candle);
    if (rng.chance(0.7)) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.035, 6), pal.glow(0xffd9a0));
      flame.position.set(x, -drop + 0.22, z);
      g.add(flame);
    }
  }
  return g;
}

/** Corner cobweb: radial threads + spiral rings, hung with dust. Faces +Z. */
export function cobweb(rng: Rng, _pal: Palette, opts: { size?: number } = {}): THREE.Group {
  const size = opts.size ?? 0.9;
  const g = new THREE.Group();
  const silk = new THREE.MeshStandardMaterial({
    color: 0xd8dde2,
    transparent: true,
    opacity: 0.35,
    roughness: 1,
  });
  // Anchored in a corner: radials fan from the origin (top-left anchor).
  const radials = 6;
  for (let i = 0; i <= radials; i++) {
    const a = -Math.PI / 2 + (i / radials) * (Math.PI / 2); // quarter fan
    const thread = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0025, 0.0025, size, 3),
      silk,
    );
    thread.userData.disposeMaterial = i === 0;
    thread.position.set(Math.cos(a) * size * 0.5, Math.sin(a) * size * 0.5, 0);
    thread.rotation.z = a + Math.PI / 2;
    g.add(thread);
  }
  // Spiral rings: arcs at increasing radius, each sagging slightly.
  for (let r = 0.2; r < size; r += 0.16) {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.0025, 3, 12, Math.PI / 2),
      silk,
    );
    arc.rotation.z = Math.PI; // fit the quarter fan
    arc.position.z = rng.jitter(0.01);
    g.add(arc);
  }
  g.position.y = 2; // corner height; caller repositions
  return g;
}

/** Cracked standing mirror: dark frame, shard-split reflective face. */
export function brokenMirror(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.7, 0.07), pal.body);
  frame.position.y = 0.95;
  frame.rotation.x = -0.08; // leaning back against a wall
  frame.castShadow = true;
  g.add(frame);
  const shardMat = new THREE.MeshStandardMaterial({ color: 0xcfe0ea, metalness: 1, roughness: 0.06 });
  // The face is split into offset shards around a missing wedge.
  const shards: Array<[number, number, number, number]> = [
    [-0.14, 1.25, 0.3, 0.5],
    [0.16, 1.3, 0.24, 0.42],
    [-0.16, 0.72, 0.26, 0.48],
    [0.12, 0.62, 0.3, 0.36],
  ];
  shards.forEach(([x, y, w, h], i) => {
    const shard = new THREE.Mesh(new THREE.PlaneGeometry(w, h), shardMat);
    shard.userData.disposeMaterial = i === 0;
    shard.position.set(x, y, 0.04 - 0.08 * (y / 1.7) - 0.002 * i);
    shard.rotation.x = -0.08;
    shard.rotation.z = rng.jitter(0.06);
    g.add(shard);
  });
  // A fallen shard on the floor.
  const fallen = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.2), shardMat);
  fallen.rotation.x = -Math.PI / 2;
  fallen.rotation.z = rng.angle();
  fallen.position.set(rng.jitter(0.3), 0.005, 0.35);
  g.add(fallen);
  return g;
}

/** Wall crypt niche: arched recess, urn, and offering candles. */
export function cryptNiche(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const block = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.9, 0.35), pal.body);
  block.position.set(0, 0.95, -0.18);
  block.castShadow = true;
  g.add(block);
  // Recess: dark inset + arch top.
  const recess = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), pal.trim);
  recess.position.set(0, 1.1, 0.001);
  g.add(recess);
  const archTop = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.02, 14, 1, false, 0, Math.PI), pal.trim);
  archTop.rotation.x = Math.PI / 2;
  archTop.position.set(0, 1.45, 0.001);
  g.add(archTop);
  const shelfLedge = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.06, 0.16), pal.metal);
  shelfLedge.position.set(0, 0.72, 0.06);
  g.add(shelfLedge);
  const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.18, 10), pal.metal);
  urn.position.set(rng.jitter(0.1), 0.84, 0.02);
  g.add(urn);
  const urnLid = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.05, 10), pal.metal);
  urnLid.position.set(urn.position.x, 0.96, 0.02);
  g.add(urnLid);
  for (const side of [-0.22, 0.22]) {
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, rng.range(0.05, 0.12), 8), pal.soft);
    candle.position.set(side, 0.79, 0.05);
    g.add(candle);
    if (rng.chance(0.7)) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.035, 6), pal.glow(0xffd9a0));
      flame.position.set(side, 0.88, 0.05);
      g.add(flame);
    }
  }
  return g;
}

/** Iron cauldron on clawed feet with a glowing brew and ladle. */
export function cauldron(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10, 0, Math.PI * 2, 0.6, Math.PI - 0.6), pal.metal);
  pot.position.y = 0.42;
  pot.castShadow = true;
  g.add(pot);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.035, 8, 18), pal.trim);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.72;
  g.add(lip);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const foot = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 6), pal.metal);
    foot.rotation.x = Math.PI;
    foot.position.set(Math.cos(a) * 0.26, 0.09, Math.sin(a) * 0.26);
    g.add(foot);
  }
  const brew = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), pal.glow(0x9dff5a));
  brew.rotation.x = -Math.PI / 2;
  brew.position.y = 0.7;
  g.add(brew);
  // Bubbles frozen mid-pop.
  for (let i = 0, n = 3 + rng.int(3); i < n; i++) {
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(rng.range(0.015, 0.035), 6, 5), pal.glow(0x9dff5a));
    bubble.position.set(rng.jitter(0.2), 0.72, rng.jitter(0.2));
    g.add(bubble);
  }
  const ladle = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 6), pal.trim);
  ladle.position.set(0.25, 0.85, rng.jitter(0.1));
  ladle.rotation.z = -0.5;
  g.add(ladle);
  return g;
}
