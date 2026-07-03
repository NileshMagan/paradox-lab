import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Wild west — frontier dressing (pairs with the 'saloon' palette).
 * Origins on the floor; saloonDoors face +Z.
 */

/** Batwing saloon doors in a frame. Leaves swing about y at their hinges. */
export function saloonDoors(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; leftLeaf: THREE.Group; rightLeaf: THREE.Group } {
  const group = new THREE.Group();
  for (const side of [-1, 1]) {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.3, 0.14), pal.body);
    jamb.position.set(side * 0.62, 1.15, 0);
    jamb.castShadow = true;
    group.add(jamb);
  }
  const header = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, 0.14), pal.body);
  header.position.y = 2.28;
  group.add(header);
  const makeLeaf = (side: number): THREE.Group => {
    const leaf = new THREE.Group();
    // Slatted batwing panel, offset so the hinge is at the jamb.
    for (let s = 0; s < 5; s++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.03).translate(-side * 0.27, 0, 0), pal.trim);
      slat.position.y = -0.3 + s * 0.16;
      leaf.add(slat);
    }
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.05).translate(-side * 0.52, 0, 0), pal.body);
    leaf.add(frame);
    leaf.position.set(side * 0.55, 1.25, 0);
    leaf.rotation.y = side * rng.jitter(0.35); // still swinging from the last exit
    return leaf;
  };
  const leftLeaf = makeLeaf(-1);
  const rightLeaf = makeLeaf(1);
  group.add(leftLeaf, rightLeaf);
  return { group, leftLeaf, rightLeaf };
}

/** Spoked wagon wheel leaning against whatever's behind it. */
export function wagonWheelProp(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const R = 0.5;
  const wheelGroup = new THREE.Group();
  wheelGroup.add(new THREE.Mesh(new THREE.TorusGeometry(R, 0.045, 8, 18), pal.trim));
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 10), pal.body);
  hub.rotation.x = Math.PI / 2;
  wheelGroup.add(hub);
  for (let i = 0; i < 6; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.045, R * 2 - 0.08, 0.035), pal.body);
    spoke.rotation.z = (i / 6) * Math.PI;
    wheelGroup.add(spoke);
  }
  wheelGroup.position.y = R + 0.02;
  wheelGroup.rotation.x = -0.22 + rng.jitter(0.04); // the lean
  wheelGroup.rotation.y = rng.jitter(0.2);
  g.add(wheelGroup);
  return g;
}

/** Stacked hay bales with loose straw. */
export function hayBales(rng: Rng, pal: Palette, opts: { count?: number } = {}): THREE.Group {
  const count = opts.count ?? 3;
  const g = new THREE.Group();
  const hay = new THREE.MeshStandardMaterial({ color: 0xc9a441, roughness: 1 });
  let owner = true;
  for (let i = 0; i < count; i++) {
    const bale = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.5), hay);
    bale.userData.disposeMaterial = owner;
    owner = false;
    bale.position.set(rng.jitter(0.2), 0.23 + (i > 1 ? 0.46 : 0), (i % 2) * 0.55 + rng.jitter(0.05));
    bale.rotation.y = rng.jitter(0.2);
    bale.castShadow = true;
    g.add(bale);
    // Twine bands.
    for (const t of [-0.2, 0.2]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.87, 0.46, 0.02), pal.trim);
      band.position.copy(bale.position);
      band.position.z += t;
      band.rotation.y = bale.rotation.y;
      band.scale.set(1, 1, 0.6);
      g.add(band);
    }
  }
  // Loose straw wisps at the base.
  for (let i = 0; i < 8; i++) {
    const wisp = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, rng.range(0.12, 0.25), 4), hay);
    wisp.position.set(rng.jitter(0.7), 0.01, rng.jitter(0.6));
    wisp.rotation.set(Math.PI / 2 + rng.jitter(0.3), 0, rng.angle());
    g.add(wisp);
  }
  return g;
}

/** Saguaro cactus with two arms. */
export function cactusSaguaro(rng: Rng, pal: Palette, opts: { height?: number } = {}): THREE.Group {
  const height = opts.height ?? 1.9;
  const g = new THREE.Group();
  const flesh = new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, height, 10), flesh);
  trunk.userData.disposeMaterial = true;
  trunk.position.y = height / 2;
  trunk.castShadow = true;
  g.add(trunk);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 6), flesh);
  cap.position.y = height;
  g.add(cap);
  for (const side of [-1, 1]) {
    if (side === 1 && rng.chance(0.25)) continue; // some saguaros are one-armed
    const armY = height * rng.range(0.4, 0.6);
    const elbow = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.09, 8, 10, Math.PI / 2),
      flesh,
    );
    elbow.rotation.z = side < 0 ? Math.PI : Math.PI / 2;
    elbow.position.set(side * 0.25, armY, 0);
    g.add(elbow);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, height * 0.32, 8), flesh);
    arm.position.set(side * 0.41, armY + height * 0.16 + (side < 0 ? 0 : 0), 0);
    arm.position.x = side * 0.41;
    arm.position.y = armY + height * 0.16;
    g.add(arm);
    const armCap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), flesh);
    armCap.position.set(side * 0.41, armY + height * 0.32, 0);
    g.add(armCap);
  }
  // Base grit.
  const grit = new THREE.Mesh(new THREE.CircleGeometry(0.35, 10), pal.soft);
  grit.rotation.x = -Math.PI / 2;
  grit.position.y = 0.005;
  g.add(grit);
  return g;
}

