import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Storage & logistics — warehouse dressing. Origins on the floor.
 */

/** Corrugated shipping container. `doors` swing about y at their outer hinges. */
export function shippingContainer(
  rng: Rng,
  pal: Palette,
  opts: { length?: number } = {},
): { group: THREE.Group; doors: THREE.Mesh[] } {
  const length = opts.length ?? 3;
  const group = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.4, length), pal.body);
  box.position.y = 0.72;
  box.castShadow = true;
  group.add(box);
  // Corrugation: vertical ribs along both long sides.
  for (let i = 0, n = Math.round(length / 0.22); i < n; i++) {
    for (const side of [-1, 1]) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.3, 0.08), pal.trim);
      rib.position.set(side * 0.66, 0.72, -length / 2 + 0.15 + i * 0.22);
      group.add(rib);
    }
  }
  const doors: THREE.Mesh[] = [];
  const ajar = rng.chance(0.5);
  for (const side of [-1, 1]) {
    // Hinge at the container's outer edge: offset the leaf so rotation.y swings it.
    const doorGeo = new THREE.BoxGeometry(0.62, 1.32, 0.05).translate(-side * 0.31, 0, 0);
    const door = new THREE.Mesh(doorGeo, pal.trim);
    door.position.set(side * 0.64, 0.72, length / 2 + 0.03);
    door.rotation.y = ajar && side < 0 ? 0.8 + rng.next() * 0.5 : 0;
    group.add(door);
    doors.push(door);
    // Lock rod running the leaf's height.
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.26, 6), pal.metal);
    rod.position.set(-side * 0.31, 0, 0.04);
    door.add(rod);
  }
  return { group, doors };
}

/** Four-drawer filing cabinet, one drawer out with a paper wad. */
export function filingCabinet(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.35, 0.62), pal.body);
  shell.position.y = 0.675;
  shell.castShadow = true;
  g.add(shell);
  const openIndex = rng.int(4);
  for (let i = 0; i < 4; i++) {
    const y = 0.24 + i * 0.32;
    const out = i === openIndex ? 0.28 : 0;
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.28, 0.02), pal.trim);
    face.position.set(0, y, 0.32 + out);
    g.add(face);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.02), pal.metal);
    handle.position.set(0, y + 0.06, 0.34 + out);
    g.add(handle);
    const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.05), pal.soft);
    slot.position.set(0, y - 0.06, 0.331 + out);
    g.add(slot);
    if (i === openIndex) {
      const tray = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.3), pal.metal);
      tray.position.set(0, y - 0.1, 0.22);
      g.add(tray);
      const wad = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), pal.soft);
      wad.position.set(rng.jitter(0.08), y - 0.04, 0.22);
      wad.scale.y = 0.5;
      g.add(wad);
    }
  }
  return g;
}

/** Tall shelf packed with banker's boxes, one lid ajar. */
export function archiveShelf(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const W = 1.3;
  for (const x of [-W / 2, W / 2]) {
    for (const z of [-0.28, 0.28]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2, 0.06), pal.metal);
      post.position.set(x, 1, z);
      g.add(post);
    }
  }
  const ajarShelf = rng.int(4);
  for (let t = 0; t < 4; t++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(W, 0.04, 0.6), pal.trim);
    shelf.position.y = 0.15 + t * 0.5;
    shelf.castShadow = true;
    g.add(shelf);
    let x = -W / 2 + 0.06;
    while (x < W / 2 - 0.3) {
      const bw = rng.range(0.26, 0.34);
      const box = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.3, 0.42), pal.soft);
      box.position.set(x + bw / 2, 0.32 + t * 0.5, rng.jitter(0.03));
      box.rotation.y = rng.jitter(0.05);
      g.add(box);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.02, 0.05, 0.44), pal.body);
      lid.position.copy(box.position);
      lid.position.y += 0.17;
      if (t === ajarShelf && x < -0.2) lid.rotation.z = 0.25; // one lid left ajar
      lid.rotation.y = box.rotation.y;
      g.add(lid);
      // Label strip.
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.06), pal.trim);
      label.position.set(box.position.x, box.position.y, box.position.z + 0.212);
      g.add(label);
      x += bw + rng.range(0.02, 0.08);
    }
  }
  return g;
}

