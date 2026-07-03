import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Steampunk — brass, gears, and pressure (pairs with the 'brass' palette).
 * The kinetic pieces return their moving parts: meshing gears, orrery arms,
 * a spinnable prop. Origins on the floor; gearWall faces +Z.
 */

function gear(pal: Palette, radius: number, teeth: number, thickness = 0.06): THREE.Group {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thickness, 18), pal.metal);
  disc.rotation.x = Math.PI / 2;
  g.add(disc);
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.22, radius * 0.16, thickness), pal.metal);
    tooth.position.set(Math.cos(a) * (radius + radius * 0.08), Math.sin(a) * (radius + radius * 0.08), 0);
    tooth.rotation.z = a;
    g.add(tooth);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, thickness + 0.02, 10), pal.trim);
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  return g;
}

/**
 * Wall of meshing gears. `gears` rotate about z — spin adjacent entries in
 * OPPOSITE directions (even indices +, odd −) and the train reads as real.
 */
export function gearWall(rng: Rng, pal: Palette): { group: THREE.Group; gears: THREE.Group[] } {
  const group = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.7, 0.06), pal.body);
  plate.position.y = 1.25;
  plate.castShadow = true;
  group.add(plate);
  const gears: THREE.Group[] = [];
  const layout: Array<[number, number, number, number]> = [
    [-0.4, 1.5, 0.28, 10],
    [0.05, 1.3, 0.2, 8],
    [0.42, 1.55, 0.16, 7],
    [0.3, 0.85, 0.24, 9],
    [-0.25, 0.75, 0.18, 8],
  ];
  layout.forEach(([x, y, r, teeth]) => {
    const wheel = gear(pal, r, teeth);
    wheel.position.set(x, y, 0.08);
    wheel.rotation.z = rng.angle();
    group.add(wheel);
    gears.push(wheel);
  });
  return { group, gears };
}

/** Riveted boiler: gauges, firebox glow, and a lever-handled relief valve. */
export function boilerRig(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const skid = new THREE.Mesh(new THREE.BoxGeometry(1, 0.12, 0.8), pal.trim);
  skid.position.y = 0.06;
  g.add(skid);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.2, 16), pal.metal);
  drum.position.y = 0.75;
  drum.castShadow = true;
  g.add(drum);
  for (const y of [0.45, 0.75, 1.05]) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), pal.trim);
      rivet.position.set(Math.cos(a) * 0.38, y, Math.sin(a) * 0.38);
      g.add(rivet);
    }
  }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), pal.metal);
  dome.position.y = 1.35;
  g.add(dome);
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.6, 10), pal.trim);
  stack.position.set(0, 1.85, 0);
  g.add(stack);
  const firebox = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), pal.glow(0xff5a2b));
  firebox.position.set(0, 0.4, 0.385);
  g.add(firebox);
  for (const [x, y] of [
    [-0.2, 0.95],
    [0.2, 0.95],
  ]) {
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 12), pal.trim);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(x, y, 0.375);
    g.add(dial);
    const needle = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.05, 0.008), pal.glow());
    needle.position.set(x, y + 0.01, 0.395);
    needle.rotation.z = rng.jitter(1.2);
    g.add(needle);
  }
  const valveArm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.03), pal.trim);
  valveArm.position.set(0.3, 1.5, 0.1);
  valveArm.rotation.z = -0.6;
  g.add(valveArm);
  return g;
}

