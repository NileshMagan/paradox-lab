import * as THREE from 'three';
import { vistaPanorama } from '@/scenery/assets/vista';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Nautical — ship and harbour dressing (pairs with 'abyssal' or 'saloon'
 * timber tones). Origins on the floor; portholeWall faces +Z.
 */

/** Ship's wheel on a binnacle stand. `wheel` spins about z. */
export function shipWheel(rng: Rng, pal: Palette): { group: THREE.Group; wheel: THREE.Group } {
  const group = new THREE.Group();
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 1, 10), pal.body);
  pedestal.position.y = 0.5;
  pedestal.castShadow = true;
  group.add(pedestal);
  const wheel = new THREE.Group();
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 8, 20), pal.trim));
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 14), pal.trim));
  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.92, 6), pal.trim);
    spoke.rotation.z = (i / 4) * Math.PI;
    wheel.add(spoke);
    // Handle pegs poking past the rim.
    for (const end of [-1, 1]) {
      const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.12, 5), pal.metal);
      peg.rotation.z = (i / 4) * Math.PI;
      peg.position.set(Math.sin((i / 4) * Math.PI) * end * 0.46, Math.cos((i / 4) * Math.PI) * end * 0.46, 0);
      wheel.add(peg);
    }
  }
  wheel.position.set(0, 1.15, 0.08);
  wheel.rotation.z = rng.angle();
  group.add(wheel);
  return { group, wheel };
}

/** Stocked admiralty anchor leaning against its chain pile. */
export function anchorProp(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const anchor = new THREE.Group();
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.1, 8), pal.metal);
  shank.position.y = 0.62;
  anchor.add(shank);
  const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.6, 6), pal.metal);
  stock.rotation.x = Math.PI / 2;
  stock.position.y = 1.05;
  anchor.add(stock);
  const ringTop = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12), pal.metal);
  ringTop.position.y = 1.22;
  anchor.add(ringTop);
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 8, 14, Math.PI), pal.metal);
  crown.rotation.z = Math.PI;
  crown.position.y = 0.3;
  anchor.add(crown);
  for (const side of [-1, 1]) {
    const fluke = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 4), pal.metal);
    fluke.position.set(side * 0.28, 0.36, 0);
    fluke.rotation.z = side * -0.5;
    anchor.add(fluke);
  }
  anchor.rotation.z = 0.28 + rng.jitter(0.05); // leaning
  anchor.position.x = -0.1;
  g.add(anchor);
  for (let i = 0; i < 7; i++) {
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 5, 8), pal.trim);
    link.position.set(0.3 + i * 0.06, 0.03 + (i % 2) * 0.02, rng.jitter(0.15));
    link.rotation.set(rng.angle(), rng.angle(), rng.angle());
    g.add(link);
  }
  return g;
}

/** Hull wall section with a brass porthole showing real sea outside. */
export function portholeWall(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.1), pal.body);
  hull.position.y = 1.1;
  hull.castShadow = true;
  g.add(hull);
  // Plate seams + rivets.
  for (const y of [0.55, 1.65]) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.03, 0.02), pal.trim);
    seam.position.set(0, y, 0.055);
    g.add(seam);
    for (let i = 0; i < 6; i++) {
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 5), pal.metal);
      rivet.position.set(-0.7 + i * 0.28, y + 0.08, 0.056);
      g.add(rivet);
    }
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.045, 8, 20), pal.metal);
  ring.position.set(0, 1.2, 0.07);
  g.add(ring);
  // The view: an ocean panorama disc behind the glass.
  const sea = new THREE.Mesh(
    new THREE.CircleGeometry(0.24, 20),
    new THREE.MeshStandardMaterial({
      map: vistaPanorama(rng, 'ocean'),
      emissiveMap: vistaPanorama(rng.fork('glow'), 'ocean'),
      emissive: 0xffffff,
      emissiveIntensity: 0.4,
      roughness: 1,
    }),
  );
  sea.userData.disposeMaterial = true;
  sea.position.set(0, 1.2, 0.045);
  g.add(sea);
  const glassDisc = new THREE.Mesh(new THREE.CircleGeometry(0.24, 20), pal.glass);
  glassDisc.position.set(0, 1.2, 0.075);
  g.add(glassDisc);
  // Hinge bolts.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), pal.metal);
    bolt.position.set(Math.cos(a) * 0.26, 1.2 + Math.sin(a) * 0.26, 0.105);
    g.add(bolt);
  }
  return g;
}