/** Wire-mesh security cage. `door` hinges about y at its left edge. */
export function cageLockup(rng: Rng, pal: Palette): { group: THREE.Group; door: THREE.Group } {
  const group = new THREE.Group();
  const W = 1.6;
  const H = 2.1;
  const D = 1.2;
  const mesh = (w: number, h: number): THREE.Group => {
    const panel = new THREE.Group();
    for (let i = 0, n = Math.round(w / 0.16); i <= n; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.012, h, 0.012), pal.metal);
      bar.position.x = -w / 2 + (i / n) * w;
      panel.add(bar);
    }
    for (let i = 0, n = Math.round(h / 0.16); i <= n; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, 0.012), pal.metal);
      bar.position.y = -h / 2 + (i / n) * h;
      panel.add(bar);
    }
    return panel;
  };
  const back = mesh(W, H);
  back.position.set(0, H / 2, -D / 2);
  group.add(back);
  for (const side of [-1, 1]) {
    const wall = mesh(D, H);
    wall.rotation.y = Math.PI / 2;
    wall.position.set(side * (W / 2), H / 2, 0);
    group.add(wall);
  }
  // Front: fixed half + hinged door.
  const front = mesh(W / 2, H);
  front.position.set(W / 4, H / 2, D / 2);
  group.add(front);
  const door = new THREE.Group();
  const leaf = mesh(W / 2 - 0.06, H - 0.1);
  leaf.position.x = (W / 2 - 0.06) / 2;
  door.add(leaf);
  const latch = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.03), pal.trim);
  latch.position.set(W / 2 - 0.12, 0.1, 0.02);
  door.add(latch);
  door.position.set(-W / 2, H / 2, D / 2);
  door.rotation.y = rng.chance(0.4) ? 0.7 : 0;
  group.add(door);
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(W + 0.08, 0.06, D + 0.08), pal.trim);
  frameTop.position.y = H + 0.03;
  group.add(frameTop);
  return { group, door };
}

/** Crates under a draped rope cargo net. */
export function cargoNetPile(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  // The pile.
  for (let i = 0; i < 4; i++) {
    const s = rng.range(0.35, 0.55);
    const crate = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.8, s), pal.body);
    crate.position.set(rng.jitter(0.3), s * 0.4 + (i > 1 ? 0.35 : 0), rng.jitter(0.3));
    crate.rotation.y = rng.angle();
    crate.castShadow = true;
    g.add(crate);
  }
  // The net: two crossing families of draped tubes over the pile envelope.
  const R = 0.75;
  for (let i = 0; i < 5; i++) {
    for (const dir of [0, Math.PI / 2]) {
      const t = -R + (i / 4) * R * 2;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(dir) * t - Math.sin(dir) * R, 0.05, Math.sin(dir) * t + Math.cos(dir) * R),
        new THREE.Vector3(Math.cos(dir) * t, 0.95 - Math.abs(t) * 0.35, Math.sin(dir) * t),
        new THREE.Vector3(Math.cos(dir) * t + Math.sin(dir) * R, 0.05, Math.sin(dir) * t - Math.cos(dir) * R),
      ]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.012, 4), pal.trim));
    }
  }
  return g;
}

/** 3-2-1 pyramid of stencilled crates. */
export function cratePyramid(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const s = 0.5;
  const rows = [3, 2, 1];
  rows.forEach((n, tier) => {
    for (let i = 0; i < n; i++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.85, s), pal.body);
      crate.position.set((i - (n - 1) / 2) * (s + 0.02), s * 0.425 + tier * s * 0.86, rng.jitter(0.03));
      crate.rotation.y = rng.jitter(0.06);
      crate.castShadow = true;
      g.add(crate);
      // Stencil band.
      const band = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.7, 0.08), pal.trim);
      band.position.set(crate.position.x, crate.position.y + 0.05, crate.position.z + s / 2 + 0.002);
      band.rotation.y = crate.rotation.y;
      g.add(band);
    }
  });
  return g;
}