/** Brass telescope on a tripod, aimed high. */
export function brassTelescope(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 1.15, 6), pal.body);
    leg.position.set(Math.cos(a) * 0.3, 0.54, Math.sin(a) * 0.3);
    leg.rotation.z = Math.cos(a) * 0.5;
    leg.rotation.x = -Math.sin(a) * 0.5;
    g.add(leg);
  }
  const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), pal.trim);
  pivot.position.y = 1.06;
  g.add(pivot);
  const tube = new THREE.Group();
  // Telescoping sections, narrowing toward the sky.
  let z = 0;
  for (const [r, len] of [
    [0.06, 0.4],
    [0.048, 0.35],
    [0.038, 0.3],
  ] as const) {
    const section = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), pal.metal);
    section.rotation.x = Math.PI / 2;
    section.position.z = z + len / 2;
    tube.add(section);
    z += len - 0.04;
  }
  const eyepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.035, 0.08, 8), pal.trim);
  eyepiece.rotation.x = Math.PI / 2;
  eyepiece.position.z = -0.06;
  tube.add(eyepiece);
  tube.position.y = 1.06;
  tube.rotation.x = -0.5 + rng.jitter(0.1); // aimed above the horizon
  tube.rotation.y = rng.angle();
  g.add(tube);
  return g;
}

/** Desktop orrery. `arms` rotate about y (each carries a planet). */
export function orrery(rng: Rng, pal: Palette): { group: THREE.Group; arms: THREE.Group[] } {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.06, 14), pal.body);
  base.position.y = 0.03;
  group.add(base);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.5, 8), pal.metal);
  column.position.y = 0.31;
  group.add(column);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), pal.glow(0xffb347));
  sun.position.y = 0.6;
  group.add(sun);
  const arms: THREE.Group[] = [];
  const planetColors = [0x9fd8ff, 0xff7733, 0x66ffd9];
  [0.16, 0.24, 0.32].forEach((reach, i) => {
    const arm = new THREE.Group();
    const rod = new THREE.Mesh(new THREE.BoxGeometry(reach, 0.012, 0.012).translate(reach / 2, 0, 0), pal.metal);
    arm.add(rod);
    const planet = new THREE.Mesh(new THREE.SphereGeometry(0.03 - i * 0.005, 8, 6), pal.glow(planetColors[i]));
    planet.position.x = reach;
    arm.add(planet);
    arm.position.y = 0.6 - i * 0.06;
    arm.rotation.y = rng.angle();
    group.add(arm);
    arms.push(arm);
  });
  return { group, arms };
}

/** Mechanical typewriter with a paper sheet mid-line. */
export function typewriterProp(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.32), pal.metal);
  body.position.y = 0.09;
  body.castShadow = true;
  g.add(body);
  // Stepped key rows.
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      const key = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 8), pal.trim);
      key.position.set(-0.13 + c * 0.038, 0.17 - r * 0.025, 0.06 + r * 0.045);
      g.add(key);
    }
  }
  const platen = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.42, 10), pal.body);
  platen.rotation.z = Math.PI / 2;
  platen.position.set(0, 0.21, -0.1);
  g.add(platen);
  for (const side of [-1, 1]) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 8), pal.trim);
    knob.rotation.z = Math.PI / 2;
    knob.position.set(side * 0.23, 0.21, -0.1);
    g.add(knob);
  }
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.2), pal.soft);
  sheet.position.set(0, 0.34, -0.12);
  sheet.rotation.x = -0.25 + rng.jitter(0.05);
  g.add(sheet);
  return g;
}

/** Horn gramophone on a side cabinet. */
export function gramophone(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.45), pal.body);
  cabinet.position.y = 0.375;
  cabinet.castShadow = true;
  g.add(cabinet);
  const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 16), pal.trim);
  platter.position.y = 0.77;
  g.add(platter);
  const record = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.006, 16), pal.metal);
  record.position.y = 0.785;
  g.add(record);
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 12, 1, true), pal.metal);
  horn.position.set(0.05, 1.18, -0.08);
  horn.rotation.x = 0.9;
  horn.rotation.z = rng.jitter(0.1);
  g.add(horn);
  const neck = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.79, 0.1),
        new THREE.Vector3(0.02, 0.9, 0.05),
        new THREE.Vector3(0.05, 0.98, -0.02),
      ]),
      8,
      0.02,
      6,
    ),
    pal.metal,
  );
  g.add(neck);
  const crankHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), pal.trim);
  crankHandle.rotation.z = Math.PI / 2;
  crankHandle.position.set(0.3, 0.6, 0);
  g.add(crankHandle);
  return g;
}

