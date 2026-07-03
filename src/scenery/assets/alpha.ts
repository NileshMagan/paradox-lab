import * as THREE from 'three';
import type { AlphaKit } from '@/scenery/kits';
import type { Rng } from '@/scenery/rng';

/**
 * Alpha scenery — the Overgrown Past. Parametric organic builders: every call
 * with the same Rng seed yields the identical prop; different seeds yield
 * believable variation. Groups sit with their origin on the floor (y = 0)
 * unless noted, so callers position them straight from placements.
 *
 * Builders are light-free by design (lights are the renderer's scarcest
 * resource — see Dimension's per-room gating); the few that WANT a glow
 * return their emissive material so the room can pulse it, and take an
 * opt-in flag for a point light.
 */

/** Thick roots erupting from a centre and snaking outward along the floor. */
export function rootSystem(
  rng: Rng,
  kit: AlphaKit,
  opts: { spread?: number; strands?: number } = {},
): THREE.Group {
  const spread = opts.spread ?? 2.2;
  const strands = opts.strands ?? 4;
  const g = new THREE.Group();
  for (let i = 0; i < strands; i++) {
    // Fan the strands around the circle with jitter so they never clump.
    const a = ((i + rng.jitter(0.35)) / strands) * Math.PI * 2;
    const len = spread * rng.range(0.55, 1);
    const pts: THREE.Vector3[] = [];
    const steps = 4;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      pts.push(
        new THREE.Vector3(
          Math.cos(a) * len * t + rng.jitter(0.3) * t,
          Math.max(0.02, 0.28 * (1 - t) + rng.jitter(0.04)),
          Math.sin(a) * len * t + rng.jitter(0.3) * t,
        ),
      );
    }
    const radius = rng.range(0.045, 0.1);
    const root = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, radius, 6),
      kit.bark,
    );
    root.castShadow = true;
    g.add(root);
    // A knuckle where the root breaks the soil.
    if (rng.chance(0.6)) {
      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.5, 7, 5), kit.bark);
      knuckle.position.copy(pts[0]);
      g.add(knuckle);
    }
  }
  return g;
}

/**
 * A curtain of vines hanging from a line along local X. Origin is at the
 * ceiling attachment line; the vines droop into -Y.
 */
export function hangingVines(
  rng: Rng,
  kit: AlphaKit,
  opts: { span?: number; count?: number; drop?: number } = {},
): THREE.Group {
  const span = opts.span ?? 3;
  const count = opts.count ?? 6;
  const drop = opts.drop ?? 1.6;
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const x = -span / 2 + (i / Math.max(1, count - 1)) * span + rng.jitter(0.18);
    const d = drop * rng.range(0.55, 1);
    const sway = rng.jitter(0.3);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 0, rng.jitter(0.1)),
      new THREE.Vector3(x + sway * 0.5, -d * 0.45, rng.jitter(0.15)),
      new THREE.Vector3(x + sway, -d, rng.jitter(0.15)),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, rng.range(0.012, 0.022), 5), kit.ivy));
    // Sparse leaves along the strand.
    const leaves = 2 + rng.int(4);
    for (let l = 0; l < leaves; l++) {
      const p = curve.getPoint(rng.range(0.2, 1));
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(rng.range(0.05, 0.1), rng.range(0.08, 0.14)), kit.leaf);
      leaf.position.copy(p);
      leaf.rotation.set(rng.angle(), rng.angle(), rng.angle());
      g.add(leaf);
    }
  }
  return g;
}

/** Low mound of moss — flattened lobes hugging the floor (or a prop). */
export function mossPatch(rng: Rng, kit: AlphaKit, opts: { radius?: number } = {}): THREE.Group {
  const radius = opts.radius ?? 0.5;
  const g = new THREE.Group();
  const lobes = 5 + rng.int(5);
  for (let i = 0; i < lobes; i++) {
    const r = rng.range(0.12, 0.3) * radius * 2;
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), kit.moss);
    const dist = rng.range(0, radius - r * 0.5);
    const a = rng.angle();
    lobe.position.set(Math.cos(a) * dist, r * 0.12, Math.sin(a) * dist);
    lobe.scale.y = 0.25;
    lobe.receiveShadow = true;
    g.add(lobe);
  }
  return g;
}

