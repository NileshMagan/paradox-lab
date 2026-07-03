import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Puzzle input devices. Every builder returns named handles (meshes/groups/
 * materials) so puzzle logic can animate and read them — the same pattern the
 * dressed rooms use for valves and levers. Handles document their axis and
 * sensible range. Wall props face +Z with origin at the wall base; floor
 * props sit at y = 0.
 */

/**
 * Wall keypad. `keys` is in reading order: 1-9, then *, 0, #. Press = nudge a
 * key mesh in -z a few mm. `screenMaterial` is a private glow for feedback.
 */
export function keypad(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; keys: THREE.Mesh[]; screenMaterial: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.46, 0.04), pal.body);
  plate.position.set(0, 1.35, 0);
  group.add(plate);
  const screenMaterial = pal.glow().clone();
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.06), screenMaterial);
  screen.position.set(0, 1.52, 0.022);
  screen.userData.disposeMaterial = true;
  group.add(screen);
  const keys: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    const key = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.02), pal.metal);
    key.position.set(-0.08 + (i % 3) * 0.08, 1.44 - Math.floor(i / 3) * 0.07, 0.028);
    key.rotation.z = rng.jitter(0.01); // hand-worn, not machine-fresh
    group.add(key);
    keys.push(key);
  }
  return { group, keys, screenMaterial };
}

/** Safe-style dial on a wall plate. `dial` spins about z; index mark at top. */
export function combinationDial(rng: Rng, pal: Palette): { group: THREE.Group; dial: THREE.Group } {
  const group = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.04), pal.body);
  plate.position.set(0, 1.4, 0);
  group.add(plate);
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.05, 0.01), pal.glow());
  mark.position.set(0, 1.58, 0.025);
  group.add(mark);
  const dial = new THREE.Group();
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 24), pal.metal);
  wheel.rotation.x = Math.PI / 2;
  dial.add(wheel);
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.012, i % 5 === 0 ? 0.035 : 0.02, 0.02), pal.trim);
    tooth.position.set(Math.sin(a) * 0.125, Math.cos(a) * 0.125, 0.02);
    tooth.rotation.z = -a;
    dial.add(tooth);
  }
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 10), pal.trim);
  knob.rotation.x = Math.PI / 2;
  knob.position.z = 0.045;
  dial.add(knob);
  dial.position.set(0, 1.4, 0.03);
  dial.rotation.z = rng.angle();
  group.add(dial);
  return { group, dial };
}

/**
 * Three concentric symbol rings on a wall boss (mural-alignment puzzles).
 * `rings` is outer→inner; each rotates about z.
 */
export function rotaryRings(rng: Rng, pal: Palette): { group: THREE.Group; rings: THREE.Group[] } {
  const group = new THREE.Group();
  const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 28), pal.body);
  boss.rotation.x = Math.PI / 2;
  boss.position.set(0, 1.5, 0);
  group.add(boss);
  const rings: THREE.Group[] = [];
  [0.44, 0.32, 0.2].forEach((radius, depth) => {
    const ring = new THREE.Group();
    const band = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.035, 8, 28), depth % 2 ? pal.trim : pal.metal);
    ring.add(band);
    // Eight raised symbol bumps; one per ring is glowing — the "pointer".
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const glyph = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.045, 0.03),
        i === 0 ? pal.glow() : pal.body,
      );
      glyph.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.03);
      glyph.rotation.z = a;
      ring.add(glyph);
    }
    ring.position.set(0, 1.5, 0.03 + depth * 0.012);
    ring.rotation.z = rng.angle();
    group.add(ring);
    rings.push(ring);
  });
  return { group, rings };
}

