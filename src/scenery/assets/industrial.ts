import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Heavy industrial — workshop and plant-floor dressing. Origins on the floor;
 * the two CEILING builders (chainHoist, pipeBridge) hang into -Y from y = 0.
 */

/** Belt conveyor on legs. `rollers` (the exposed end rollers) rotate about x... their local z-axis after the Math.PI/2 z-rotation; spin with `roller.rotation.y += delta`. */
export function conveyorSegment(
  rng: Rng,
  pal: Palette,
  opts: { length?: number } = {},
): { group: THREE.Group; rollers: THREE.Mesh[] } {
  const length = opts.length ?? 2.4;
  const group = new THREE.Group();
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, length), pal.soft);
  belt.position.y = 0.72;
  group.add(belt);
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, length + 0.16), pal.trim);
    rail.position.set(side * 0.33, 0.72, 0);
    group.add(rail);
  }
  const legs = Math.max(2, Math.round(length / 1.1));
  for (let i = 0; i < legs; i++) {
    const z = -length / 2 + 0.2 + (i / (legs - 1)) * (length - 0.4);
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.68, 0.06), pal.metal);
      leg.position.set(side * 0.3, 0.34, z);
      leg.rotation.z = side * 0.08;
      group.add(leg);
    }
  }
  const rollers: THREE.Mesh[] = [];
  for (const z of [-length / 2 - 0.02, length / 2 + 0.02]) {
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.58, 12), pal.metal);
    roller.rotation.z = Math.PI / 2;
    roller.position.set(0, 0.7, z);
    roller.rotation.y = rng.angle();
    group.add(roller);
    rollers.push(roller);
  }
  return { group, rollers };
}

/** CEILING: beam trolley with a hanging chain and hook. `hook` translates in y. */
export function chainHoist(rng: Rng, pal: Palette): { group: THREE.Group; hook: THREE.Group } {
  const group = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.12), pal.metal);
  beam.position.y = -0.08;
  group.add(beam);
  const trolley = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.24), pal.trim);
  trolley.position.y = -0.24;
  group.add(trolley);
  const drop = 1 + rng.next() * 0.4;
  // Chain: alternating small tori read as links without real cost.
  for (let i = 0; i < Math.round(drop / 0.08); i++) {
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 5, 8), pal.metal);
    link.position.y = -0.34 - i * 0.08;
    link.rotation.y = (i % 2) * (Math.PI / 2);
    link.rotation.x = Math.PI / 2;
    group.add(link);
  }
  const hook = new THREE.Group();
  const block = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.1), pal.trim);
  const curl = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 8, 12, Math.PI * 1.4), pal.metal);
  curl.position.y = -0.16;
  curl.rotation.z = Math.PI * 0.8;
  hook.add(block, curl);
  hook.position.y = -0.44 - drop;
  group.add(hook);
  return { group, hook };
}

/** Sturdy workbench with a bolted vice, jaw slightly open. */
export function workbenchVice(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.09, 0.7), pal.body);
  top.position.y = 0.85;
  top.castShadow = true;
  g.add(top);
  for (const [x, z] of [
    [-0.65, -0.25],
    [-0.65, 0.25],
    [0.65, -0.25],
    [0.65, 0.25],
  ]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.81, 0.09), pal.trim);
    leg.position.set(x, 0.4, z);
    g.add(leg);
  }
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.6), pal.trim);
  shelf.position.y = 0.25;
  g.add(shelf);
  // The vice: fixed jaw, screw, moving jaw open a knuckle's width.
  const fixed = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.1), pal.metal);
  fixed.position.set(0.5, 0.96, 0.28);
  g.add(fixed);
  const gap = 0.03 + rng.next() * 0.04;
  const moving = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.06), pal.metal);
  moving.position.set(0.5, 0.96, 0.28 + 0.08 + gap);
  g.add(moving);
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.24, 8), pal.trim);
  screw.rotation.x = Math.PI / 2;
  screw.position.set(0.5, 0.93, 0.36);
  g.add(screw);
  const tommy = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 6), pal.trim);
  tommy.rotation.z = Math.PI / 2;
  tommy.position.set(0.5, 0.93, 0.48);
  g.add(tommy);
  return g;
}

