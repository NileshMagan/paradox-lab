import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Jungle & tropical flora — denser, taller, wetter than the Alpha organics.
 * Greens are intentionally hard-coded (foliage reads wrong in most palettes);
 * trunks/accents still come from the palette. Origins on the floor.
 */

const LEAF_GREENS = [0x2f6b35, 0x3f8a42, 0x1d5c30, 0x4a9a3e];

function leafMat(rng: Rng): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: LEAF_GREENS[rng.int(LEAF_GREENS.length)],
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
}

/** Palm tree: curved segmented trunk, radial frond crown, coconut cluster. */
export function palmTree(rng: Rng, pal: Palette, opts: { height?: number } = {}): THREE.Group {
  const height = opts.height ?? 2.8;
  const g = new THREE.Group();
  const lean = rng.jitter(0.2);
  const segments = 6;
  let top = new THREE.Vector3(0, 0, 0);
  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07 * (1 - t * 0.35), 0.09 * (1 - t * 0.35), height / segments + 0.05, 8),
      pal.body,
    );
    top = new THREE.Vector3(Math.sin(lean) * t * height * 0.4, (t + 0.5 / segments) * height, 0);
    seg.position.copy(top);
    seg.rotation.z = -lean * t * 1.2;
    seg.castShadow = true;
    g.add(seg);
  }
  const crown = new THREE.Vector3(Math.sin(lean) * height * 0.4, height, 0);
  const fronds = 7 + rng.int(3);
  const mat = leafMat(rng);
  for (let i = 0; i < fronds; i++) {
    const a = (i / fronds) * Math.PI * 2;
    const droop = rng.range(0.4, 0.8);
    const frond = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.22, 4, 1), mat);
    frond.userData.disposeMaterial = i === 0;
    // Bend the frond by displacing its tip vertices downward.
    const pos = frond.geometry.attributes.position as THREE.BufferAttribute;
    for (let v = 0; v < pos.count; v++) {
      const x = pos.getX(v);
      if (x > 0) pos.setY(v, pos.getY(v) - (x / 0.6) * droop * 0.35);
    }
    frond.geometry.computeVertexNormals();
    frond.position.copy(crown);
    frond.rotation.y = a;
    frond.rotation.z = -0.25;
    g.add(frond);
  }
  for (let i = 0; i < 3; i++) {
    const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), pal.trim);
    coconut.position.set(crown.x + rng.jitter(0.12), crown.y - 0.12, rng.jitter(0.12));
    g.add(coconut);
  }
  return g;
}

/** Banana plant: broad paddle leaves fanning from a squat pseudostem. */
export function bananaPlant(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.9, 8), pal.body);
  stem.position.y = 0.45;
  g.add(stem);
  const mat = leafMat(rng);
  const leaves = 6 + rng.int(3);
  for (let i = 0; i < leaves; i++) {
    const a = (i / leaves) * Math.PI * 2 + rng.jitter(0.3);
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 1.2, 1, 4), mat);
    leaf.userData.disposeMaterial = i === 0;
    const pos = leaf.geometry.attributes.position as THREE.BufferAttribute;
    for (let v = 0; v < pos.count; v++) {
      const y = pos.getY(v);
      if (y > 0) pos.setZ(v, -(y / 0.6) * 0.3); // arc the blade over
    }
    leaf.geometry.computeVertexNormals();
    leaf.position.set(Math.cos(a) * 0.1, 0.95, Math.sin(a) * 0.1);
    leaf.rotation.y = -a + Math.PI / 2;
    leaf.rotation.x = -0.5 + rng.jitter(0.15);
    g.add(leaf);
  }
  return g;
}

/** Bamboo clump: jointed canes of varied height, a couple snapped. */
export function bambooClump(rng: Rng, pal: Palette, opts: { count?: number } = {}): THREE.Group {
  const count = opts.count ?? 7;
  const g = new THREE.Group();
  const cane = new THREE.MeshStandardMaterial({ color: 0x7a9a4a, roughness: 0.7 });
  let owner = true;
  for (let i = 0; i < count; i++) {
    const h = rng.range(1.4, 2.8);
    const a = rng.angle();
    const d = rng.range(0, 0.3);
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    const snapped = rng.chance(0.15);
    const culm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, snapped ? h * 0.5 : h, 8), cane);
    culm.userData.disposeMaterial = owner;
    owner = false;
    culm.position.set(x, (snapped ? h * 0.5 : h) / 2, z);
    culm.rotation.z = rng.jitter(0.06);
    culm.castShadow = true;
    g.add(culm);
    // Node rings.
    for (let n = 1; n < 5; n++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 5, 8), pal.trim);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, (h / 5) * n * (snapped ? 0.5 : 1), z);
      g.add(ring);
    }
    if (!snapped && rng.chance(0.7)) {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 6), cane);
      tuft.position.set(x + rng.jitter(0.05), h + 0.1, z);
      tuft.rotation.z = rng.jitter(0.4);
      g.add(tuft);
    }
  }
  return g;
}

