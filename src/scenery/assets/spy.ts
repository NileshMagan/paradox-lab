import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Agent / spy thriller — heist and investigation set (pairs with the 'agency'
 * palette). Several builders return handles because these ARE puzzle
 * hardware: tripwires to weave through, a vault to crack, evidence to link.
 */

/**
 * Corridor of laser tripwires between two posts. `beams` are individual
 * meshes sharing one private glow (kill `beamMaterial.emissiveIntensity` or
 * hide beams as the puzzle disarms them).
 */
export function laserTripwires(
  rng: Rng,
  pal: Palette,
  opts: { span?: number; beams?: number } = {},
): { group: THREE.Group; beams: THREE.Mesh[]; beamMaterial: THREE.MeshStandardMaterial } {
  const span = opts.span ?? 2.2;
  const count = opts.beams ?? 5;
  const group = new THREE.Group();
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.9, 0.08), pal.trim);
    post.position.set((side * span) / 2, 0.95, 0);
    group.add(post);
    for (let i = 0; i < count; i++) {
      const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 8), pal.metal);
      emitter.rotation.z = Math.PI / 2;
      emitter.position.set((side * span) / 2 - side * 0.05, 0.25 + i * (1.5 / (count - 1)), rng.jitter(0.02));
      group.add(emitter);
    }
  }
  const beamMaterial = pal.glow(0xff2b3a).clone();
  beamMaterial.emissiveIntensity = 2.4;
  const beams: THREE.Mesh[] = [];
  for (let i = 0; i < count; i++) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(span - 0.1, 0.012, 0.012), beamMaterial);
    beam.position.set(0, 0.25 + i * (1.5 / (count - 1)), rng.jitter(0.02));
    beam.rotation.z = rng.jitter(0.03); // slightly skewed grid = harder to duck
    beam.userData.disposeMaterial = i === 0;
    group.add(beam);
    beams.push(beam);
  }
  return { group, beams, beamMaterial };
}

/**
 * Hero piece: circular vault door in a frame. `door` swings about y at its
 * hinge; `wheel` spins about z; `bolts` slide outward as it unlocks.
 */
export function vaultDoor(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; door: THREE.Group; wheel: THREE.Group; bolts: THREE.Mesh[] } {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.5, 0.3), pal.body);
  frame.position.y = 1.25;
  frame.castShadow = true;
  group.add(frame);
  const portal = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.32, 28), pal.trim);
  portal.rotation.x = Math.PI / 2;
  portal.position.set(0, 1.25, 0.02);
  group.add(portal);
  const door = new THREE.Group();
  const leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.22, 28), pal.metal);
  leaf.rotation.x = Math.PI / 2;
  leaf.position.x = 0.88; // hinge at the door group origin, leaf offset
  door.add(leaf);
  const bolts: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8), pal.trim);
    bolt.rotation.z = Math.PI / 2;
    bolt.rotation.y = a;
    bolt.position.set(0.88 + Math.cos(a) * 0.8, Math.sin(a) * 0.8, 0);
    door.add(bolt);
    bolts.push(bolt);
  }
  const wheel = new THREE.Group();
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 18), pal.trim));
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.04, 0.04), pal.trim);
    spoke.rotation.z = (i * Math.PI) / 3;
    wheel.add(spoke);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 10), pal.metal);
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);
  wheel.position.set(0.88, 0, 0.16);
  wheel.rotation.z = rng.angle();
  door.add(wheel);
  door.position.set(-0.88, 1.25, 0.15);
  door.rotation.y = rng.chance(0.35) ? 0.9 : 0; // occasionally cracked open
  group.add(door);
  return { group, door, wheel, bolts };
}

/** Investigation board: pinned notes linked by red string. A clue machine. */
export function evidenceBoard(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.05), pal.trim);
  board.position.set(0, 1.5, 0);
  g.add(board);
  const cork = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), pal.soft);
  cork.position.set(0, 1.5, 0.028);
  g.add(cork);
  // Pinned items at seeded spots; remember them to run the string through.
  const pins: THREE.Vector3[] = [];
  const items = 6 + rng.int(4);
  for (let i = 0; i < items; i++) {
    const x = rng.jitter(0.62);
    const y = 1.5 + rng.jitter(0.4);
    const isPhoto = rng.chance(0.5);
    const item = new THREE.Mesh(
      new THREE.PlaneGeometry(isPhoto ? 0.16 : 0.13, isPhoto ? 0.13 : 0.17),
      isPhoto ? pal.metal : pal.glass,
    );
    item.position.set(x, y, 0.034);
    item.rotation.z = rng.jitter(0.25);
    g.add(item);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), pal.glow(0xff2b3a));
    pin.position.set(x, y + 0.05, 0.042);
    g.add(pin);
    pins.push(pin.position.clone());
  }
  // Red string connecting pins in a seeded tour.
  const stringMat = new THREE.MeshStandardMaterial({ color: 0xc22b2b, roughness: 0.9 });
  for (let i = 0; i < pins.length - 1; i++) {
    const from = pins[i];
    const to = pins[i + 1 + rng.int(Math.max(1, pins.length - i - 1))] ?? pins[i + 1];
    const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, -0.02, 0.004));
    const thread = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([from, mid, to]), 6, 0.004, 4),
      stringMat,
    );
    thread.userData.disposeMaterial = i === 0;
    g.add(thread);
  }
  return g;
}