/** Water trough on legs with still water and a dipper. */
export function waterTrough(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const tub = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.55), pal.body);
  tub.position.y = 0.4;
  tub.castShadow = true;
  g.add(tub);
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x2a4a42, roughness: 0.08, metalness: 0.25 }),
  );
  water.userData.disposeMaterial = true;
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.56;
  g.add(water);
  for (const [x, z] of [
    [-0.6, -0.2],
    [0.6, -0.2],
    [-0.6, 0.2],
    [0.6, 0.2],
  ]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), pal.trim);
    leg.position.set(x, 0.11, z);
    g.add(leg);
  }
  const dipper = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 5), pal.metal);
  dipper.position.set(0.5, 0.62, rng.jitter(0.1));
  dipper.rotation.z = 0.9;
  g.add(dipper);
  return g;
}

/** Hitching post with a slack rope loop. */
export function hitchingPost(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  for (const x of [-0.6, 0.6]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1, 8), pal.body);
    post.position.set(x, 0.5, 0);
    post.rotation.z = rng.jitter(0.03);
    g.add(post);
  }
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.35, 8), pal.trim);
  rail.rotation.z = Math.PI / 2;
  rail.position.y = 0.92;
  g.add(rail);
  const rope = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.2, 0.92, 0.04),
        new THREE.Vector3(0 + rng.jitter(0.06), 0.68, 0.1),
        new THREE.Vector3(0.24, 0.92, 0.04),
      ]),
      10,
      0.015,
      5,
    ),
    pal.soft,
  );
  g.add(rope);
  return g;
}

/** Pot-belly stove with a glowing fire door and flue. */
export function potbellyStove(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.18, 6), pal.metal);
    leg.position.set(Math.cos(a) * 0.2, 0.09, Math.sin(a) * 0.2);
    g.add(leg);
  }
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), pal.metal);
  belly.position.y = 0.45;
  belly.scale.y = 1.15;
  belly.castShadow = true;
  g.add(belly);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.12, 12), pal.metal);
  collar.position.y = 0.82;
  g.add(collar);
  const flue = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.4, 10), pal.metal);
  flue.position.y = 1.55;
  g.add(flue);
  const doorRim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 12), pal.trim);
  doorRim.position.set(0, 0.42, 0.28);
  g.add(doorRim);
  const fire = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), pal.glow(0xff5a2b));
  fire.position.set(0, 0.42, 0.285);
  g.add(fire);
  const latch = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.02), pal.trim);
  latch.position.set(0.15, 0.42 + rng.jitter(0.01), 0.29);
  g.add(latch);
  return g;
}

/**
 * Campfire: log tepee, flame cones, ember bed. Returns `flameMaterials` to
 * flicker (`emissiveIntensity`) from the room update.
 */
export function campfire(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; flameMaterials: THREE.MeshStandardMaterial[] } {
  const group = new THREE.Group();
  // Stone ring.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(rng.range(0.06, 0.1), 0), pal.trim);
    stone.position.set(Math.cos(a) * 0.42, 0.05, Math.sin(a) * 0.42);
    stone.rotation.set(rng.angle(), rng.angle(), rng.angle());
    group.add(stone);
  }
  // Log tepee.
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + rng.jitter(0.2);
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.6, 6), pal.body);
    log.position.set(Math.cos(a) * 0.14, 0.24, Math.sin(a) * 0.14);
    log.rotation.z = Math.cos(a) * 0.6;
    log.rotation.x = -Math.sin(a) * 0.6;
    group.add(log);
  }
  const flameMaterials: THREE.MeshStandardMaterial[] = [];
  [0xff5a2b, 0xffb347, 0xffe2a0].forEach((color, i) => {
    const mat = pal.glow(color).clone();
    mat.emissiveIntensity = 2.2 - i * 0.4;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16 - i * 0.045, 0.4 - i * 0.08, 7), mat);
    flame.position.y = 0.32 + i * 0.1;
    flame.rotation.y = rng.angle();
    flame.userData.disposeMaterial = true;
    group.add(flame);
    flameMaterials.push(mat);
  });
  const emberBed = new THREE.Mesh(new THREE.CircleGeometry(0.2, 10), pal.glow(0xff5a2b));
  emberBed.rotation.x = -Math.PI / 2;
  emberBed.position.y = 0.03;
  group.add(emberBed);
  return { group, flameMaterials };
}
