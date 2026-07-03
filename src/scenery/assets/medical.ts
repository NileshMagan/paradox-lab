import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Medical bay — infirmary dressing for lab facilities. Origins on the floor;
 * wall units face +Z from the wall base. The x-ray viewer doubles as a
 * clue-carrier (its film is a seeded procedural print).
 */

/** Wheeled stretcher with a thin mattress and a rumpled sheet. */
export function gurney(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.7), pal.metal);
  frame.position.y = 0.75;
  g.add(frame);
  for (const [x, z] of [
    [-0.8, -0.28],
    [-0.8, 0.28],
    [0.8, -0.28],
    [0.8, 0.28],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.68, 8), pal.metal);
    leg.position.set(x, 0.41, z);
    g.add(leg);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 10), pal.trim);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.06, z);
    g.add(wheel);
  }
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.09, 0.64), pal.soft);
  mattress.position.y = 0.82;
  mattress.castShadow = true;
  g.add(mattress);
  // Rumpled sheet: a flattened lump thrown across one end.
  const sheet = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 7), pal.soft);
  sheet.position.set(0.5 + rng.jitter(0.2), 0.88, 0);
  sheet.scale.set(1.4, 0.25, 1.1);
  g.add(sheet);
  return g;
}

/** Rolling IV pole. `bag` hangs from the hook with a sagging feed line. */
export function ivStand(rng: Rng, pal: Palette): { group: THREE.Group; bag: THREE.Mesh } {
  const group = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.04), pal.metal);
    foot.position.set(Math.cos(a) * 0.12, 0.03, Math.sin(a) * 0.12);
    foot.rotation.y = -a;
    group.add(foot);
  }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.7, 8), pal.metal);
  pole.position.y = 0.88;
  group.add(pole);
  for (const side of [-1, 1]) {
    const hook = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.015, 0.015), pal.metal);
    hook.position.set(side * 0.09, 1.72, 0);
    group.add(hook);
  }
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.045), pal.glass);
  bag.position.set(-0.16, 1.6, 0);
  group.add(bag);
  const fluid = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.03), pal.glow());
  fluid.position.set(-0.16, 1.56, 0);
  group.add(fluid);
  const line = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.16, 1.5, 0),
        new THREE.Vector3(-0.2 - rng.next() * 0.08, 1.1, 0.05),
        new THREE.Vector3(-0.1, 0.8, 0.08),
      ]),
      10,
      0.005,
      5,
    ),
    pal.trim,
  );
  group.add(line);
  return { group, bag };
}

/** Wall medicine cabinet: glass doors, bottle shelves, raised cross emblem. */
export function medCabinet(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.2), pal.body);
  box.position.set(0, 1.5, 0);
  box.castShadow = true;
  g.add(box);
  for (const side of [-1, 1]) {
    const pane = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.68, 0.015), pal.glass);
    pane.position.set(side * 0.165, 1.5, 0.105);
    g.add(pane);
  }
  const cross = new THREE.Group();
  for (const [w, h] of [
    [0.14, 0.05],
    [0.05, 0.14],
  ]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), pal.glow(0xff2b3a));
    cross.add(bar);
  }
  cross.position.set(0, 1.96, 0.05);
  g.add(cross);
  for (let s = 0; s < 2; s++) {
    for (let i = 0, n = 3 + rng.int(3); i < n; i++) {
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.06 + rng.next() * 0.06, 8),
        rng.chance(0.5) ? pal.glass : pal.soft,
      );
      bottle.position.set(-0.22 + rng.next() * 0.44, 1.3 + s * 0.32, 0.02);
      g.add(bottle);
    }
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.012, 0.16), pal.trim);
    shelf.position.set(0, 1.26 + s * 0.32, 0);
    g.add(shelf);
  }
  return g;
}

/** Articulated theatre lamp. `arm` rotates about y; `head` tilts about x. */
export function surgicalLight(pal: Palette): { group: THREE.Group; arm: THREE.Group; head: THREE.Group } {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.07, 16), pal.trim);
  base.position.y = 0.035;
  group.add(base);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.5, 10), pal.metal);
  column.position.y = 0.82;
  column.castShadow = true;
  group.add(column);
  const arm = new THREE.Group();
  const boom = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.8).translate(0, 0, 0.4), pal.metal);
  arm.add(boom);
  const head = new THREE.Group();
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.1, 16), pal.body);
  head.add(dish);
  // Ring of bulb studs — bright even when the room light is off.
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const stud = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), pal.glow(0xf4f9ff));
    stud.position.set(Math.cos(a) * 0.13, -0.05, Math.sin(a) * 0.13);
    head.add(stud);
  }
  head.position.z = 0.8;
  head.rotation.x = 0.5;
  arm.add(head);
  arm.position.y = 1.55;
  arm.rotation.y = 0.6;
  group.add(arm);
  return { group, arm, head };
}

/** Classic wheelchair: ring wheels, sling seat, footrests. */
export function wheelchair(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 8, 20), pal.metal);
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(side * 0.28, 0.3, -0.05);
    g.add(wheel);
    for (let s = 0; s < 4; s++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.56, 0.008), pal.metal);
      spoke.rotation.x = (s / 4) * Math.PI;
      spoke.position.copy(wheel.position);
      g.add(spoke);
    }
    const caster = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 10), pal.trim);
    caster.rotation.z = Math.PI / 2;
    caster.position.set(side * 0.24, 0.06, 0.3);
    g.add(caster);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.5), pal.metal);
    rail.position.set(side * 0.26, 0.62, 0.05);
    g.add(rail);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.5, 0.025), pal.metal);
    handle.position.set(side * 0.26, 0.75, -0.22);
    handle.rotation.x = -0.15;
    g.add(handle);
    const rest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.14), pal.trim);
    rest.position.set(side * 0.15, 0.12, 0.42);
    g.add(rest);
  }
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.45), pal.soft);
  seat.position.set(0, 0.55, 0.05);
  seat.rotation.x = rng.jitter(0.03);
  g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.04), pal.soft);
  back.position.set(0, 0.82, -0.2);
  back.rotation.x = -0.12;
  g.add(back);
  return g;
}