/** Pegboard of hung tools; painted outlines mark two MISSING tools (a clue). */
export function toolWall(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 0.04), pal.body);
  board.position.set(0, 1.45, 0);
  g.add(board);
  const slots: Array<[number, number]> = [];
  for (let c = 0; c < 5; c++) for (let r = 0; r < 2; r++) slots.push([-0.5 + c * 0.25, 1.65 - r * 0.42]);
  const missing = new Set([rng.int(slots.length), rng.int(slots.length)]);
  slots.forEach(([x, y], i) => {
    if (missing.has(i)) {
      // Painted outline where a tool should hang — players notice absence.
      const outline = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.3), pal.glow(0xffb347));
      outline.position.set(x, y - 0.12, 0.022);
      g.add(outline);
      return;
    }
    const kind = rng.int(3);
    if (kind === 0) {
      // Wrench: shaft + open head.
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.26, 0.02), pal.metal);
      shaft.position.set(x, y - 0.13, 0.035);
      const head = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.012, 6, 10, Math.PI * 1.5), pal.metal);
      head.position.set(x, y, 0.035);
      g.add(shaft, head);
    } else if (kind === 1) {
      // Hammer.
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.28, 0.02), pal.trim);
      handle.position.set(x, y - 0.14, 0.035);
      const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.045, 0.04), pal.metal);
      headBox.position.set(x, y, 0.035);
      g.add(handle, headBox);
    } else {
      // Snips: two crossed blades.
      for (const s of [-1, 1]) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.24, 0.015), pal.metal);
        blade.position.set(x, y - 0.1, 0.035);
        blade.rotation.z = s * 0.16;
        g.add(blade);
      }
    }
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 6), pal.trim);
    peg.rotation.x = Math.PI / 2;
    peg.position.set(x, y + 0.04, 0.03);
    g.add(peg);
  });
  return g;
}

/** Squat furnace with a glowing mouth. `mouthMaterial` flickers well. */
export function furnaceBox(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; mouthMaterial: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.9), pal.body);
  body.position.y = 0.6;
  body.castShadow = true;
  group.add(body);
  const mouthMaterial = pal.glow(0xff5a2b).clone();
  mouthMaterial.emissiveIntensity = 2;
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.34), mouthMaterial);
  mouth.position.set(0, 0.5, 0.452);
  mouth.userData.disposeMaterial = true;
  group.add(mouth);
  const doorFrameBar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.44, 0.03), pal.metal);
  doorFrameBar.position.set(0, 0.5, 0.44);
  group.add(doorFrameBar);
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.9, 10), pal.metal);
  chimney.position.set(0.3, 1.65, -0.2);
  group.add(chimney);
  // Rivet studs down the front corners.
  for (const x of [-0.5, 0.5]) {
    for (let i = 0; i < 4; i++) {
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), pal.trim);
      rivet.position.set(x, 0.2 + i * 0.28 + rng.jitter(0.01), 0.452);
      group.add(rivet);
    }
  }
  return { group, mouthMaterial };
}

/** Anvil on a stump, hammer resting beside. */
export function anvilBlock(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.5, 12), pal.soft);
  stump.position.y = 0.25;
  g.add(stump);
  const waist = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.16), pal.metal);
  waist.position.y = 0.57;
  g.add(waist);
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.18), pal.metal);
  face.position.y = 0.69;
  face.castShadow = true;
  g.add(face);
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.24, 10), pal.metal);
  horn.rotation.z = Math.PI / 2;
  horn.position.set(0.36, 0.69, 0);
  g.add(horn);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), pal.trim);
  handle.rotation.z = 1.2 + rng.jitter(0.2);
  handle.position.set(-0.35, 0.08, 0.15);
  g.add(handle);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.05, 0.05), pal.metal);
  head.position.set(-0.48, 0.13, 0.15);
  g.add(head);
  return g;
}