/** Naval cannon on a wooden carriage. */
export function cannonBarrel(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const carriage = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.9), pal.body);
  carriage.position.set(0, 0.25, -0.1);
  carriage.castShadow = true;
  g.add(carriage);
  for (const [side, z] of [
    [-1, 0.25],
    [1, 0.25],
    [-1, -0.4],
    [1, -0.4],
  ]) {
    const truck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 10), pal.trim);
    truck.rotation.z = Math.PI / 2;
    truck.position.set(side * 0.28, 0.11, z);
    g.add(truck);
  }
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 1.2, 12), pal.metal);
  barrel.rotation.x = Math.PI / 2 - 0.12;
  barrel.position.set(0, 0.5, 0.25);
  barrel.castShadow = true;
  g.add(barrel);
  const muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.02, 6, 12), pal.metal);
  muzzle.rotation.x = -0.12;
  muzzle.position.set(0, 0.57, 0.84);
  g.add(muzzle);
  const cascabel = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), pal.metal);
  cascabel.position.set(0, 0.43, -0.36);
  g.add(cascabel);
  // Pyramid of shot beside it.
  for (const [x, y, z] of [
    [0.42, 0.06, 0.1],
    [0.52, 0.06, 0.02],
    [0.47, 0.06, 0.18],
    [0.47, 0.14, 0.1],
  ]) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), pal.trim);
    ball.position.set(x + rng.jitter(0.01), y, z);
    g.add(ball);
  }
  return g;
}

/** Lighthouse lamp assembly. `rotor` (the beam pair) sweeps about y. */
export function lighthouseBeacon(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; rotor: THREE.Group } {
  const group = new THREE.Group();
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.5, 12), pal.body);
  drum.position.y = 0.25;
  group.add(drum);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 0.04), pal.metal);
    mullion.position.set(Math.cos(a) * 0.27, 0.8, Math.sin(a) * 0.27);
    group.add(mullion);
  }
  const glassDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.5, 12, 1, true), pal.glass);
  glassDrum.position.y = 0.8;
  group.add(glassDrum);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.25, 12), pal.metal);
  cap.position.y = 1.18;
  group.add(cap);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), pal.glow(0xfff3d0));
  lamp.position.y = 0.8;
  group.add(lamp);
  const rotor = new THREE.Group();
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfff3d0,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  for (const dir of [1, -1]) {
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.3), beamMat);
    beam.userData.disposeMaterial = dir === 1;
    beam.position.x = dir * 0.93;
    rotor.add(beam);
  }
  rotor.position.y = 0.8;
  rotor.rotation.y = rng.angle();
  group.add(rotor);
  return { group, rotor };
}

/** Ship's bell on a bracket with a lanyard. */
export function shipBell(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const bracket = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 6, 12, Math.PI), pal.metal);
  bracket.position.y = 1.5;
  g.add(bracket);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.5, 8), pal.body);
  post.position.y = 0.75;
  g.add(post);
  const bell = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 14, 1, true), pal.metal);
  bell.position.y = 1.36;
  g.add(bell);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 6, 14), pal.metal);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 1.26;
  g.add(lip);
  const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), pal.trim);
  clapper.position.set(rng.jitter(0.02), 1.27, 0);
  g.add(clapper);
  const lanyard = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.25, 0),
        new THREE.Vector3(0.08, 1.05, 0.05),
        new THREE.Vector3(0.04, 0.9, 0.1),
      ]),
      8,
      0.008,
      5,
    ),
    pal.soft,
  );
  g.add(lanyard);
  return g;
}

/** Striped harbour buoy resting on its side ring. */
export function buoyFloat(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), pal.glow(0xff5a2b));
  body.position.y = 0.34;
  body.castShadow = true;
  g.add(body);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 8, 18), pal.body);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.34;
  g.add(band);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.5, 8), pal.metal);
  mast.position.y = 0.85;
  mast.rotation.z = rng.jitter(0.08);
  g.add(mast);
  const beaconTip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), pal.glow(0x2bff88));
  beaconTip.position.set(mast.rotation.z * -0.5, 1.1, 0);
  g.add(beaconTip);
  const skirtRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 6, 14), pal.metal);
  skirtRing.rotation.x = Math.PI / 2;
  skirtRing.position.y = 0.06;
  g.add(skirtRing);
  return g;
}

/** Wall rack of oars and a gaff hook. */
export function oarRack(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  for (const y of [0.7, 1.6]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.08), pal.body);
    rail.position.set(0, y, 0.04);
    g.add(rail);
  }
  for (let i = 0; i < 4; i++) {
    const x = -0.55 + i * 0.36;
    if (i === 2 && rng.chance(0.5)) continue; // one oar missing — someone rowed off
    const isGaff = i === 3;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.7, 6), pal.trim);
    shaft.position.set(x, 1.15, 0.09);
    shaft.rotation.z = rng.jitter(0.03);
    g.add(shaft);
    if (isGaff) {
      const hookTip = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 5, 8, Math.PI * 1.2), pal.metal);
      hookTip.position.set(x, 2.02, 0.09);
      g.add(hookTip);
    } else {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.03), pal.trim);
      blade.position.set(x, 2.1, 0.09);
      g.add(blade);
    }
  }
  return g;
}