/** Biohazard drum: domed swing lid, three-lobed emblem. */
export function biohazardBin(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.6, 14), pal.body);
  drum.position.y = 0.3;
  drum.castShadow = true;
  g.add(drum);
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), pal.trim);
  lid.position.y = 0.6;
  lid.rotation.z = rng.chance(0.3) ? 0.4 : 0; // knocked ajar
  g.add(lid);
  // Trefoil: three glowing lobes around a hub.
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const lobe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.01, 10), pal.glow(0xffb347));
    lobe.rotation.x = Math.PI / 2;
    lobe.position.set(Math.cos(a) * 0.05, 0.38 + Math.sin(a) * 0.05, 0.252);
    g.add(lobe);
  }
  return g;
}

/** Crash cart: monitor box, two paddles on coiled cables, charge lamp. */
export function defibUnit(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const cart = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.45), pal.body);
  cart.position.y = 0.45;
  cart.castShadow = true;
  g.add(cart);
  for (const [x, z] of [
    [-0.22, -0.18],
    [-0.22, 0.18],
    [0.22, -0.18],
    [0.22, 0.18],
  ]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 10), pal.trim);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.05, z);
    g.add(wheel);
  }
  const unit = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.35), pal.trim);
  unit.position.y = 0.95;
  g.add(unit);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.12), pal.glow());
  screen.position.set(-0.08, 0.97, 0.177);
  g.add(screen);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), pal.glow(0xff2b3a));
  lamp.position.set(0.15, 1.0, 0.177);
  g.add(lamp);
  for (const side of [-1, 1]) {
    const paddle = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 10), pal.metal);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8), pal.trim);
    grip.position.y = 0.06;
    paddle.add(plate, grip);
    paddle.position.set(side * 0.18, 1.1, 0.05);
    paddle.rotation.z = side * (0.3 + rng.next() * 0.3);
    g.add(paddle);
    const coil = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.18, 1.08, 0.05),
          new THREE.Vector3(side * 0.3, 0.9, 0.2),
          new THREE.Vector3(side * 0.2, 0.85, 0.24),
        ]),
        8,
        0.008,
        5,
      ),
      pal.trim,
    );
    g.add(coil);
  }
  return g;
}

/** Three-fold privacy screen with fabric panels. */
export function privacyScreen(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const angle = (i - 1) * (0.4 + rng.next() * 0.25);
    const panel = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.65, 0.03), pal.metal);
    frame.position.y = 0.9;
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 1.4), pal.soft);
    cloth.position.set(0, 0.9, 0.017);
    panel.add(frame, cloth);
    for (const side of [-0.26, 0.26]) {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.08, 8), pal.trim);
      foot.position.set(side, 0.04, 0);
      panel.add(foot);
    }
    panel.position.x = (i - 1) * 0.6;
    panel.rotation.y = angle;
    g.add(panel);
  }
  return g;
}

/**
 * Wall x-ray lightbox with a glowing film of procedural bones — photo-adjacent
 * and a natural clue-carrier. Returns `panelMaterial` for on/off.
 */
export function xrayViewer(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; panelMaterial: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.08), pal.trim);
  frame.position.set(0, 1.55, 0);
  group.add(frame);
  const panelMaterial = pal.glow(0xcfe6ff).clone();
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), panelMaterial);
  panel.position.set(0, 1.55, 0.042);
  panel.userData.disposeMaterial = true;
  group.add(panel);
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(8, 12, 20, 0.92)';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = 'rgba(210, 228, 245, 0.85)';
    ctx.lineWidth = 4;
    // A rib cage: spine + paired arcs. Slight rng skew keeps each film unique.
    const skew = rng.jitter(6);
    ctx.beginPath();
    ctx.moveTo(64 + skew, 12);
    ctx.lineTo(64 - skew, 116);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const y = 28 + i * 18;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(64, y, 24 + i * 3, side < 0 ? Math.PI * 0.15 : Math.PI * 0.6, side < 0 ? Math.PI * 0.4 : Math.PI * 0.85);
        ctx.stroke();
      }
    }
  }
  const film = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.42),
    new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      roughness: 0.6,
    }),
  );
  film.userData.disposeMaterial = true;
  film.position.set(rng.jitter(0.12), 1.55, 0.046);
  film.rotation.z = rng.jitter(0.04);
  group.add(film);
  return { group, panelMaterial };
}

/** Walk-through detector arch with glowing scan strips on the inner faces. */
export function scannerArch(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.2, 0.5), pal.body);
    post.position.set(side * 0.62, 1.1, 0);
    post.castShadow = true;
    g.add(post);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.8, 0.06), pal.glow());
    strip.position.set(side * 0.53, 1.1, 0);
    g.add(strip);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.18, 0.5), pal.body);
  lintel.position.y = 2.29;
  g.add(lintel);
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 8, 6),
    pal.glow(rng.chance(0.5) ? 0x2bff88 : 0xff2b3a),
  );
  lamp.position.set(0, 2.22, 0.26);
  g.add(lamp);
  return g;
}
