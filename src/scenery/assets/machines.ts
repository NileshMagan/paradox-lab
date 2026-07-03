import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Machinery — the heavy plant that sells "facility". Palette-driven and
 * deterministic; glow accents come from `pal.glow()` so every theme keeps its
 * own signature colour. Origins on the floor, service side facing +Z.
 */

/** Vertical storage tank on legs: dome cap, side pipe, valve wheel. */
export function storageTank(
  rng: Rng,
  pal: Palette,
  opts: { radius?: number; height?: number } = {},
): THREE.Group {
  const radius = opts.radius ?? 0.55;
  const height = opts.height ?? 1.7;
  const g = new THREE.Group();
  const legH = 0.35;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, legH, 0.07), pal.metal);
    leg.position.set(Math.cos(a) * radius * 0.8, legH / 2, Math.sin(a) * radius * 0.8);
    g.add(leg);
  }
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 18), pal.body);
  shell.position.y = legH + height / 2;
  shell.castShadow = true;
  g.add(shell);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), pal.body);
  dome.position.y = legH + height;
  g.add(dome);
  // Weld bands.
  for (const t of [0.25, 0.75]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.01, 0.02, 6, 24), pal.trim);
    band.rotation.x = Math.PI / 2;
    band.position.y = legH + height * t;
    g.add(band);
  }
  // Outlet pipe with valve wheel.
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), pal.metal);
  pipe.rotation.x = Math.PI / 2;
  pipe.position.set(0, legH + 0.25, radius + 0.22);
  g.add(pipe);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 6, 14), pal.trim);
  wheel.position.set(0, legH + 0.25 + 0.13, radius + 0.22);
  wheel.rotation.x = Math.PI / 2;
  wheel.rotation.y = rng.angle();
  g.add(wheel);
  // Level gauge strip.
  const gauge = new THREE.Mesh(new THREE.BoxGeometry(0.05, height * 0.7, 0.03), pal.glow());
  gauge.position.set(radius * 0.7, legH + height / 2, radius * 0.72);
  g.add(gauge);
  return g;
}

/** A generator block: finned body, exhaust stack, feet, cable drop. */
export function generatorUnit(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, 0.75), pal.body);
  body.position.y = 0.55;
  body.castShadow = true;
  g.add(body);
  for (const x of [-0.5, 0.5]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.85), pal.trim);
    foot.position.set(x, 0.06, 0);
    g.add(foot);
  }
  // Cooling fins along the top.
  for (let i = 0; i < 8; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.7), pal.metal);
    fin.position.set(-0.56 + i * 0.16, 1.03, 0);
    g.add(fin);
  }
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.7, 10), pal.metal);
  stack.position.set(0.45, 1.3, -0.2);
  g.add(stack);
  const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.02), pal.glow());
  indicator.position.set(rng.jitter(0.4), 0.75, 0.39);
  g.add(indicator);
  // Cable slumping to the floor.
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.65, 0.6, 0.1),
    new THREE.Vector3(-0.95, 0.25, 0.25 + rng.jitter(0.1)),
    new THREE.Vector3(-1.2, 0.03, 0.1 + rng.jitter(0.2)),
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.025, 6), pal.trim));
  return g;
}

/** A run of angled operator consoles with button clusters and screens. */
export function consoleBank(
  rng: Rng,
  pal: Palette,
  opts: { stations?: number } = {},
): THREE.Group {
  const stations = opts.stations ?? 3;
  const g = new THREE.Group();
  const sw = 0.85;
  for (let i = 0; i < stations; i++) {
    const x = (i - (stations - 1) / 2) * sw;
    const base = new THREE.Mesh(new THREE.BoxGeometry(sw - 0.04, 0.75, 0.6), pal.body);
    base.position.set(x, 0.375, 0);
    base.castShadow = true;
    g.add(base);
    const slope = new THREE.Mesh(new THREE.BoxGeometry(sw - 0.04, 0.06, 0.45), pal.trim);
    slope.position.set(x, 0.81, 0.05);
    slope.rotation.x = -0.35;
    g.add(slope);
    // Button grid on the slope.
    for (let b = 0; b < 8; b++) {
      const on = rng.chance(0.4);
      const btn = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.02, 0.05),
        on ? pal.glow(rng.pick([pal.accent, 0xffb347, 0xff2b3a])) : pal.metal,
      );
      btn.position.set(x - 0.28 + (b % 4) * 0.18, 0.85 + Math.floor(b / 4) * 0.05, 0.14 - Math.floor(b / 4) * 0.14);
      btn.rotation.x = -0.35;
      g.add(btn);
    }
    // Upright screen.
    const screen = new THREE.Mesh(new THREE.BoxGeometry(sw - 0.2, 0.4, 0.05), pal.trim);
    screen.position.set(x, 1.2, -0.2);
    screen.rotation.x = -0.1;
    g.add(screen);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(sw - 0.28, 0.32), pal.glow());
    face.position.set(x, 1.2, -0.17);
    face.rotation.x = -0.1;
    g.add(face);
  }
  return g;
}