/** Floor console of heavy levers. Each lever pivots about x, range ±0.6 rad. */
export function leverBank(
  rng: Rng,
  pal: Palette,
  opts: { levers?: number } = {},
): { group: THREE.Group; levers: THREE.Group[] } {
  const count = opts.levers ?? 4;
  const group = new THREE.Group();
  const chest = new THREE.Mesh(new THREE.BoxGeometry(count * 0.24 + 0.16, 0.85, 0.5), pal.body);
  chest.position.y = 0.425;
  chest.castShadow = true;
  group.add(chest);
  const levers: THREE.Group[] = [];
  for (let i = 0; i < count; i++) {
    const x = (i - (count - 1) / 2) * 0.24;
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.34), pal.trim);
    slot.position.set(x, 0.86, 0);
    group.add(slot);
    const lever = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.4, 8).translate(0, 0.2, 0), pal.metal);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), pal.trim);
    ball.position.y = 0.4;
    lever.add(arm, ball);
    lever.position.set(x, 0.86, 0);
    lever.rotation.x = rng.chance(0.5) ? 0.5 : -0.5;
    group.add(lever);
    levers.push(lever);
  }
  return { group, levers };
}

/**
 * Simon-style wall panel of big round buttons, each with its own glow clone
 * (`lampMaterials[i]` lights `buttons[i]`).
 */
export function sequenceButtons(
  rng: Rng,
  pal: Palette,
  opts: { count?: number } = {},
): { group: THREE.Group; buttons: THREE.Mesh[]; lampMaterials: THREE.MeshStandardMaterial[] } {
  const count = opts.count ?? 5;
  const group = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(count * 0.17 + 0.12, 0.3, 0.05), pal.body);
  plate.position.set(0, 1.4, 0);
  group.add(plate);
  const palette = [pal.accent, 0xff2b3a, 0xffb347, 0x2bff88, 0xe344c4];
  const buttons: THREE.Mesh[] = [];
  const lampMaterials: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < count; i++) {
    const mat = pal.glow(palette[i % palette.length]).clone();
    mat.emissiveIntensity = 0.35; // idle; puzzle logic flares it
    const button = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.04, 16), mat);
    button.rotation.x = Math.PI / 2;
    button.position.set((i - (count - 1) / 2) * 0.17, 1.4 + rng.jitter(0.004), 0.04);
    button.userData.disposeMaterial = true;
    group.add(button);
    buttons.push(button);
    lampMaterials.push(mat);
  }
  return { group, buttons, lampMaterials };
}

/**
 * Open fuse panel with slack coloured wires between two terminal columns
 * (cut/reroute puzzles). `door` hinges at its left edge about y.
 */
export function wireFusePanel(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; wires: THREE.Mesh[]; door: THREE.Mesh } {
  const group = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.1), pal.body);
  box.position.set(0, 1.35, 0);
  group.add(box);
  const doorGeo = new THREE.BoxGeometry(0.53, 0.68, 0.02).translate(0.265, 0, 0);
  const door = new THREE.Mesh(doorGeo, pal.trim);
  door.position.set(-0.265, 1.35, 0.06);
  door.rotation.y = -1.9 - rng.next() * 0.5; // found hanging open
  group.add(door);
  const wires: THREE.Mesh[] = [];
  const colors = [0xff2b3a, 0x2bff88, 0x1fd1ff, 0xffb347, 0xe344c4];
  const n = 4 + rng.int(2);
  for (let i = 0; i < n; i++) {
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 6), pal.metal);
      post.rotation.x = Math.PI / 2;
      post.position.set(side * 0.2, 1.6 - i * 0.12, 0.05);
      group.add(post);
    }
    // Wires cross to a shuffled row on the right — the puzzle is the mapping.
    const toRow = (i + 1 + rng.int(n - 1)) % n;
    const from = new THREE.Vector3(-0.2, 1.6 - i * 0.12, 0.06);
    const to = new THREE.Vector3(0.2, 1.6 - toRow * 0.12, 0.06);
    const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, -0.05 - rng.next() * 0.04, 0.03));
    const wire = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([from, mid, to]), 10, 0.008, 5),
      pal.glow(colors[i % colors.length]),
    );
    group.add(wire);
    wires.push(wire);
  }
  return { group, wires, door };
}