/** Desk strewn with dossiers, a desk lamp pooled over the working file. */
export function dossierTable(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.8), pal.body);
  top.position.y = 0.75;
  top.castShadow = true;
  g.add(top);
  for (const [x, z] of [
    [-0.6, -0.3],
    [0.6, -0.3],
    [-0.6, 0.3],
    [0.6, 0.3],
  ]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.73, 0.06), pal.trim);
    leg.position.set(x, 0.365, z);
    g.add(leg);
  }
  // Folder stacks + one open file.
  for (let i = 0, n = 3 + rng.int(3); i < n; i++) {
    const stack = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, rng.range(0.02, 0.09), 0.32),
      rng.chance(0.5) ? pal.soft : pal.metal,
    );
    stack.position.set(rng.jitter(0.55), 0.78 + stack.geometry.parameters.height / 2, rng.jitter(0.25));
    stack.rotation.y = rng.jitter(0.4);
    g.add(stack);
  }
  const openFile = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), pal.glass);
  openFile.rotation.x = -Math.PI / 2;
  openFile.position.set(0.15, 0.78, 0.12);
  openFile.rotation.z = rng.jitter(0.2);
  g.add(openFile);
  // Banker's lamp.
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.3, 8), pal.metal);
  stem.position.set(-0.5, 0.92, -0.2);
  g.add(stem);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.09, 10, 1, true), pal.trim);
  shade.position.set(-0.42, 1.06, -0.15);
  shade.rotation.z = -0.4;
  g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), pal.glow(0xffe2b0));
  bulb.position.set(-0.4, 1.04, -0.14);
  g.add(bulb);
  return g;
}

/** Field briefcase. `lid` hinges at the back about x; foam cutouts inside. */
export function briefcase(rng: Rng, pal: Palette): { group: THREE.Group; lid: THREE.Group } {
  const group = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.4), pal.body);
  shell.position.y = 0.06;
  group.add(shell);
  // Foam interior with equipment cutouts.
  const foam = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.35), pal.soft);
  foam.position.y = 0.125;
  group.add(foam);
  for (let i = 0; i < 3; i++) {
    const cut = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, rng.range(0.08, 0.22)), pal.trim);
    cut.position.set(-0.15 + i * 0.15, 0.135, rng.jitter(0.05));
    group.add(cut);
  }
  const lid = new THREE.Group();
  const lidShell = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.4).translate(0, 0.05, 0.2), pal.body);
  lid.add(lidShell);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.014, 6, 10, Math.PI), pal.trim);
  handle.position.set(0, 0.06, 0.41);
  lid.add(handle);
  lid.position.set(0, 0.12, -0.2);
  lid.rotation.x = -(1.6 + rng.jitter(0.3)); // found open
  group.add(lid);
  for (const x of [-0.18, 0.18]) {
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.02), pal.metal);
    latch.position.set(x, 0.1, 0.2);
    group.add(latch);
  }
  return { group, lid };
}

/** Reel-to-reel listening post with headphones. `reels` spin about z. */
export function listeningPost(rng: Rng, pal: Palette): { group: THREE.Group; reels: THREE.Mesh[] } {
  const group = new THREE.Group();
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.6), pal.body);
  desk.position.y = 0.35;
  group.add(desk);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.14), pal.trim);
  deck.position.set(-0.1, 0.95, -0.1);
  deck.rotation.x = -0.25;
  group.add(deck);
  const reels: THREE.Mesh[] = [];
  for (const x of [-0.28, 0.08]) {
    const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 16), pal.metal);
    reel.rotation.x = Math.PI / 2 - 0.25;
    reel.position.set(x - 0.1, 1.03, -0.02);
    group.add(reel);
    reels.push(reel);
    const tape = new THREE.Mesh(new THREE.CylinderGeometry(rng.range(0.05, 0.09), 0.05, 0.015, 14), pal.body);
    tape.rotation.x = Math.PI / 2 - 0.25;
    tape.position.copy(reel.position).add(new THREE.Vector3(0, 0.003, 0.012));
    group.add(tape);
  }
  const vu = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.07), pal.glow(0xffb347));
  vu.position.set(0.22, 0.98, -0.028);
  vu.rotation.x = -0.25;
  group.add(vu);
  // Headphones dropped on the desk.
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.014, 6, 12, Math.PI), pal.trim);
  band.position.set(0.32, 0.73, 0.18);
  band.rotation.x = Math.PI / 2 + rng.jitter(0.3);
  group.add(band);
  for (const side of [-0.09, 0.09]) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 10), pal.body);
    cup.rotation.z = Math.PI / 2;
    cup.position.set(0.32 + side, 0.73, 0.18);
    group.add(cup);
  }
  return { group, reels };
}

