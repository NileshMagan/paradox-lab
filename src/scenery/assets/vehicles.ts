import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Vehicles — parked, abandoned, or working. Stylised low-poly silhouettes;
 * wheels are returned where spinning them matters. Origins on the floor,
 * facing +Z (driving direction).
 */

function wheel(pal: Palette, radius: number, width: number): THREE.Mesh {
  const w = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 14), pal.trim);
  w.rotation.z = Math.PI / 2;
  return w;
}

/** Parked sedan; opts.taxi adds a roof sign and taxi-yellow accents. */
export function sedanCar(
  rng: Rng,
  pal: Palette,
  opts: { taxi?: boolean } = {},
): { group: THREE.Group; wheels: THREE.Mesh[] } {
  const group = new THREE.Group();
  const bodyMat = opts.taxi ? pal.glow(0xffd23f) : pal.body;
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.45, 3.6), bodyMat);
  body.position.y = 0.55;
  body.castShadow = true;
  group.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.42, 1.8), bodyMat);
  cabin.position.set(0, 0.98, -0.2);
  cabin.castShadow = true;
  group.add(cabin);
  // Glass band around the cabin.
  for (const [w, d, x, z, ry] of [
    [1.4, 0.36, 0, 0.72, 0],
    [1.4, 0.36, 0, -1.12, 0],
    [1.7, 0.36, 0.76, -0.2, Math.PI / 2],
    [1.7, 0.36, -0.76, -0.2, Math.PI / 2],
  ] as const) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, d), pal.glass);
    pane.position.set(x, 1.0, z);
    pane.rotation.y = ry;
    group.add(pane);
  }
  const wheels: THREE.Mesh[] = [];
  for (const [x, z] of [
    [-0.8, 1.15],
    [0.8, 1.15],
    [-0.8, -1.15],
    [0.8, -1.15],
  ]) {
    const wh = wheel(pal, 0.32, 0.22);
    wh.position.set(x, 0.32, z);
    wh.rotation.y = rng.jitter(0.01);
    group.add(wh);
    wheels.push(wh);
  }
  for (const side of [-0.55, 0.55]) {
    const head = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.12), pal.glow(0xfff3d0));
    head.position.set(side, 0.6, 1.81);
    group.add(head);
    const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.1), pal.glow(0xff2b3a));
    tail.rotation.y = Math.PI;
    tail.position.set(side, 0.6, -1.81);
    group.add(tail);
  }
  if (opts.taxi) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.16), pal.glow(0xffe2b0));
    sign.position.set(0, 1.26, -0.2);
    group.add(sign);
  }
  return { group, wheels };
}

/** Box delivery van with rear doors and a cab. */
export function deliveryVan(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.7, 2.9), pal.body);
  box.position.set(0, 1.25, -0.7);
  box.castShadow = true;
  g.add(box);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 1.3), pal.trim);
  cab.position.set(0, 0.95, 1.4);
  cab.castShadow = true;
  g.add(cab);
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.6), pal.glass);
  windshield.position.set(0, 1.15, 2.06);
  windshield.rotation.x = -0.15;
  g.add(windshield);
  for (const [x, z] of [
    [-0.85, 1.35],
    [0.85, 1.35],
    [-0.85, -1.35],
    [0.85, -1.35],
  ]) {
    const wh = wheel(pal, 0.36, 0.24);
    wh.position.set(x, 0.36, z);
    g.add(wh);
  }
  // Rear door seam + handles.
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.5, 0.03), pal.metal);
  seam.position.set(0, 1.25, -2.16);
  g.add(seam);
  for (const side of [-0.2, 0.2]) {
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.03), pal.metal);
    handle.position.set(side, 1.1, -2.16);
    g.add(handle);
  }
  // Side livery stripe.
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.3), pal.glow());
  stripe.rotation.y = Math.PI / 2;
  stripe.position.set(0.96, 1.3, -0.7 + rng.jitter(0.1));
  g.add(stripe);
  return g;
}

