import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * High tech & sci-fi — instruments for the futurist end of the palette range.
 * Origins on the floor; the surveillance camera is a wall prop facing +Z.
 */

/** Table projecting an additive hologram cone + floating disc. */
export function holoTable(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; holoMaterial: THREE.MeshBasicMaterial } {
  const group = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.09, 16), pal.body);
  top.position.y = 0.85;
  top.castShadow = true;
  group.add(top);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.82, 12), pal.trim);
  stem.position.y = 0.41;
  group.add(stem);
  const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 12), pal.glow());
  emitter.position.y = 0.9;
  group.add(emitter);
  const holoMaterial = new THREE.MeshBasicMaterial({
    color: pal.accent,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.55, 16, 1, true), holoMaterial);
  cone.rotation.x = Math.PI;
  cone.position.y = 1.2;
  cone.userData.disposeMaterial = true;
  group.add(cone);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.015, 16), holoMaterial);
  disc.position.y = 1.35 + rng.jitter(0.05);
  group.add(disc);
  return { group, holoMaterial };
}

/** Lattice mast with whip antennas and two dishes at different headings. */
export function antennaMast(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const H = 2.4;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const chord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, H, 6), pal.metal);
    chord.position.set(Math.cos(a) * 0.12, H / 2, Math.sin(a) * 0.12);
    g.add(chord);
  }
  for (let ring = 1; ring < 5; ring++) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.008, 4, 9), pal.trim);
    band.rotation.x = Math.PI / 2;
    band.position.y = ring * (H / 5);
    g.add(band);
  }
  for (const [y, len] of [
    [H - 0.1, 0.6],
    [H - 0.45, 0.45],
  ]) {
    const whip = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.012, len, 5), pal.metal);
    whip.position.set(0.1, y + len / 2, 0);
    whip.rotation.z = rng.jitter(0.1);
    g.add(whip);
  }
  for (const [y, heading] of [
    [1.4, rng.angle()],
    [1.9, rng.angle()],
  ]) {
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 6, 0, Math.PI * 2, 0, Math.PI / 3), pal.body);
    dish.position.set(Math.cos(heading) * 0.22, y, Math.sin(heading) * 0.22);
    dish.rotation.z = Math.PI / 2;
    dish.rotation.y = -heading;
    g.add(dish);
  }
  return g;
}

/** Pedestal radar dish with feed horn. `dish` rotates about y. */
export function radarDish(rng: Rng, pal: Palette): { group: THREE.Group; dish: THREE.Group } {
  const group = new THREE.Group();
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.7, 12), pal.trim);
  pedestal.position.y = 0.35;
  group.add(pedestal);
  const dish = new THREE.Group();
  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3.2),
    pal.body,
  );
  bowl.rotation.x = Math.PI / 2 + 0.5;
  bowl.castShadow = true;
  dish.add(bowl);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6), pal.metal);
  boom.rotation.x = -0.5;
  boom.position.set(0, 0.1, 0.22);
  dish.add(boom);
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 8), pal.glow());
  horn.rotation.x = Math.PI + -0.5;
  horn.position.set(0, 0.2, 0.41);
  dish.add(horn);
  dish.position.y = 0.85;
  dish.rotation.y = rng.angle();
  group.add(dish);
  return { group, dish };
}

/**
 * Industrial 3-joint arm. `joints[0]` yaws about y (base), `joints[1]` and
 * `joints[2]` pitch about x (shoulder, elbow). Ends in a two-finger gripper.
 */
export function robotArm(rng: Rng, pal: Palette): { group: THREE.Group; joints: THREE.Group[] } {
  const group = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.16, 14), pal.trim);
  plinth.position.y = 0.08;
  group.add(plinth);
  const base = new THREE.Group(); // yaw
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.2, 12), pal.body);
  turret.position.y = 0.1;
  base.add(turret);
  const shoulder = new THREE.Group(); // pitch
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 0.14).translate(0, 0.3, 0), pal.metal);
  upper.castShadow = true;
  shoulder.add(upper);
  const elbow = new THREE.Group(); // pitch
  const fore = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.1).translate(0, 0.225, 0), pal.metal);
  elbow.add(fore);
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 10), pal.trim);
  wrist.position.y = 0.48;
  elbow.add(wrist);
  for (const side of [-1, 1]) {
    const finger = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 0.03), pal.trim);
    finger.position.set(side * 0.035, 0.56, 0);
    elbow.add(finger);
  }
  elbow.position.y = 0.6;
  elbow.rotation.x = 0.7 + rng.jitter(0.3);
  shoulder.add(elbow);
  shoulder.position.y = 0.2;
  shoulder.rotation.x = -0.5 + rng.jitter(0.2);
  base.add(shoulder);
  base.position.y = 0.16;
  base.rotation.y = rng.angle();
  group.add(base);
  return { group, joints: [base, shoulder, elbow] };
}

/** Charging pad with chevrons and a segment-meter pylon. */
export function chargeDock(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.05, 20), pal.body);
  pad.position.y = 0.025;
  g.add(pad);
  for (let i = 0; i < 3; i++) {
    const chevron = new THREE.Mesh(new THREE.PlaneGeometry(0.3 - i * 0.07, 0.05), pal.glow());
    chevron.rotation.x = -Math.PI / 2;
    chevron.position.set(0, 0.055, -0.12 + i * 0.14);
    g.add(chevron);
  }
  const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 0.14), pal.trim);
  pylon.position.set(0, 0.55, -0.62);
  pylon.castShadow = true;
  g.add(pylon);
  // Charge meter: stacked segments, the lit count is the "battery level".
  const lit = 1 + rng.int(5);
  for (let i = 0; i < 5; i++) {
    const seg = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.06, 0.02),
      i < lit ? pal.glow(0x2bff88) : pal.metal,
    );
    seg.position.set(0, 0.3 + i * 0.12, -0.54);
    g.add(seg);
  }
  return g;
}