/** Disguise rack: coats, hats, and one conspicuous empty hanger. */
export function disguiseRack(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  for (const x of [-0.6, 0.6]) {
    const upright = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.7, 8), pal.metal);
    upright.position.set(x, 0.85, 0);
    g.add(upright);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.5), pal.trim);
    foot.position.set(x, 0.015, 0);
    g.add(foot);
  }
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.24, 8), pal.metal);
  rail.rotation.z = Math.PI / 2;
  rail.position.y = 1.68;
  g.add(rail);
  const slots = 5;
  const empty = rng.int(slots);
  for (let i = 0; i < slots; i++) {
    const x = -0.48 + i * 0.24;
    const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.015), pal.trim);
    hanger.position.set(x, 1.6, 0);
    g.add(hanger);
    if (i === empty) continue; // the disguise that's already in use
    if (rng.chance(0.6)) {
      const coat = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.75, 0.1), pal.soft);
      coat.position.set(x, 1.2, 0);
      coat.rotation.y = rng.jitter(0.1);
      coat.castShadow = true;
      g.add(coat);
    } else {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.015, 12), pal.body);
      brim.position.set(x, 1.56, 0);
      g.add(brim);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.09, 12), pal.body);
      crown.position.set(x, 1.61, 0);
      g.add(crown);
    }
  }
  return g;
}

/** Map table with a glowing route line and pushpin markers. */
export function mapTable(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1), pal.body);
  top.position.y = 0.85;
  top.castShadow = true;
  g.add(top);
  for (const [x, z] of [
    [-0.65, -0.4],
    [0.65, -0.4],
    [-0.65, 0.4],
    [0.65, 0.4],
  ]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.83, 0.08), pal.trim);
    leg.position.set(x, 0.415, z);
    g.add(leg);
  }
  const map = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.85), pal.soft);
  map.rotation.x = -Math.PI / 2;
  map.position.y = 0.885;
  map.rotation.z = rng.jitter(0.04);
  g.add(map);
  // Route: glowing polyline between pins.
  const stops: THREE.Vector3[] = [];
  for (let i = 0; i < 4; i++) {
    stops.push(new THREE.Vector3(-0.5 + i * 0.33 + rng.jitter(0.06), 0.9, rng.jitter(0.3)));
    const pin = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 6), pal.glow(i === 3 ? 0x2bff88 : 0xff2b3a));
    pin.position.copy(stops[i]).setY(0.915);
    g.add(pin);
  }
  const route = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stops), 12, 0.006, 4),
    pal.glow(),
  );
  g.add(route);
  return g;
}

/** Keycard security gate. `barrier` arm rotates about z (0 = closed, -π/2 = open). */
export function keycardGate(rng: Rng, pal: Palette): { group: THREE.Group; barrier: THREE.Group } {
  const group = new THREE.Group();
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.05, 0.35), pal.body);
  pillar.position.y = 0.525;
  pillar.castShadow = true;
  group.add(pillar);
  const readerLamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.03, 0.03),
    pal.glow(rng.chance(0.5) ? 0xff2b3a : 0x2bff88),
  );
  readerLamp.position.set(0, 1.02, 0.19);
  group.add(readerLamp);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.05), pal.metal);
  slot.position.set(0, 0.95, 0.19);
  group.add(slot);
  const barrier = new THREE.Group();
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.04).translate(0.6, 0, 0), pal.trim);
  barrier.add(arm);
  for (let i = 0; i < 3; i++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.065, 0.045).translate(0.6, 0, 0), pal.glow(0xff2b3a));
    stripe.position.x = -0.35 + i * 0.4;
    barrier.add(stripe);
  }
  barrier.position.set(0.12, 0.95, 0);
  group.add(barrier);
  return { group, barrier };
}