/** Warehouse forklift. `fork` (carriage + tines) translates in y along the mast. */
export function forklift(rng: Rng, pal: Palette): { group: THREE.Group; fork: THREE.Group } {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 1.6), pal.glow(0xffb347));
  body.position.set(0, 0.65, -0.3);
  body.castShadow = true;
  group.add(body);
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.12), pal.soft);
  seatBack.position.set(0, 1.2, -0.75);
  group.add(seatBack);
  // Overhead guard cage.
  for (const [x, z] of [
    [-0.45, -0.95],
    [0.45, -0.95],
    [-0.45, 0.35],
    [0.45, 0.35],
  ]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.06), pal.trim);
    post.position.set(x, 1.55, z);
    group.add(post);
  }
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.06, 1.4), pal.trim);
  canopy.position.set(0, 2.13, -0.3);
  group.add(canopy);
  // Mast + fork.
  for (const x of [-0.35, 0.35]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.9, 0.08), pal.metal);
    rail.position.set(x, 0.95, 0.62);
    group.add(rail);
  }
  const fork = new THREE.Group();
  const carriage = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.3, 0.08), pal.metal);
  fork.add(carriage);
  for (const x of [-0.25, 0.25]) {
    const tine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.9), pal.metal);
    tine.position.set(x, -0.14, 0.48);
    fork.add(tine);
  }
  fork.position.set(0, 0.35 + rng.next() * 0.5, 0.68);
  group.add(fork);
  for (const [x, z, r] of [
    [-0.55, 0.35, 0.3],
    [0.55, 0.35, 0.3],
    [-0.45, -0.85, 0.24],
    [0.45, -0.85, 0.24],
  ]) {
    const wh = wheel(pal, r, 0.2);
    wh.position.set(x, r, z);
    group.add(wh);
  }
  return { group, fork };
}

/** Bicycle leaning on its kickstand. */
export function bicycle(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const bike = new THREE.Group();
  for (const z of [-0.55, 0.55]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.02, 8, 20), pal.metal);
    rim.position.set(0, 0.34, z);
    bike.add(rim);
    for (let s = 0; s < 3; s++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.66, 0.008), pal.metal);
      spoke.rotation.x = (s / 3) * Math.PI;
      spoke.position.set(0, 0.34, z);
      bike.add(spoke);
    }
  }
  // Frame tubes: down tube, seat tube, top tube, forks.
  const tube = (from: THREE.Vector3, to: THREE.Vector3): THREE.Mesh => {
    const dir = to.clone().sub(from);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, dir.length(), 6), pal.body);
    m.position.copy(from).add(dir.clone().multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
  };
  const bb = new THREE.Vector3(0, 0.34, 0.05);
  const seatTop = new THREE.Vector3(0, 0.95, -0.25);
  const headTop = new THREE.Vector3(0, 0.92, 0.48);
  bike.add(
    tube(bb, seatTop),
    tube(bb, headTop),
    tube(seatTop, headTop),
    tube(headTop, new THREE.Vector3(0, 0.34, 0.55)),
    tube(seatTop.clone().setY(0.7), new THREE.Vector3(0, 0.34, -0.55)),
  );
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.24), pal.soft);
  seat.position.copy(seatTop).add(new THREE.Vector3(0, 0.03, 0));
  bike.add(seat);
  const bars = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.44, 6), pal.metal);
  bars.rotation.z = Math.PI / 2;
  bars.position.copy(headTop).add(new THREE.Vector3(0, 0.05, 0));
  bike.add(bars);
  bike.rotation.z = 0.12 + rng.jitter(0.03); // kickstand lean
  g.add(bike);
  return g;
}