/** Shelf of parked quadcopters, one bay conspicuously empty. */
export function droneRack(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.6), pal.body);
  shelf.position.y = 0.9;
  shelf.castShadow = true;
  g.add(shelf);
  for (const x of [-0.7, 0.7]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.5), pal.trim);
    leg.position.set(x, 0.45, 0);
    g.add(leg);
  }
  const emptyBay = rng.int(3);
  for (let bay = 0; bay < 3; bay++) {
    const x = -0.45 + bay * 0.45;
    // Bay marking.
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), pal.trim);
    mark.rotation.x = -Math.PI / 2;
    mark.position.set(x, 0.928, 0);
    g.add(mark);
    if (bay === emptyBay) continue;
    const drone = new THREE.Group();
    const bodyBox = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.12), pal.trim);
    drone.add(bodyBox);
    for (const [ax, az] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.02), pal.metal);
      arm.position.set(ax * 0.09, 0, az * 0.09);
      arm.rotation.y = Math.atan2(az, ax);
      drone.add(arm);
      const rotorDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.006, 10), pal.body);
      rotorDisc.position.set(ax * 0.14, 0.015, az * 0.14);
      drone.add(rotorDisc);
    }
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 5), pal.glow(0xff2b3a));
    eye.position.set(0, -0.01, 0.065);
    drone.add(eye);
    drone.position.set(x, 0.96, rng.jitter(0.04));
    drone.rotation.y = rng.jitter(0.25);
    g.add(drone);
  }
  return g;
}

/** Slim obelisk with three inset glowing ring bands and a tip bead. */
export function sensorPylon(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const H = 2;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, H, 6), pal.body);
  body.position.y = H / 2;
  body.castShadow = true;
  g.add(body);
  for (const t of [0.35, 0.55, 0.75]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.12 - t * 0.05, 0.012, 6, 12), pal.glow());
    band.rotation.x = Math.PI / 2;
    band.position.y = H * t;
    g.add(band);
  }
  const bead = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 8, 6),
    pal.glow(rng.chance(0.5) ? pal.accent : 0xff2b3a),
  );
  bead.position.y = H + 0.05;
  g.add(bead);
  return g;
}

/** Wall CCTV. `yoke` pans about y; `camera` tilts about x. Red status bead. */
export function surveillanceCamera(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; yoke: THREE.Group; camera: THREE.Group } {
  const group = new THREE.Group();
  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), pal.trim);
  mount.position.set(0, 2.2, 0.025);
  group.add(mount);
  const yoke = new THREE.Group();
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8), pal.metal);
  stalk.rotation.x = Math.PI / 2;
  stalk.position.z = 0.08;
  yoke.add(stalk);
  const camera = new THREE.Group();
  const bodyBox = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.24), pal.body);
  camera.add(bodyBox);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.05, 10), pal.metal);
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.14;
  camera.add(lens);
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), pal.glow(0xff2b3a));
  bead.position.set(0, 0.06, 0.06);
  camera.add(bead);
  camera.position.z = 0.16;
  camera.rotation.x = 0.35 + rng.jitter(0.1); // looking down at the room
  yoke.add(camera);
  yoke.position.set(0, 2.2, 0.05);
  yoke.rotation.y = rng.jitter(0.6);
  group.add(yoke);
  return { group, yoke, camera };
}

/** Freestanding blade-stack monolith with glowing seams. */
export function serverTotem(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.6), pal.trim);
  base.position.y = 0.06;
  g.add(base);
  let y = 0.12;
  const blades = 7 + rng.int(3);
  for (let i = 0; i < blades; i++) {
    const h = rng.range(0.14, 0.24);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.44, h, 0.44), pal.body);
    blade.position.y = y + h / 2;
    blade.rotation.y = rng.jitter(0.02);
    blade.castShadow = true;
    g.add(blade);
    y += h;
    if (i < blades - 1) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.012, 0.45), pal.glow());
      seam.position.y = y + 0.006;
      g.add(seam);
      y += 0.012;
    }
  }
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), pal.trim);
  cap.position.y = y + 0.025;
  g.add(cap);
  return g;
}

/** Angled control podium with a glowing top face and grip rails. */
export function controlLectern(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; topMaterial: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const column = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.95, 0.3), pal.body);
  column.position.y = 0.475;
  column.rotation.x = -0.08;
  column.castShadow = true;
  group.add(column);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.42), pal.trim);
  head.position.set(0, 0.98, 0.06);
  head.rotation.x = -0.35;
  group.add(head);
  const topMaterial = pal.glow().clone();
  topMaterial.emissiveIntensity = 1.1 + rng.jitter(0.2);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.34), topMaterial);
  face.position.set(0, 1.015, 0.07);
  // Lie on the head's slope: normal = +Y tipped 0.35 rad toward the operator.
  face.rotation.x = -(Math.PI / 2 - 0.35);
  face.userData.disposeMaterial = true;
  group.add(face);
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8), pal.metal);
    rail.rotation.x = -0.35 + Math.PI / 2;
    rail.position.set(side * 0.29, 0.99, 0.05);
    group.add(rail);
  }
  return { group, topMaterial };
}
