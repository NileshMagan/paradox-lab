import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Laboratory equipment — bench science for research-wing rooms. Glow accents
 * use pal.glow() so specimen colours follow the room's theme. Origins on the
 * floor; benchtop items sit at y = 0 so they can be placed on any surface.
 */

/** Desk microscope: base, arm, tube, stage. */
export function microscope(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.22), pal.metal);
  base.position.y = 0.015;
  g.add(base);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.24, 8), pal.metal);
  arm.position.set(0, 0.15, -0.07);
  arm.rotation.x = 0.35;
  g.add(arm);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.16, 10), pal.trim);
  tube.position.set(0, 0.24, 0.01);
  tube.rotation.x = -0.15;
  g.add(tube);
  const stage = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.1), pal.body);
  stage.position.set(0, 0.12, 0.02);
  g.add(stage);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.025, 8), pal.trim);
  knob.rotation.z = Math.PI / 2;
  knob.position.set(0.055, 0.16 + rng.jitter(0.01), -0.04);
  g.add(knob);
  return g;
}

/** Bunsen stand: tripod, gauze, flask over a teardrop flame. */
export function burnerRig(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.09, 10), pal.metal);
  burner.position.y = 0.045;
  g.add(burner);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.26, 5), pal.trim);
    leg.position.set(Math.cos(a) * 0.09, 0.13, Math.sin(a) * 0.09);
    leg.rotation.z = Math.cos(a) * 0.28;
    leg.rotation.x = -Math.sin(a) * 0.28;
    g.add(leg);
  }
  const gauze = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.006, 0.14), pal.metal);
  gauze.position.y = 0.26;
  g.add(gauze);
  // Flame between burner and gauze — the flask reads "in use".
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.09, 8), pal.glow(0x9fd8ff));
  flame.position.y = 0.14;
  g.add(flame);
  const flask = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 9), pal.glass);
  flask.position.y = 0.33;
  flask.scale.y = 0.85;
  g.add(flask);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.09, 8), pal.glass);
  neck.position.y = 0.42;
  g.add(neck);
  const contents = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), pal.glow());
  contents.position.y = 0.31;
  contents.scale.y = 0.6 + rng.next() * 0.2;
  g.add(contents);
  return g;
}

/** Glass jars with softly glowing preserved contents. */
export function specimenJars(rng: Rng, pal: Palette, opts: { count?: number } = {}): THREE.Group {
  const count = opts.count ?? 4;
  const g = new THREE.Group();
  const colors = [pal.accent, 0x39f0a0, 0xe344c4, 0xffb347];
  for (let i = 0; i < count; i++) {
    const r = rng.range(0.05, 0.08);
    const h = rng.range(0.16, 0.28);
    const x = (i - (count - 1) / 2) * 0.19 + rng.jitter(0.02);
    const z = rng.jitter(0.05);
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), pal.glass);
    jar.position.set(x, h / 2, z);
    g.add(jar);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.008, r + 0.008, 0.02, 12), pal.metal);
    lid.position.set(x, h + 0.01, z);
    g.add(lid);
    // The specimen: an off-centre blob, faintly luminous.
    const blob = new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 8, 6), pal.glow(rng.pick(colors)));
    blob.position.set(x + rng.jitter(0.01), h * rng.range(0.3, 0.6), z);
    blob.scale.set(1, rng.range(0.7, 1.4), 0.8);
    g.add(blob);
  }
  return g;
}

/** Bench fume hood. `sash` is the glass front, sliding in y (found part-open). */
export function fumeHood(rng: Rng, pal: Palette): { group: THREE.Group; sash: THREE.Mesh } {
  const group = new THREE.Group();
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, 0.7), pal.body);
  bench.position.y = 0.425;
  bench.castShadow = true;
  group.add(bench);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 0.7), pal.trim);
  hood.position.y = 1.38;
  hood.castShadow = true;
  group.add(hood);
  // Hollow the mouth with a dark inset.
  const cavity = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.8), pal.metal);
  cavity.position.set(0, 1.36, 0.352);
  group.add(cavity);
  const sash = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.85, 0.02), pal.glass);
  sash.position.set(0, 1.05 + rng.next() * 0.35, 0.37); // slid part-way up
  group.add(sash);
  const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 10), pal.metal);
  duct.position.set(0.3, 2.1, -0.1);
  group.add(duct);
  return { group, sash };
}

/** Tall specimen fridge: glass door, glowing shelf strip. */
export function sampleFridge(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.9, 0.7), pal.body);
  shell.position.y = 0.95;
  shell.castShadow = true;
  g.add(shell);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.02), pal.glass);
  door.position.set(0, 1.0, 0.36);
  g.add(door);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.03), pal.metal);
  handle.position.set(0.28, 1.1, 0.39);
  g.add(handle);
  // Interior glow strip sells "powered cold storage" without a light.
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.02), pal.glow(0xdfe9ff));
  strip.position.set(0, 1.72, 0.32);
  g.add(strip);
  for (let s = 0; s < 3; s++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.015, 0.5), pal.trim);
    shelf.position.set(0, 0.6 + s * 0.4, 0.05);
    g.add(shelf);
    if (rng.chance(0.8)) {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(rng.range(0.15, 0.35), 0.1, 0.2), pal.soft);
      rack.position.set(rng.jitter(0.15), 0.66 + s * 0.4, 0.05);
      g.add(rack);
    }
  }
  return g;
}