/** Utility buggy (golf-cart style): platform, bench, canopy. */
export function utilityBuggy(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 2.2), pal.body);
  deck.position.y = 0.42;
  deck.castShadow = true;
  g.add(deck);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.5), pal.soft);
  bench.position.set(0, 0.78, -0.3);
  g.add(bench);
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 0.08), pal.soft);
  back.position.set(0, 1.02, -0.58);
  g.add(back);
  const dash = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.35, 0.2), pal.trim);
  dash.position.set(0, 0.72, 0.85);
  g.add(dash);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), pal.metal);
  column.position.set(-0.3, 0.98, 0.72);
  column.rotation.x = 0.5;
  g.add(column);
  const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 6, 12), pal.trim);
  steeringWheel.rotation.x = 0.5 + Math.PI / 2;
  steeringWheel.position.set(-0.3, 1.15, 0.62);
  g.add(steeringWheel);
  for (const [x, z] of [
    [-0.55, 0.8],
    [0.55, 0.8],
    [-0.55, -0.8],
    [0.55, -0.8],
  ]) {
    const wh = wheel(pal, 0.22, 0.16);
    wh.position.set(x, 0.22, z);
    g.add(wh);
  }
  for (const [x, z] of [
    [-0.5, 0.95],
    [0.5, 0.95],
    [-0.5, -0.65],
    [0.5, -0.65],
  ]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.15, 6), pal.metal);
    post.position.set(x, 1.05, z);
    g.add(post);
  }
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.05, 1.9), pal.trim);
  canopy.position.set(0, 1.66, 0.15);
  canopy.rotation.x = rng.jitter(0.01);
  g.add(canopy);
  return g;
}

/** Beached rowboat with bench seats and shipped oars. */
export function rowBoat(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  // Hull: flat bottom + flared sides + tapered bow/stern blocks.
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 2.0), pal.body);
  bottom.position.y = 0.06;
  g.add(bottom);
  for (const side of [-1, 1]) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 2.1), pal.body);
    plank.position.set(side * 0.4, 0.24, 0);
    plank.rotation.z = side * -0.22;
    plank.castShadow = true;
    g.add(plank);
  }
  for (const zEnd of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.5), pal.body);
    cap.position.set(0, 0.24, zEnd * 1.1);
    cap.rotation.x = zEnd * 0.35;
    cap.rotation.y = Math.PI / 4;
    cap.scale.z = 0.6;
    g.add(cap);
  }
  for (const z of [-0.5, 0.15, 0.8]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.04, 0.2), pal.trim);
    bench.position.set(0, 0.34, z);
    g.add(bench);
  }
  const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.6, 6), pal.trim);
  oar.rotation.z = Math.PI / 2 - 0.08;
  oar.rotation.y = rng.jitter(0.2);
  oar.position.set(0, 0.42, -0.1);
  g.add(oar);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.09), pal.trim);
  blade.position.set(0.78, 0.36, -0.1);
  g.add(blade);
  return g;
}

/** Wooden farm wagon with spoked wheels and a tow tongue. */
export function woodenWagon(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 2), pal.body);
  bed.position.y = 0.72;
  bed.castShadow = true;
  g.add(bed);
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 2), pal.trim);
    rail.position.set(side * 0.56, 0.98, 0);
    g.add(rail);
  }
  for (const [z, r] of [
    [0.75, 0.34],
    [-0.75, 0.44],
  ] as const) {
    for (const side of [-1, 1]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 8, 14), pal.trim);
      rim.rotation.y = Math.PI / 2;
      rim.position.set(side * 0.62, r + 0.03, z);
      g.add(rim);
      for (let s = 0; s < 4; s++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.03, r * 2 - 0.05, 0.03), pal.trim);
        spoke.rotation.x = (s / 4) * Math.PI;
        spoke.position.set(side * 0.62, r + 0.03, z);
        g.add(spoke);
      }
    }
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 8), pal.metal);
    axle.rotation.z = Math.PI / 2;
    axle.position.set(0, r + 0.03, z);
    g.add(axle);
  }
  const tongue = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.3, 6), pal.trim);
  tongue.rotation.x = Math.PI / 2 - 0.4;
  tongue.position.set(rng.jitter(0.1), 0.35, 1.55);
  g.add(tongue);
  return g;
}