/** Giant fern — waist-high, dense rosette (bigger cousin of fernCluster). */
export function giantFern(rng: Rng, _pal: Palette, opts: { scale?: number } = {}): THREE.Group {
  const scale = opts.scale ?? 1;
  const g = new THREE.Group();
  const mat = leafMat(rng);
  const fronds = 10 + rng.int(4);
  for (let i = 0; i < fronds; i++) {
    const a = (i / fronds) * Math.PI * 2 + rng.jitter(0.2);
    const len = rng.range(0.7, 1.1);
    const lift = rng.range(0.5, 0.8);
    const frond = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.16, 4, 1), mat);
    frond.userData.disposeMaterial = i === 0;
    const pos = frond.geometry.attributes.position as THREE.BufferAttribute;
    for (let v = 0; v < pos.count; v++) {
      const x = pos.getX(v);
      pos.setY(v, pos.getY(v) + Math.sin(((x + len / 2) / len) * Math.PI) * lift * 0.45);
    }
    frond.geometry.computeVertexNormals();
    frond.position.set(Math.cos(a) * len * 0.4, 0.15, Math.sin(a) * len * 0.4);
    frond.rotation.y = -a;
    g.add(frond);
  }
  g.scale.setScalar(scale);
  return g;
}

/** Dense vine curtain — a doorway-covering waterfall of greenery. Faces +Z. */
export function vineCurtain(
  rng: Rng,
  pal: Palette,
  opts: { width?: number; drop?: number } = {},
): THREE.Group {
  const width = opts.width ?? 1.8;
  const drop = opts.drop ?? 2.2;
  const g = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, width + 0.2, 8), pal.body);
  beam.rotation.z = Math.PI / 2;
  beam.position.y = drop;
  g.add(beam);
  const mat = leafMat(rng);
  const strands = Math.round(width / 0.13);
  for (let i = 0; i < strands; i++) {
    const x = -width / 2 + (i / (strands - 1)) * width;
    const len = drop * rng.range(0.7, 1);
    const sway = rng.jitter(0.15);
    const strand = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(x, drop, 0),
          new THREE.Vector3(x + sway, drop - len / 2, rng.jitter(0.08)),
          new THREE.Vector3(x + sway * 1.6, drop - len, rng.jitter(0.08)),
        ]),
        8,
        0.012,
        4,
      ),
      pal.body,
    );
    g.add(strand);
    for (let l = 0; l < 5; l++) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.1), mat);
      leaf.userData.disposeMaterial = i === 0 && l === 0;
      leaf.position.set(x + sway * (l / 5), drop - (len * (l + 0.5)) / 5, rng.jitter(0.08));
      leaf.rotation.set(rng.jitter(0.8), rng.angle(), rng.jitter(0.8));
      g.add(leaf);
    }
  }
  return g;
}

/** Tropical flower bush: dark foliage ball studded with bright blooms. */
export function flowerBush(rng: Rng, pal: Palette, opts: { radius?: number } = {}): THREE.Group {
  const radius = opts.radius ?? 0.5;
  const g = new THREE.Group();
  const foliage = new THREE.MeshStandardMaterial({ color: 0x1d4a28, roughness: 0.95 });
  for (let i = 0, n = 5 + rng.int(4); i < n; i++) {
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(rng.range(0.5, 0.8) * radius, 9, 7), foliage);
    lobe.userData.disposeMaterial = i === 0;
    lobe.position.set(rng.jitter(radius * 0.6), radius * rng.range(0.5, 0.9), rng.jitter(radius * 0.6));
    lobe.castShadow = true;
    g.add(lobe);
  }
  const bloomColors = [0xe344c4, 0xff5a2b, 0xffd23f];
  for (let i = 0, n = 5 + rng.int(5); i < n; i++) {
    const a = rng.angle();
    const bloom = new THREE.Mesh(
      new THREE.ConeGeometry(0.035, 0.06, 6),
      pal.glow(bloomColors[rng.int(bloomColors.length)]),
    );
    bloom.position.set(Math.cos(a) * radius * 0.8, radius * rng.range(0.6, 1.2), Math.sin(a) * radius * 0.8);
    bloom.rotation.set(rng.jitter(1), 0, rng.jitter(1));
    g.add(bloom);
  }
  return g;
}