/** Wall crank with a fold-out handle. `crank` rotates about z. */
export function crankWheel(rng: Rng, pal: Palette): { group: THREE.Group; crank: THREE.Group } {
  const group = new THREE.Group();
  const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.08, 12), pal.body);
  boss.rotation.x = Math.PI / 2;
  boss.position.set(0, 1.25, 0.03);
  group.add(boss);
  const crank = new THREE.Group();
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.03).translate(0, 0.13, 0), pal.metal);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8), pal.trim);
  grip.position.set(0, 0.26, 0.06);
  crank.add(arm, grip);
  crank.position.set(0, 1.25, 0.08);
  crank.rotation.z = rng.angle();
  group.add(crank);
  return { group, crank };
}

/** Vertical wall rail with a grabbable knob. `knob` translates in y (0..travel). */
export function slideRail(
  pal: Palette,
  opts: { travel?: number } = {},
): { group: THREE.Group; knob: THREE.Group } {
  const travel = opts.travel ?? 1;
  const group = new THREE.Group();
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, travel + 0.2, 0.04), pal.body);
  rail.position.set(0, 0.9 + travel / 2, 0);
  group.add(rail);
  for (const y of [0.9, 0.9 + travel]) {
    const stop = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.05), pal.trim);
    stop.position.set(0, y, 0.01);
    group.add(stop);
  }
  const knob = new THREE.Group();
  const slider = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.05), pal.metal);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.07, 10), pal.trim);
  grip.rotation.x = Math.PI / 2;
  grip.position.z = 0.06;
  knob.add(slider, grip);
  knob.position.set(0, 0.9, 0.03); // bottom of travel
  group.add(knob);
  return { group, knob };
}

/** Floor pressure plate, proud of its frame by ~3 cm. `plate` depresses in y. */
export function pressurePlate(rng: Rng, pal: Palette): { group: THREE.Group; plate: THREE.Mesh } {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.8), pal.trim);
  frame.position.y = 0.025;
  group.add(frame);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.05, 0.64), pal.metal);
  plate.position.y = 0.075;
  plate.rotation.y = rng.jitter(0.01);
  group.add(plate);
  // Corner guide pins hint that it moves.
  for (const [px, pz] of [
    [-0.34, -0.34],
    [-0.34, 0.34],
    [0.34, -0.34],
    [0.34, 0.34],
  ]) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.09, 6), pal.body);
    pin.position.set(px, 0.045, pz);
    group.add(pin);
  }
  return { group, plate };
}

/**
 * Old telephone-style patch board: socket grid plus two live plugs dangling
 * on slack cables. Puzzle logic re-parents/re-aims `plugs` into `sockets`.
 */
export function patchBoard(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; plugs: THREE.Group[]; sockets: THREE.Mesh[] } {
  const group = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.06), pal.body);
  board.position.set(0, 1.4, 0);
  group.add(board);
  const sockets: THREE.Mesh[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 10), pal.metal);
      socket.rotation.x = Math.PI / 2;
      socket.position.set(-0.24 + c * 0.12, 1.53 - r * 0.13, 0.035);
      group.add(socket);
      sockets.push(socket);
    }
  }
  const plugs: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const anchor = new THREE.Vector3(side * 0.3, 1.14, 0.04);
    const plug = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.09, 8), pal.trim);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.04, 6), pal.metal);
    tip.position.y = 0.065;
    plug.add(body, tip);
    const droop = new THREE.Vector3(side * (0.32 + rng.next() * 0.1), 0.95 - rng.next() * 0.1, 0.06);
    plug.position.copy(droop);
    plug.rotation.z = side * (Math.PI / 2 + rng.jitter(0.4)); // hanging by its cable
    group.add(plug);
    plugs.push(plug);
    const cable = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          anchor,
          anchor.clone().add(new THREE.Vector3(side * 0.05, -0.12, 0.02)),
          droop,
        ]),
        8,
        0.007,
        5,
      ),
      pal.trim,
    );
    group.add(cable);
  }
  return { group, plugs, sockets };
}
