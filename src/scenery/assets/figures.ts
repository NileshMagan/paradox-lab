import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Figures — human-shaped presences without characters: mannequins, statues,
 * empty suits, remains. Deliberately faceless (uncanny is the point in an
 * escape room). Origins on the floor.
 */

/** Artist mannequin on a stand. Poseable: head/arms returned, pivots at joints. */
export function mannequin(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; head: THREE.Group; armL: THREE.Group; armR: THREE.Group } {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.05, 12), pal.trim);
  base.position.y = 0.025;
  group.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.95, 8), pal.metal);
  pole.position.y = 0.5;
  group.add(pole);
  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), pal.body);
  pelvis.position.y = 0.98;
  pelvis.scale.set(1.2, 0.8, 0.9);
  group.add(pelvis);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.42, 10), pal.body);
  torso.position.y = 1.28;
  torso.castShadow = true;
  group.add(torso);
  for (const side of [-1, 1] as const) {
    const arm = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.32, 8).translate(0, -0.16, 0), pal.body);
    arm.add(upper);
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.024, 0.3, 8).translate(0, -0.47, 0), pal.body);
    arm.add(lower);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), pal.body);
    hand.position.y = -0.64;
    arm.add(hand);
    arm.position.set(side * 0.17, 1.48, 0);
    arm.rotation.z = side * (0.25 + rng.next() * 0.5);
    arm.rotation.x = rng.jitter(0.6);
    group.add(arm);
  }
  // The only Groups so far are the two arms (added left, then right).
  const arms = group.children.filter((c): c is THREE.Group => c instanceof THREE.Group);
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), pal.body);
  skull.position.y = 0.1;
  skull.scale.y = 1.25;
  head.add(skull);
  head.position.y = 1.52;
  head.rotation.y = rng.jitter(0.5);
  group.add(head);
  return { group, head, armL: arms[0], armR: arms[1] };
}

/** Tailor's dress form on a tripod — headless, armless torso. */
export function tailorDummy(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 6), pal.metal);
    leg.position.set(Math.cos(a) * 0.14, 0.28, Math.sin(a) * 0.14);
    leg.rotation.z = Math.cos(a) * 0.4;
    leg.rotation.x = -Math.sin(a) * 0.4;
    g.add(leg);
  }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), pal.metal);
  pole.position.y = 0.75;
  g.add(pole);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.55, 12), pal.soft);
  torso.position.y = 1.3;
  torso.scale.z = 0.75;
  torso.castShadow = true;
  g.add(torso);
  const bust = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), pal.soft);
  bust.position.y = 1.56;
  bust.scale.set(1, 0.6, 0.75);
  g.add(bust);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 8), pal.trim);
  collar.position.y = 1.68;
  collar.rotation.y = rng.angle();
  g.add(collar);
  return g;
}

/** Suit of armour at attention with a halberd. */
export function suitOfArmor(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.7), pal.trim);
  plinth.position.y = 0.06;
  g.add(plinth);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.65, 8), pal.metal);
    leg.position.set(side * 0.11, 0.45, 0);
    g.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), pal.metal);
    boot.position.set(side * 0.11, 0.16, 0.05);
    g.add(boot);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), pal.metal);
    shoulder.position.set(side * 0.24, 1.36, 0);
    g.add(shoulder);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.5, 8), pal.metal);
    arm.position.set(side * 0.26, 1.08, 0);
    arm.rotation.z = side * 0.12;
    g.add(arm);
  }
  const cuirass = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.55, 10), pal.metal);
  cuirass.position.y = 1.1;
  cuirass.scale.z = 0.8;
  cuirass.castShadow = true;
  g.add(cuirass);
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), pal.metal);
  helm.position.y = 1.52;
  helm.scale.y = 1.2;
  g.add(helm);
  const visorSlit = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.015, 0.02), pal.trim);
  visorSlit.position.set(0, 1.54, 0.1);
  g.add(visorSlit);
  const plume = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.18, 6), pal.glow());
  plume.position.y = 1.72;
  plume.rotation.x = -0.3;
  g.add(plume);
  // Halberd in the right gauntlet.
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.9, 6), pal.trim);
  shaft.position.set(0.34, 0.98, 0.08);
  shaft.rotation.z = rng.jitter(0.03);
  g.add(shaft);
  const blade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 4), pal.metal);
  blade.position.set(0.34, 1.98, 0.08);
  g.add(blade);
  const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.02), pal.metal);
  axeHead.position.set(0.42, 1.78, 0.08);
  g.add(axeHead);
  return g;
}