/** Two-row rack of slim test tubes, a few tinted by glowing contents. */
export function testTubeRack(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.025, 0.14), pal.body);
  base.position.y = 0.0125;
  g.add(base);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.015, 0.14), pal.body);
  top.position.y = 0.12;
  g.add(top);
  for (const x of [-0.16, 0.16]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.02), pal.trim);
    post.position.set(x, 0.06, 0);
    g.add(post);
  }
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 6; i++) {
      if (rng.chance(0.2)) continue; // empty slots read as "samples taken"
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.15, 8), pal.glass);
      tube.position.set(-0.14 + i * 0.055, 0.1, -0.035 + row * 0.07);
      g.add(tube);
      if (rng.chance(0.5)) {
        const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.05, 6), pal.glow());
        fill.position.set(tube.position.x, 0.06, tube.position.z);
        g.add(fill);
      }
    }
  }
  return g;
}

/** Horizontal autoclave drum. `latch` is the door wheel, spinning about z. */
export function autoclave(rng: Rng, pal: Palette): { group: THREE.Group; latch: THREE.Group } {
  const group = new THREE.Group();
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.6), pal.trim);
  stand.position.y = 0.225;
  group.add(stand);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.85, 18), pal.body);
  drum.rotation.z = Math.PI / 2;
  drum.position.y = 0.75;
  drum.castShadow = true;
  group.add(drum);
  const doorDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 18), pal.metal);
  doorDisc.rotation.z = Math.PI / 2;
  doorDisc.position.set(0.45, 0.75, 0);
  group.add(doorDisc);
  const latch = new THREE.Group();
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 16), pal.trim);
  latch.add(wheel);
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.02), pal.trim);
    spoke.rotation.z = (i * Math.PI) / 3;
    latch.add(spoke);
  }
  latch.rotation.y = Math.PI / 2;
  latch.position.set(0.49, 0.75, 0);
  latch.rotation.z = rng.angle();
  group.add(latch);
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12), pal.metal);
  gauge.rotation.x = Math.PI / 2;
  gauge.position.set(-0.1, 1.06, 0.12);
  group.add(gauge);
  return { group, latch };
}

/** Leaning stacks of petri dishes, a couple of cultures glowing. */
export function petriStack(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.3), pal.trim);
  tray.position.y = 0.01;
  g.add(tray);
  const stacks = 3;
  for (let s = 0; s < stacks; s++) {
    const n = 2 + rng.int(5);
    const x = -0.15 + s * 0.15;
    for (let i = 0; i < n; i++) {
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.014, 14), pal.glass);
      dish.position.set(x + rng.jitter(0.008), 0.03 + i * 0.016, rng.jitter(0.008));
      g.add(dish);
      if (rng.chance(0.25)) {
        const culture = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.006, 12), pal.glow());
        culture.position.copy(dish.position);
        g.add(culture);
      }
    }
  }
  return g;
}

/** Precision scale: base, pan, glowing readout. */
export function labScale(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.3), pal.body);
  base.position.y = 0.03;
  g.add(base);
  const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.015, 14), pal.metal);
  pan.position.set(0, 0.09, -0.03);
  g.add(pan);
  const readout = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.035), pal.glow());
  readout.position.set(0, 0.055, 0.152);
  readout.rotation.x = -0.25;
  g.add(readout);
  const button = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 8), pal.trim);
  button.rotation.x = Math.PI / 2;
  button.position.set(0.07 + rng.jitter(0.01), 0.045, 0.152);
  g.add(button);
  return g;
}

/** Wall shelf of chemical bottles with diamond hazard labels. */
export function chemicalShelf(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.26), pal.body);
  shelf.position.set(0, 1.25, 0.13);
  shelf.castShadow = true;
  g.add(shelf);
  for (const side of [-0.5, 0.5]) {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.2), pal.trim);
    bracket.position.set(side, 1.15, 0.1);
    g.add(bracket);
  }
  let x = -0.48;
  while (x < 0.44) {
    const r = rng.range(0.03, 0.06);
    const h = rng.range(0.12, 0.26);
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 10), rng.chance(0.6) ? pal.glass : pal.trim);
    bottle.position.set(x + r, 1.27 + h / 2, 0.13);
    g.add(bottle);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, 0.02, 8), pal.metal);
    cap.position.set(x + r, 1.28 + h, 0.13);
    g.add(cap);
    // Hazard diamond on the fatter bottles.
    if (r > 0.045) {
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.045), pal.glow(0xffb347));
      label.position.set(x + r, 1.27 + h * 0.5, 0.13 + r + 0.002);
      label.rotation.z = Math.PI / 4;
      g.add(label);
    }
    x += r * 2 + rng.range(0.015, 0.05);
  }
  return g;
}