/** Straight ladder leaning back ~15°, feet on the floor. */
export function leaningLadder(rng: Rng, pal: Palette, opts: { height?: number } = {}): THREE.Group {
  const height = opts.height ?? 2.6;
  const g = new THREE.Group();
  const lean = 0.26;
  const ladder = new THREE.Group();
  for (const side of [-0.2, 0.2]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, height, 0.035), pal.metal);
    rail.position.set(side, height / 2, 0);
    ladder.add(rail);
  }
  for (let i = 0, n = Math.round(height / 0.3); i < n; i++) {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.38, 6), pal.trim);
    rung.rotation.z = Math.PI / 2;
    rung.position.y = 0.2 + i * 0.3;
    ladder.add(rung);
  }
  ladder.rotation.x = -lean;
  ladder.rotation.y = rng.jitter(0.05);
  g.add(ladder);
  return g;
}

/** Two-lift scaffold tower with plank deck, one plank askew. */
export function scaffoldTower(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const W = 1.2;
  const D = 0.9;
  for (const [x, z] of [
    [-W / 2, -D / 2],
    [-W / 2, D / 2],
    [W / 2, -D / 2],
    [W / 2, D / 2],
  ]) {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 8), pal.metal);
    tube.position.set(x, 1.2, z);
    g.add(tube);
  }
  for (const y of [0.7, 1.5, 2.3]) {
    for (const z of [-D / 2, D / 2]) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, W, 6), pal.metal);
      rail.rotation.z = Math.PI / 2;
      rail.position.set(0, y, z);
      g.add(rail);
    }
  }
  // Cross brace: the X that makes it read scaffold, not shelf.
  for (const s of [-1, 1]) {
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, Math.hypot(W, 1.4), 6), pal.trim);
    brace.rotation.z = s * Math.atan2(1.4, W);
    brace.position.set(0, 1.4, D / 2 + 0.02);
    g.add(brace);
  }
  for (let i = 0; i < 3; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, 0.04, 0.24), pal.soft);
    const askew = i === 1;
    plank.position.set(askew ? rng.jitter(0.1) : 0, 1.52, -D / 3 + i * (D / 3));
    plank.rotation.y = askew ? rng.jitter(0.12) : 0;
    plank.castShadow = true;
    g.add(plank);
  }
  return g;
}

/** Wooden cable spool on its side with a loose tail of cable. */
export function cableReel(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const R = 0.45;
  for (const y of [0.06, 0.66]) {
    const cheek = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.07, 16), pal.soft);
    cheek.position.y = y;
    cheek.castShadow = true;
    g.add(cheek);
  }
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.55, 12), pal.soft);
  core.position.y = 0.36;
  g.add(core);
  // Wound cable: stacked tori around the core.
  for (let i = 0; i < 4; i++) {
    const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.18 + i * 0.025, 0.02, 6, 16), pal.trim);
    wrap.rotation.x = Math.PI / 2;
    wrap.position.y = 0.2 + (i % 3) * 0.14;
    g.add(wrap);
  }
  const tail = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.22, 0.2, 0),
        new THREE.Vector3(0.55, 0.05, rng.jitter(0.3)),
        new THREE.Vector3(0.95, 0.02, rng.jitter(0.5)),
      ]),
      10,
      0.02,
      6,
    ),
    pal.trim,
  );
  g.add(tail);
  return g;
}

/** CEILING: overhead pipe rack — hanger rods, tray, mixed-bore pipes along X. */
export function pipeBridge(rng: Rng, pal: Palette, opts: { span?: number } = {}): THREE.Group {
  const span = opts.span ?? 3;
  const g = new THREE.Group();
  for (const x of [-span / 2 + 0.3, span / 2 - 0.3]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), pal.metal);
    rod.position.set(x, -0.25, 0);
    g.add(rod);
  }
  const tray = new THREE.Mesh(new THREE.BoxGeometry(span, 0.04, 0.5), pal.trim);
  tray.position.y = -0.52;
  g.add(tray);
  let z = -0.18;
  for (let i = 0; i < 4 && z < 0.2; i++) {
    const r = rng.range(0.03, 0.08);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(r, r, span - rng.next() * 0.3, 10), pal.metal);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, -0.5 + r + 0.02, z + r);
    g.add(pipe);
    z += r * 2 + 0.04;
  }
  return g;
}