/** Mangrove-style stilt roots arching into the ground under a short trunk. */
export function mangroveRoot(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.9, 8), pal.body);
  trunk.position.y = 1.05;
  trunk.castShadow = true;
  g.add(trunk);
  for (let i = 0, n = 6 + rng.int(3); i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng.jitter(0.2);
    const reach = rng.range(0.35, 0.6);
    const root = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(0, 0.75, 0),
          new THREE.Vector3(Math.cos(a) * reach * 0.8, 0.45, Math.sin(a) * reach * 0.8),
          new THREE.Vector3(Math.cos(a) * reach, 0, Math.sin(a) * reach),
        ),
        8,
        rng.range(0.025, 0.04),
        6,
      ),
      pal.body,
    );
    root.castShadow = true;
    g.add(root);
  }
  const mat = leafMat(rng);
  for (let i = 0; i < 8; i++) {
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.16), mat);
    leaf.userData.disposeMaterial = i === 0;
    const a = rng.angle();
    leaf.position.set(Math.cos(a) * 0.25, 1.5 + rng.jitter(0.2), Math.sin(a) * 0.25);
    leaf.rotation.set(rng.jitter(0.8), rng.angle(), rng.jitter(0.8));
    g.add(leaf);
  }
  return g;
}

/** Moss-capped jungle boulder half-swallowed by growth. */
export function mossBoulder(rng: Rng, pal: Palette, opts: { radius?: number } = {}): THREE.Group {
  const radius = opts.radius ?? 0.5;
  const g = new THREE.Group();
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 0), pal.trim);
  rock.position.y = radius * 0.7;
  rock.rotation.set(rng.angle(), rng.angle(), rng.angle());
  rock.castShadow = true;
  g.add(rock);
  const moss = new THREE.MeshStandardMaterial({ color: 0x3f6b2e, roughness: 1 });
  for (let i = 0; i < 4; i++) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(radius * rng.range(0.3, 0.5), 8, 6), moss);
    cap.userData.disposeMaterial = i === 0;
    const a = rng.angle();
    cap.position.set(Math.cos(a) * radius * 0.5, radius * rng.range(0.9, 1.3), Math.sin(a) * radius * 0.5);
    cap.scale.y = 0.4;
    g.add(cap);
  }
  return g;
}

/** CEILING: a jungle canopy layer — overlapping leaf clusters with light gaps. */
export function canopyRoof(rng: Rng, _pal: Palette, opts: { width?: number; depth?: number } = {}): THREE.Group {
  const width = opts.width ?? 3;
  const depth = opts.depth ?? 3;
  const g = new THREE.Group();
  const mat = leafMat(rng);
  for (let i = 0, n = 14; i < n; i++) {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(rng.range(0.3, 0.6), 7), mat);
    pad.userData.disposeMaterial = i === 0;
    pad.rotation.x = Math.PI / 2 + rng.jitter(0.25);
    pad.rotation.z = rng.angle();
    pad.position.set(rng.jitter(width / 2), -rng.next() * 0.4, rng.jitter(depth / 2));
    g.add(pad);
  }
  // Shafts of light through the gaps.
  for (let i = 0; i < 2; i++) {
    const shaft = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 2.4),
      new THREE.MeshBasicMaterial({
        color: 0xffe2a8,
        transparent: true,
        opacity: 0.06,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    shaft.userData.disposeMaterial = true;
    shaft.position.set(rng.jitter(width / 2), -1.3, rng.jitter(depth / 2));
    shaft.rotation.set(0, rng.angle(), -0.2);
    g.add(shaft);
  }
  return g;
}

/** Ruined jungle idol: stone head sinking into the undergrowth. */
export function totemIdol(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 0.55), pal.body);
  head.position.y = 0.32; // sunk to the chin
  head.rotation.set(rng.jitter(0.1), rng.jitter(0.4), rng.jitter(0.08));
  head.castShadow = true;
  g.add(head);
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.12, 0.1), pal.trim);
  brow.position.set(0, 0.52, 0.28);
  brow.rotation.copy(head.rotation);
  g.add(brow);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), pal.trim);
  nose.position.set(0, 0.34, 0.3);
  nose.rotation.copy(head.rotation);
  g.add(nose);
  // One glowing eye — the other is dark. Players notice.
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.03), pal.glow());
  eye.position.set(-0.15, 0.45, 0.3);
  eye.rotation.copy(head.rotation);
  g.add(eye);
  const deadEye = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.03), pal.trim);
  deadEye.position.set(0.15, 0.45, 0.3);
  deadEye.rotation.copy(head.rotation);
  g.add(deadEye);
  // Undergrowth lapping at the base.
  const moss = new THREE.MeshStandardMaterial({ color: 0x2f6b35, roughness: 1 });
  for (let i = 0; i < 5; i++) {
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(rng.range(0.1, 0.2), 7, 5), moss);
    tuft.userData.disposeMaterial = i === 0;
    const a = rng.angle();
    tuft.position.set(Math.cos(a) * 0.4, 0.04, Math.sin(a) * 0.4);
    tuft.scale.y = 0.4;
    g.add(tuft);
  }
  return g;
}