/** A clump of arched fern fronds. */
export function fernCluster(rng: Rng, kit: AlphaKit, opts: { fronds?: number; scale?: number } = {}): THREE.Group {
  const fronds = opts.fronds ?? 7;
  const scale = opts.scale ?? 1;
  const g = new THREE.Group();
  for (let i = 0; i < fronds; i++) {
    const a = ((i + rng.jitter(0.4)) / fronds) * Math.PI * 2;
    const len = rng.range(0.35, 0.6);
    const lift = rng.range(0.25, 0.45);
    // Stem arcs up and out, sagging at the tip like a real frond.
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0.02, 0),
      new THREE.Vector3(Math.cos(a) * len * 0.5, lift, Math.sin(a) * len * 0.5),
      new THREE.Vector3(Math.cos(a) * len, lift * 0.55, Math.sin(a) * len),
    );
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.008, 4), kit.ivy));
    // Leaflets shrink toward the tip.
    for (let l = 0; l < 5; l++) {
      const t = 0.3 + (l / 5) * 0.7;
      const size = 0.11 * (1 - t * 0.6);
      const leaflet = new THREE.Mesh(new THREE.PlaneGeometry(size * 2.2, size), kit.leaf);
      leaflet.position.copy(curve.getPoint(t));
      leaflet.rotation.set(rng.jitter(0.5), a + Math.PI / 2, rng.jitter(0.5));
      g.add(leaflet);
    }
  }
  g.scale.setScalar(scale);
  return g;
}

/** Heap of broken concrete and stone. Reads as "the ceiling came down here". */
export function rubblePile(
  rng: Rng,
  kit: AlphaKit,
  opts: { radius?: number; height?: number } = {},
): THREE.Group {
  const radius = opts.radius ?? 0.9;
  const height = opts.height ?? 0.7;
  const g = new THREE.Group();
  const chunks = 9 + rng.int(6);
  for (let i = 0; i < chunks; i++) {
    const s = rng.range(0.14, 0.42) * radius;
    const geo = rng.chance(0.65)
      ? new THREE.BoxGeometry(s * rng.range(0.8, 1.6), s * rng.range(0.5, 1), s * rng.range(0.8, 1.6))
      : new THREE.DodecahedronGeometry(s * 0.65, 0);
    const chunk = new THREE.Mesh(geo, rng.chance(0.7) ? kit.concrete : kit.stone);
    const dist = rng.range(0, radius);
    const a = rng.angle();
    // Pile up toward the centre.
    chunk.position.set(
      Math.cos(a) * dist,
      Math.max(0.05, height * (1 - dist / radius) * rng.range(0.2, 0.9)),
      Math.sin(a) * dist,
    );
    chunk.rotation.set(rng.angle(), rng.angle(), rng.angle());
    chunk.castShadow = true;
    chunk.receiveShadow = true;
    g.add(chunk);
  }
  return g;
}

/** A fallen ceiling slab leaning on rubble, rebar bent at the broken edge. */
export function collapsedSlab(rng: Rng, kit: AlphaKit): THREE.Group {
  const g = new THREE.Group();
  const w = rng.range(1.3, 2);
  const d = rng.range(0.9, 1.3);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, d), kit.concrete);
  const tilt = rng.range(0.35, 0.6);
  slab.rotation.z = tilt;
  slab.position.y = Math.sin(tilt) * (w / 2) * 0.9;
  slab.castShadow = true;
  g.add(slab);
  // Prop it on a couple of chunks so it doesn't float.
  const prop = new THREE.Mesh(new THREE.DodecahedronGeometry(rng.range(0.2, 0.3), 0), kit.stone);
  prop.position.set(-w * 0.3, 0.15, rng.jitter(0.3));
  prop.rotation.set(rng.angle(), rng.angle(), 0);
  g.add(prop);
  // Rebar splaying from the high broken edge.
  for (let i = 0; i < 4; i++) {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(w * 0.45, Math.sin(tilt) * w * 0.85, -d / 2 + (i / 3) * d),
      new THREE.Vector3(w * 0.7, Math.sin(tilt) * w * 0.85 + rng.range(0.1, 0.25), -d / 2 + (i / 3) * d + rng.jitter(0.1)),
      new THREE.Vector3(w * 0.9, Math.sin(tilt) * w * 0.6 + rng.jitter(0.2), -d / 2 + (i / 3) * d + rng.jitter(0.2)),
    );
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 6, 0.014, 4), kit.rustDark));
  }
  return g;
}