/** Skeletal remains slumped against something — grim set dressing. */
export function skeletonRemains(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const bone = new THREE.MeshStandardMaterial({ color: 0xd8cfb8, roughness: 0.9 });
  let owner = true;
  const seg = (geo: THREE.BufferGeometry): THREE.Mesh => {
    const m = new THREE.Mesh(geo, bone);
    m.userData.disposeMaterial = owner;
    owner = false;
    return m;
  };
  const lean = -0.5; // slumped back angle
  const skull = seg(new THREE.SphereGeometry(0.09, 10, 8));
  skull.position.set(0, 0.62, -0.16);
  skull.rotation.x = lean + rng.jitter(0.3);
  skull.scale.y = 1.15;
  g.add(skull);
  const jaw = seg(new THREE.BoxGeometry(0.08, 0.04, 0.06));
  jaw.position.set(0, 0.53, -0.1);
  g.add(jaw);
  const spine = seg(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 6));
  spine.position.set(0, 0.36, -0.08);
  spine.rotation.x = lean;
  g.add(spine);
  for (let i = 0; i < 4; i++) {
    const rib = seg(new THREE.TorusGeometry(0.1 - i * 0.012, 0.012, 5, 10, Math.PI));
    rib.position.set(0, 0.46 - i * 0.07, -0.11 + i * 0.035);
    rib.rotation.x = Math.PI / 2 + lean;
    g.add(rib);
  }
  for (const side of [-1, 1]) {
    const armBone = seg(new THREE.CylinderGeometry(0.014, 0.012, 0.5, 5));
    armBone.position.set(side * 0.2, 0.24, 0.06);
    armBone.rotation.z = side * 1.1 + rng.jitter(0.2);
    armBone.rotation.x = 0.5;
    g.add(armBone);
    const legBone = seg(new THREE.CylinderGeometry(0.018, 0.015, 0.6, 5));
    legBone.position.set(side * 0.12, 0.09, 0.42);
    legBone.rotation.x = Math.PI / 2 - 0.15;
    legBone.rotation.y = side * rng.range(0.1, 0.4);
    g.add(legBone);
  }
  // The thing it died reaching for is the room designer's problem.
  const dust = new THREE.Mesh(new THREE.CircleGeometry(0.55, 12), pal.trim);
  dust.rotation.x = -Math.PI / 2;
  dust.position.y = 0.004;
  g.add(dust);
  return g;
}

/** Field scarecrow on a cross-pole. */
export function scarecrow(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 2, 8), pal.trim);
  post.position.y = 1;
  g.add(post);
  const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 6), pal.trim);
  cross.rotation.z = Math.PI / 2;
  cross.position.y = 1.5;
  g.add(cross);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.6, 0.18), pal.soft);
  torso.position.y = 1.3;
  torso.rotation.z = rng.jitter(0.05);
  torso.castShadow = true;
  g.add(torso);
  for (const side of [-1, 1]) {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.55, 6), pal.soft);
    sleeve.rotation.z = Math.PI / 2 + side * 0.12;
    sleeve.position.set(side * 0.42, 1.5, 0);
    g.add(sleeve);
  }
  const headSack = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), pal.soft);
  headSack.position.y = 1.75;
  headSack.scale.y = 1.15;
  g.add(headSack);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 10), pal.body);
  brim.position.y = 1.86;
  brim.rotation.x = rng.jitter(0.15);
  g.add(brim);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.14, 8), pal.body);
  crown.position.y = 1.93;
  g.add(crown);
  // Straw wisps at the cuffs.
  for (const side of [-0.68, 0.68]) {
    const straw = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.14, 5), pal.glow(0xd9a441));
    straw.position.set(side, 1.48, 0);
    straw.rotation.z = side > 0 ? -1.7 : 1.7;
    g.add(straw);
  }
  return g;
}

/** Hooded, robed statue — temple guardian or monument. */
export function robedStatue(rng: Rng, pal: Palette, opts: { height?: number } = {}): THREE.Group {
  const height = opts.height ?? 1.9;
  const g = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.16, 12), pal.trim);
  plinth.position.y = 0.08;
  g.add(plinth);
  const robe = new THREE.Mesh(new THREE.ConeGeometry(0.3, height - 0.4, 10), pal.body);
  robe.position.y = 0.16 + (height - 0.4) / 2;
  robe.castShadow = true;
  g.add(robe);
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), pal.body);
  shoulders.position.y = height - 0.3;
  shoulders.scale.y = 0.7;
  g.add(shoulders);
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), pal.body);
  hood.position.y = height - 0.12;
  hood.scale.z = 1.2;
  g.add(hood);
  // The void under the hood — a dark inset instead of a face.
  const faceVoid = new THREE.Mesh(new THREE.CircleGeometry(0.07, 10), pal.trim);
  faceVoid.position.set(0, height - 0.13, 0.11);
  g.add(faceVoid);
  for (const side of [-1, 1]) {
    const sleeve = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.5, 8), pal.body);
    sleeve.position.set(side * 0.22, height - 0.62, 0.08);
    sleeve.rotation.x = 0.6;
    sleeve.rotation.z = side * -0.25;
    g.add(sleeve);
  }
  // Cupped hands hold a faint glow — instant focal point.
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), pal.glow());
  ember.position.set(rng.jitter(0.02), height - 0.85, 0.24);
  g.add(ember);
  return g;
}