/** Squat centrifuge drum with a hinged lid and control pad. */
export function centrifuge(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.8, 18), pal.body);
  drum.position.y = 0.4;
  drum.castShadow = true;
  g.add(drum);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 18), pal.trim);
  const open = rng.chance(0.4);
  if (open) {
    lid.position.set(0, 0.86, -0.32);
    lid.rotation.x = -1.2;
  } else {
    lid.position.y = 0.83;
  }
  g.add(lid);
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.04), pal.trim);
  pad.position.set(0, 0.55, 0.5);
  pad.rotation.x = -0.3;
  g.add(pad);
  const readout = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.05), pal.glow());
  readout.position.set(0, 0.575, 0.525);
  readout.rotation.x = -0.3;
  g.add(readout);
  return g;
}

/** Wall control panel: switches, dials, and indicator lamps. Facing +Z. */
export function controlPanel(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.14), pal.body);
  box.position.y = 1.4;
  g.add(box);
  // Indicator lamps.
  for (let i = 0; i < 6; i++) {
    const lit = rng.chance(0.5);
    const lamp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.03, 10),
      lit ? pal.glow(rng.pick([pal.accent, 0xff2b3a, 0xffb347])) : pal.metal,
    );
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(-0.3 + (i % 3) * 0.3, 1.78 - Math.floor(i / 3) * 0.16, 0.08);
    g.add(lamp);
  }
  // Toggle switches.
  for (let i = 0; i < 4; i++) {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 8), pal.trim);
    plate.rotation.x = Math.PI / 2;
    plate.position.set(-0.33 + i * 0.22, 1.32, 0.075);
    g.add(plate);
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.09, 0.02), pal.metal);
    lever.position.set(-0.33 + i * 0.22, 1.32, 0.11);
    lever.rotation.x = rng.chance(0.5) ? 0.5 : -0.5;
    g.add(lever);
  }
  // Big dial.
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 14), pal.trim);
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0.24, 1.05, 0.08);
  g.add(dial);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.08, 0.01), pal.metal);
  needle.position.set(0.24, 1.06, 0.105);
  needle.rotation.z = rng.jitter(1.2);
  g.add(needle);
  // Conduit feeding the box from above.
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 8), pal.metal);
  feed.position.set(-0.3, 2.4, 0);
  g.add(feed);
  return g;
}

/** Pump assembly: motor, volute, and flanged pipework. */
export function pumpAssembly(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const skid = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.6), pal.trim);
  skid.position.y = 0.04;
  g.add(skid);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.55, 14), pal.body);
  motor.rotation.z = Math.PI / 2;
  motor.position.set(-0.2, 0.3, 0);
  motor.castShadow = true;
  g.add(motor);
  const volute = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.2, 14), pal.metal);
  volute.rotation.x = Math.PI / 2;
  volute.position.set(0.28, 0.3, 0);
  g.add(volute);
  // Discharge pipe rising with flanges.
  const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 10), pal.metal);
  riser.position.set(0.28, 0.85, 0);
  g.add(riser);
  for (const y of [0.5, 1.05 + rng.jitter(0.1)]) {
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 10), pal.trim);
    flange.position.set(0.28, y, 0);
    g.add(flange);
  }
  return g;
}

/** A chained row of pressurised gas cylinders against a rail. */
export function gasCylinders(rng: Rng, pal: Palette, opts: { count?: number } = {}): THREE.Group {
  const count = opts.count ?? 4;
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const x = (i - (count - 1) / 2) * 0.32;
    const h = rng.range(1.2, 1.45);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, h, 12), i % 2 ? pal.body : pal.trim);
    tank.position.set(x, h / 2, rng.jitter(0.04));
    tank.castShadow = true;
    g.add(tank);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), tank.material);
    shoulder.position.set(x, h, tank.position.z);
    g.add(shoulder);
    const valve = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.05), pal.metal);
    valve.position.set(x, h + 0.15, tank.position.z);
    g.add(valve);
  }
  // Restraint rail across the row.
  const rail = new THREE.Mesh(new THREE.BoxGeometry(count * 0.32 + 0.1, 0.05, 0.03), pal.metal);
  rail.position.set(0, 0.9, 0.15);
  g.add(rail);
  return g;
}

/**
 * Industrial wall fan in a ring shroud. Returns the rotor so rooms can spin
 * it (`rotor.rotation.z += delta * speed`). Facing +Z.
 */
export function coolingFan(
  pal: Palette,
  opts: { radius?: number } = {},
): { group: THREE.Group; rotor: THREE.Group } {
  const radius = opts.radius ?? 0.5;
  const group = new THREE.Group();
  const shroud = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.06, 8, 24), pal.trim);
  shroud.position.y = radius + 0.3;
  group.add(shroud);
  const rotor = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 10), pal.metal);
  hub.rotation.x = Math.PI / 2;
  rotor.add(hub);
  for (let i = 0; i < 5; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, radius - 0.12, 0.02), pal.metal);
    blade.position.y = (radius - 0.02) / 2;
    blade.rotation.y = 0.6;
    const arm = new THREE.Group();
    arm.add(blade);
    arm.rotation.z = (i / 5) * Math.PI * 2;
    rotor.add(arm);
  }
  rotor.position.y = radius + 0.3;
  group.add(rotor);
  // Grille bars.
  for (const a of [0, Math.PI / 3, -Math.PI / 3]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(radius * 2, 0.02, 0.02), pal.trim);
    bar.position.set(0, radius + 0.3, 0.09);
    bar.rotation.z = a;
    group.add(bar);
  }
  return { group, rotor };
}