/** Two-wheel hand truck resting at its parked angle. */
export function handTruck(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const frame = new THREE.Group();
  for (const side of [-0.18, 0.18]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.3, 0.03), pal.metal);
    rail.position.set(side, 0.65, 0);
    frame.add(rail);
  }
  for (const y of [0.35, 0.75, 1.15]) {
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.03), pal.metal);
    cross.position.y = y;
    frame.add(cross);
  }
  const toe = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.3), pal.trim);
  toe.position.set(0, 0.03, 0.15);
  frame.add(toe);
  frame.rotation.x = -0.35 + rng.jitter(0.05); // parked lean
  g.add(frame);
  for (const side of [-0.2, 0.2]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 12), pal.trim);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(side, 0.12, -0.04);
    g.add(wheel);
  }
  return g;
}

/** Rack of wire spools on two axles, thread tails hanging. */
export function spoolRack(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  for (const x of [-0.5, 0.5]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.3, 0.06), pal.body);
    post.position.set(x, 0.65, 0);
    g.add(post);
  }
  for (const y of [0.5, 1.0]) {
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8), pal.metal);
    axle.rotation.z = Math.PI / 2;
    axle.position.y = y;
    g.add(axle);
    let x = -0.4;
    while (x < 0.3) {
      const w = rng.range(0.08, 0.2);
      const r = rng.range(0.09, 0.16);
      const spool = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 12), rng.chance(0.5) ? pal.trim : pal.soft);
      spool.rotation.z = Math.PI / 2;
      spool.position.set(x + w / 2, y, 0);
      g.add(spool);
      if (rng.chance(0.4)) {
        const tailCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(x + w / 2, y - r, 0),
          new THREE.Vector3(x + w / 2 + rng.jitter(0.1), (y - r) / 2, 0.08),
          new THREE.Vector3(x + w / 2 + rng.jitter(0.2), 0.01, 0.12),
        ]);
        g.add(new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 8, 0.006, 4), pal.trim));
      }
      x += w + rng.range(0.03, 0.1);
    }
  }
  return g;
}

/** Wall rail of pegs: hanging coats, hardhats, one telling empty peg. */
export function coatRail(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const rail = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.05), pal.body);
  rail.position.set(0, 1.7, 0.02);
  g.add(rail);
  const slots = 5;
  const empty = rng.int(slots);
  for (let i = 0; i < slots; i++) {
    const x = -0.56 + i * 0.28;
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.1, 8), pal.metal);
    peg.rotation.x = Math.PI / 3;
    peg.position.set(x, 1.66, 0.06);
    g.add(peg);
    if (i === empty) continue;
    if (rng.chance(0.5)) {
      // Coat: draped soft volume.
      const coat = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.6, 0.12), pal.soft);
      coat.position.set(x, 1.32, 0.09);
      coat.rotation.z = rng.jitter(0.05);
      coat.castShadow = true;
      g.add(coat);
    } else {
      // Hardhat.
      const hat = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), pal.glow(0xffb347));
      hat.position.set(x, 1.56, 0.1);
      hat.rotation.x = 0.5;
      g.add(hat);
    }
  }
  return g;
}

/** Two horizontal drums in a cradle, one tapped with a drip stain beneath. */
export function drumRack(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  for (const [x, y] of [
    [-0.3, 0.36],
    [0.3, 0.36],
  ]) {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.8, 14), pal.body);
    drum.rotation.x = Math.PI / 2;
    drum.position.set(x, y + 0.05, 0);
    drum.castShadow = true;
    g.add(drum);
    for (const t of [-0.3, 0.3]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.015, 6, 16), pal.trim);
      ring.position.set(x, y + 0.05, t);
      g.add(ring);
    }
  }
  // Cradle.
  for (const z of [-0.3, 0.3]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), pal.metal);
    beam.position.set(0, 0.18, z);
    g.add(beam);
    for (const x of [-0.55, 0.55]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), pal.metal);
      leg.position.set(x, 0.09, z);
      g.add(leg);
    }
  }
  // The tap and its stain.
  const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 6), pal.metal);
  tap.position.set(-0.3, 0.2, 0.42);
  tap.rotation.x = Math.PI / 2;
  g.add(tap);
  const stain = new THREE.Mesh(new THREE.CircleGeometry(0.12 + rng.next() * 0.05, 12), pal.trim);
  stain.rotation.x = -Math.PI / 2;
  stain.position.set(-0.3, 0.005, 0.48);
  g.add(stain);
  return g;
}