/**
 * Mineral stalactites for a ceiling patch. Origin at the ceiling plane; cones
 * hang into -Y. Scatter within `width × depth`.
 */
export function stalactites(
  rng: Rng,
  kit: AlphaKit,
  opts: { width?: number; depth?: number; count?: number } = {},
): THREE.Group {
  const width = opts.width ?? 2;
  const depth = opts.depth ?? 2;
  const count = opts.count ?? 8;
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const len = rng.range(0.18, 0.65);
    const spike = new THREE.Mesh(new THREE.ConeGeometry(len * 0.16, len, 6), kit.stone);
    spike.rotation.x = Math.PI; // point down
    spike.position.set(rng.jitter(width / 2), -len / 2, rng.jitter(depth / 2));
    g.add(spike);
  }
  return g;
}

/**
 * Bioluminescent pod cluster. Deterministic sibling of the legacy
 * `floraCluster`; the light is opt-in because lights are budgeted per room.
 * Returns the emissive material so rooms can pulse `emissiveIntensity`.
 */
export function bioPodCluster(
  rng: Rng,
  kit: AlphaKit,
  opts: { color?: number; scale?: number; withLight?: boolean } = {},
): { group: THREE.Group; material: THREE.MeshStandardMaterial; light: THREE.PointLight | null } {
  const color = opts.color ?? 0x2ee6d6;
  const scale = opts.scale ?? 1;
  const group = new THREE.Group();
  // Private clone of the kit pod material so this cluster pulses independently.
  const material = kit.pod(color).clone();
  const count = 5 + rng.int(4);
  for (let i = 0; i < count; i++) {
    const tall = rng.chance(0.5);
    const geo = tall
      ? new THREE.ConeGeometry(rng.range(0.05, 0.1), rng.range(0.25, 0.6), 6)
      : new THREE.SphereGeometry(rng.range(0.06, 0.14), 8, 6);
    const pod = new THREE.Mesh(geo, material);
    pod.position.set(rng.jitter(0.3), tall ? 0.18 : 0.08, rng.jitter(0.3));
    pod.castShadow = true;
    pod.userData.disposeMaterial = i === 0; // the clone is owned by this cluster
    group.add(pod);
  }
  let light: THREE.PointLight | null = null;
  if (opts.withLight) {
    light = new THREE.PointLight(color, 2.4, 4.5, 2);
    light.position.y = 0.35;
    group.add(light);
  }
  group.scale.setScalar(scale);
  return { group, material, light };
}

/** Still puddle with an irregular shore. Sits 1 cm above the floor. */
export function puddle(rng: Rng, kit: AlphaKit, opts: { radius?: number } = {}): THREE.Mesh {
  const radius = opts.radius ?? 0.7;
  const shape = new THREE.Shape();
  const points = 12;
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = i === points ? undefined : radius * rng.range(0.65, 1);
    // Close the loop back onto the first vertex.
    if (i === 0) shape.moveTo(Math.cos(a) * (r ?? radius), Math.sin(a) * (r ?? radius));
    else if (r !== undefined) shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 4), kit.water);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.01;
  mesh.receiveShadow = true;
  return mesh;
}