/** Airship engine block with a two-blade wooden prop. `rotor` spins about z. */
export function airshipProp(rng: Rng, pal: Palette): { group: THREE.Group; rotor: THREE.Group } {
  const group = new THREE.Group();
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), pal.trim);
  stand.position.y = 0.25;
  group.add(stand);
  const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.5, 12), pal.metal);
  engine.rotation.x = Math.PI / 2;
  engine.position.y = 0.85;
  engine.castShadow = true;
  group.add(engine);
  // Exhaust stubs around the cowl.
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.12, 6), pal.trim);
    stub.position.set(Math.cos(a) * 0.26, 0.85 + Math.sin(a) * 0.26, -0.1);
    stub.rotation.z = a;
    group.add(stub);
  }
  const rotor = new THREE.Group();
  for (const side of [-1, 1]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.7, 0.03).translate(0, side * 0.38, 0), pal.body);
    blade.rotation.y = side * 0.35; // blade pitch
    rotor.add(blade);
  }
  const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 10), pal.metal);
  spinner.rotation.x = Math.PI / 2;
  spinner.position.z = 0.32;
  rotor.add(spinner);
  rotor.position.set(0, 0.85, 0.28);
  rotor.rotation.z = rng.angle();
  group.add(rotor);
  return { group, rotor };
}

/** Pneumatic message-tube station with a capsule in the intake. */
export function pneumaticStation(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const desk = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.95, 0.45), pal.body);
  desk.position.y = 0.475;
  desk.castShadow = true;
  g.add(desk);
  // Tube run rising to the ceiling with a curve.
  const tubeRun = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.15, 1.0, 0),
        new THREE.Vector3(0.18, 1.6, -0.08),
        new THREE.Vector3(0.05, 2.2, -0.2),
        new THREE.Vector3(0.05, 2.6, -0.2),
      ]),
      16,
      0.06,
      10,
    ),
    pal.glass,
  );
  g.add(tubeRun);
  const intake = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 10), pal.metal);
  intake.position.set(0.15, 1.02, 0);
  g.add(intake);
  // The capsule visible inside the glass tube.
  const capsule = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 8), pal.glow(0xffb347));
  capsule.position.set(0.17, 1.35 + rng.next() * 0.5, -0.05);
  capsule.rotation.x = 0.15;
  g.add(capsule);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.02), pal.trim);
  lever.position.set(-0.15, 1.05, 0.2);
  lever.rotation.x = -0.4;
  g.add(lever);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.02), pal.trim);
  slot.position.set(-0.1, 0.85, 0.226);
  g.add(slot);
  return g;
}

/** Brass automaton bust with glowing eyes and an exposed clockwork chest. */
export function automatonBust(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.85, 0.5), pal.body);
  plinth.position.y = 0.425;
  plinth.castShadow = true;
  g.add(plinth);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.4, 10), pal.metal);
  chest.position.y = 1.05;
  g.add(chest);
  // Exposed chest gears.
  const g1 = gear(pal, 0.06, 6, 0.03);
  g1.position.set(-0.04, 1.08, 0.16);
  g1.rotation.z = rng.angle();
  g.add(g1);
  const g2 = gear(pal, 0.04, 5, 0.03);
  g2.position.set(0.06, 1.0, 0.16);
  g.add(g2);
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), pal.trim);
    shoulder.position.set(side * 0.2, 1.22, 0);
    g.add(shoulder);
  }
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.2, 10), pal.metal);
  head.position.y = 1.4;
  g.add(head);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), pal.trim);
  cap.position.y = 1.5;
  g.add(cap);
  for (const side of [-0.04, 0.04]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 5), pal.glow());
    eye.position.set(side, 1.42, 0.095);
    g.add(eye);
  }
  const keyBow = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 5, 8), pal.trim);
  keyBow.position.set(0, 1.12, -0.2);
  keyBow.rotation.y = Math.PI / 2;
  g.add(keyBow);
  return g;
}