/** Empty EVA space suit standing in its rack. */
export function spaceSuit(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const rack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.5), pal.trim);
  rack.position.y = 0.03;
  g.add(rack);
  const suit = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.7 });
  let owner = true;
  const piece = (geo: THREE.BufferGeometry): THREE.Mesh => {
    const m = new THREE.Mesh(geo, suit);
    m.userData.disposeMaterial = owner;
    owner = false;
    return m;
  };
  for (const side of [-1, 1]) {
    const legPiece = piece(new THREE.CylinderGeometry(0.09, 0.11, 0.7, 8));
    legPiece.position.set(side * 0.12, 0.45, 0);
    g.add(legPiece);
    const bootPiece = piece(new THREE.BoxGeometry(0.16, 0.12, 0.3));
    bootPiece.position.set(side * 0.12, 0.12, 0.05);
    g.add(bootPiece);
    const armPiece = piece(new THREE.CylinderGeometry(0.06, 0.055, 0.55, 8));
    armPiece.position.set(side * 0.3, 1.05, 0);
    armPiece.rotation.z = side * 0.18;
    g.add(armPiece);
  }
  const torsoPiece = piece(new THREE.CylinderGeometry(0.21, 0.18, 0.6, 10));
  torsoPiece.position.y = 1.1;
  torsoPiece.castShadow = true;
  g.add(torsoPiece);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.16), pal.body);
  pack.position.set(0, 1.15, -0.24);
  g.add(pack);
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.06), pal.trim);
  chest.position.set(0, 1.22, 0.2);
  g.add(chest);
  for (let i = 0; i < 3; i++) {
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 6, 5),
      pal.glow([0x2bff88, 0xffb347, 0xff2b3a][i]),
    );
    lamp.position.set(-0.05 + i * 0.05, 1.24, 0.235);
    g.add(lamp);
  }
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), pal.glass);
  helmet.position.y = 1.56;
  g.add(helmet);
  const neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 8, 14), pal.metal);
  neckRing.rotation.x = Math.PI / 2;
  neckRing.position.y = 1.42;
  neckRing.rotation.z = rng.angle();
  g.add(neckRing);
  return g;
}

/** Antique standing diving suit: brass helmet, weighted boots. */
export function divingSuit(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const canvasMat = pal.soft;
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.75, 8), canvasMat);
    leg.position.set(side * 0.12, 0.5, 0);
    g.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.14, 0.28), pal.metal);
    boot.position.set(side * 0.12, 0.12, 0.04);
    g.add(boot);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.55, 8), canvasMat);
    arm.position.set(side * 0.27, 1.08, 0);
    arm.rotation.z = side * 0.2;
    g.add(arm);
  }
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.6, 10), canvasMat);
  torso.position.y = 1.15;
  torso.castShadow = true;
  g.add(torso);
  const corselet = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.3), pal.metal);
  corselet.position.y = 1.48;
  g.add(corselet);
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), pal.metal);
  helm.position.y = 1.66;
  g.add(helm);
  // Three portholes: front + sides.
  for (const [a, tilt] of [
    [0, 0],
    [Math.PI / 2, 0],
    [-Math.PI / 2, 0],
  ] as const) {
    const port = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 10), pal.glass);
    port.rotation.x = Math.PI / 2 + tilt;
    port.rotation.z = -a;
    port.position.set(Math.sin(a) * 0.15, 1.66, Math.cos(a) * 0.15);
    g.add(port);
  }
  // Air hose looping off to the floor.
  const hose = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.78, -0.1),
        new THREE.Vector3(0.3, 1.4, -0.35),
        new THREE.Vector3(0.5 + rng.jitter(0.1), 0.4, -0.4),
        new THREE.Vector3(0.8, 0.03, -0.2),
      ]),
      14,
      0.025,
      6,
    ),
    pal.trim,
  );
  g.add(hose);
  return g;
}