/** A dead, bare-branched tree grown through the floor. */
export function deadTree(rng: Rng, kit: AlphaKit, opts: { height?: number } = {}): THREE.Group {
  const height = opts.height ?? 2.6;
  const g = new THREE.Group();
  const up = new THREE.Vector3(0, 1, 0);

  const addBranch = (from: THREE.Vector3, dir: THREE.Vector3, len: number, radius: number, depth: number): void => {
    const to = from.clone().addScaledVector(dir, len);
    const geo = new THREE.CylinderGeometry(radius * 0.55, radius, len, 6);
    const seg = new THREE.Mesh(geo, kit.bark);
    seg.position.copy(from.clone().add(to).multiplyScalar(0.5));
    seg.quaternion.setFromUnitVectors(up, dir.clone().normalize());
    seg.castShadow = true;
    g.add(seg);
    if (depth <= 0) return;
    const forks = 2 + rng.int(2);
    for (let i = 0; i < forks; i++) {
      const spread = rng.range(0.35, 0.8);
      const next = dir
        .clone()
        .applyAxisAngle(new THREE.Vector3(1, 0, 0), rng.jitter(spread))
        .applyAxisAngle(new THREE.Vector3(0, 0, 1), rng.jitter(spread))
        .normalize();
      // Bias the fork back upward so the crown doesn't dive at the floor.
      next.y = Math.abs(next.y) * rng.range(0.6, 1.1);
      addBranch(to, next.normalize(), len * rng.range(0.55, 0.75), radius * 0.6, depth - 1);
    }
  };

  addBranch(new THREE.Vector3(0, 0, 0), up.clone(), height * 0.45, height * 0.045, 3);
  return g;
}

// One shared streak texture/material for all grime — created lazily, cached
// for the app's lifetime like the core procedural textures.
let grimeMaterial: THREE.MeshBasicMaterial | null = null;
function getGrimeMaterial(): THREE.MeshBasicMaterial {
  if (grimeMaterial) return grimeMaterial;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Uneven vertical drips: columns of varying darkness fading downward.
    for (let x = 0; x < 64; x += 4) {
      const drop = 40 + Math.sin(x * 1.7) * 30 + ((x * 37) % 29);
      const grad = ctx.createLinearGradient(0, 0, 0, drop + 60);
      grad.addColorStop(0, 'rgba(10, 12, 8, 0.55)');
      grad.addColorStop(1, 'rgba(10, 12, 8, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, 4, drop + 60);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  grimeMaterial = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    // Nudge toward the camera so the decal never z-fights its wall.
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  return grimeMaterial;
}

/**
 * Water-stain / grime streak decal for walls. Facing +Z; mount it flush
 * against a wall (leave ~1 cm gap). Purely cosmetic, one shared material.
 */
export function grimeStreak(rng: Rng, opts: { width?: number; height?: number } = {}): THREE.Mesh {
  const width = opts.width ?? rng.range(0.5, 1.2);
  const height = opts.height ?? rng.range(0.8, 1.8);
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), getGrimeMaterial());
}

/**
 * Ivy colonising a wall region (width × height, facing +Z, origin at the
 * bottom centre). Leaves thin out with height, plus a few climbing stems.
 */
export function ivyClimb(
  rng: Rng,
  kit: AlphaKit,
  opts: { width?: number; height?: number; density?: number } = {},
): THREE.Group {
  const width = opts.width ?? 2;
  const height = opts.height ?? 2.5;
  const density = opts.density ?? 1;
  const g = new THREE.Group();
  const stems = 2 + rng.int(3);
  for (let s = 0; s < stems; s++) {
    const x = rng.jitter(width / 2) * 0.8;
    const top = height * rng.range(0.6, 1);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 0, 0.02),
      new THREE.Vector3(x + rng.jitter(0.3), top * 0.5, 0.03),
      new THREE.Vector3(x + rng.jitter(0.4), top, 0.02),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.014, 4), kit.ivy));
  }
  const leafCount = Math.round(width * height * 14 * density);
  for (let i = 0; i < leafCount; i++) {
    // Bias leaves toward the bottom — growth climbs from the floor.
    const y = height * Math.pow(rng.next(), 1.5);
    const size = rng.range(0.05, 0.13);
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 1.3), kit.leaf);
    leaf.position.set(rng.jitter(width / 2), y, 0.02 + rng.next() * 0.05);
    leaf.rotation.set(rng.jitter(0.9), rng.jitter(0.9), rng.angle());
    g.add(leaf);
  }
  return g;
}
