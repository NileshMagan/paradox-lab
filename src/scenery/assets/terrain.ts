import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Terrain — ground-plane variety: mounds, cliffs, dunes, ledges. These are
 * the pieces that break a room out of "flat floor + props". Walkable tops are
 * flagged with `mesh.userData.walkable = true` so future navigation can find
 * them. Origins on the floor.
 */

/** A walkable grassy/earthen mound (seeded vertex-displaced dome). */
export function hillMound(
  rng: Rng,
  pal: Palette,
  opts: { radius?: number; height?: number } = {},
): THREE.Group {
  const radius = opts.radius ?? 1.6;
  const height = opts.height ?? 0.7;
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(radius, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const noise = 1 + rng.jitter(0.08);
    pos.setX(i, pos.getX(i) * noise);
    pos.setZ(i, pos.getZ(i) * noise);
    pos.setY(i, pos.getY(i) * (height / radius) * noise);
  }
  geo.computeVertexNormals();
  const mound = new THREE.Mesh(geo, pal.body);
  mound.castShadow = true;
  mound.receiveShadow = true;
  mound.userData.walkable = true;
  g.add(mound);
  // A few embedded stones poking through.
  for (let i = 0; i < 4; i++) {
    const a = rng.angle();
    const d = rng.range(0.3, 0.8) * radius;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(rng.range(0.06, 0.14), 0), pal.trim);
    stone.position.set(Math.cos(a) * d, height * (1 - d / radius) * 0.7, Math.sin(a) * d);
    stone.rotation.set(rng.angle(), rng.angle(), rng.angle());
    g.add(stone);
  }
  return g;
}

/** A cliff face: stacked strata blocks with an overhang. Faces +Z. */
export function cliffFace(
  rng: Rng,
  pal: Palette,
  opts: { width?: number; height?: number } = {},
): THREE.Group {
  const width = opts.width ?? 2.4;
  const height = opts.height ?? 2.6;
  const g = new THREE.Group();
  let y = 0;
  while (y < height) {
    const h = rng.range(0.3, 0.55);
    const strata = new THREE.Mesh(
      new THREE.BoxGeometry(width * rng.range(0.9, 1.05), h, rng.range(0.5, 0.8)),
      rng.chance(0.7) ? pal.body : pal.trim,
    );
    strata.position.set(rng.jitter(0.08), y + h / 2, -0.3 + rng.jitter(0.1) + y * 0.06); // leans out with height
    strata.rotation.y = rng.jitter(0.05);
    strata.rotation.z = rng.jitter(0.02);
    strata.castShadow = true;
    g.add(strata);
    y += h * 0.92; // slight overlap hides the seams
  }
  // Scree at the base.
  for (let i = 0; i < 6; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rng.range(0.05, 0.16), 0), pal.trim);
    rock.position.set(rng.jitter(width / 2), 0.06, 0.25 + rng.next() * 0.4);
    rock.rotation.set(rng.angle(), rng.angle(), rng.angle());
    g.add(rock);
  }
  return g;
}

/** A natural rock arch — walk-through hero terrain. Spans local X. */
export function rockArch(rng: Rng, pal: Palette, opts: { span?: number } = {}): THREE.Group {
  const span = opts.span ?? 2.2;
  const g = new THREE.Group();
  const R = span / 2;
  const segments = 9;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI;
    const chunk = new THREE.Mesh(
      new THREE.DodecahedronGeometry(rng.range(0.22, 0.34), 0),
      rng.chance(0.75) ? pal.body : pal.trim,
    );
    chunk.position.set(Math.cos(a) * R, 0.25 + Math.sin(a) * (R * 0.9), rng.jitter(0.15));
    chunk.rotation.set(rng.angle(), rng.angle(), rng.angle());
    chunk.scale.set(1, rng.range(0.8, 1.3), 1);
    chunk.castShadow = true;
    g.add(chunk);
  }
  // Fatter footings.
  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), pal.body);
    foot.position.set(side * R, 0.25, 0);
    foot.scale.y = 1.4;
    foot.castShadow = true;
    g.add(foot);
  }
  return g;
}

/** A field of scattered boulders, seeded sizes and clustering. */
export function boulderField(
  rng: Rng,
  pal: Palette,
  opts: { radius?: number; count?: number } = {},
): THREE.Group {
  const radius = opts.radius ?? 1.4;
  const count = opts.count ?? 8;
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const r = rng.range(0.1, 0.42);
    const a = rng.angle();
    const d = rng.range(0, radius);
    const boulder = new THREE.Mesh(
      new THREE.DodecahedronGeometry(r, 0),
      rng.chance(0.6) ? pal.body : pal.trim,
    );
    boulder.position.set(Math.cos(a) * d, r * 0.7, Math.sin(a) * d);
    boulder.rotation.set(rng.angle(), rng.angle(), rng.angle());
    boulder.scale.y = rng.range(0.7, 1);
    boulder.castShadow = true;
    boulder.receiveShadow = true;
    g.add(boulder);
  }
  return g;
}

/** Gravel/scree patch: many pebbles + a fine base disc. Reads at a glance. */
export function gravelPatch(rng: Rng, pal: Palette, opts: { radius?: number } = {}): THREE.Group {
  const radius = opts.radius ?? 0.9;
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CircleGeometry(radius, 16), pal.trim);
  base.rotation.x = -Math.PI / 2;
  base.position.y = 0.008;
  base.receiveShadow = true;
  g.add(base);
  for (let i = 0; i < 26; i++) {
    const a = rng.angle();
    const d = rng.range(0, radius * 0.92);
    const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(rng.range(0.015, 0.05), 0), pal.body);
    pebble.position.set(Math.cos(a) * d, 0.02, Math.sin(a) * d);
    pebble.rotation.set(rng.angle(), rng.angle(), rng.angle());
    g.add(pebble);
  }
  return g;
}

/** Wind-rippled dune field: overlapping crescent ridges (pal.soft = the sand). */
export function duneField(rng: Rng, pal: Palette, opts: { width?: number } = {}): THREE.Group {
  const width = opts.width ?? 2.6;
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const w = rng.range(0.5, 1) * width * 0.5;
    const dune = new THREE.Mesh(new THREE.SphereGeometry(w, 12, 6), pal.soft);
    dune.position.set(rng.jitter(width / 2), w * 0.12, rng.jitter(width / 3));
    dune.scale.set(1.6, 0.28, 0.9);
    dune.rotation.y = rng.jitter(0.5);
    dune.receiveShadow = true;
    g.add(dune);
    // The slip-face ridge line: a darker crest strip.
    const crest = new THREE.Mesh(new THREE.BoxGeometry(w * 1.4, 0.01, 0.03), pal.body);
    crest.position.copy(dune.position).setY(w * 0.24);
    crest.rotation.y = dune.rotation.y;
    g.add(crest);
  }
  return g;
}

/** A walkable rock ledge/shelf jutting from a wall, with support taper. Faces +Z. */
export function ledgeShelf(rng: Rng, pal: Palette, opts: { width?: number; height?: number } = {}): THREE.Group {
  const width = opts.width ?? 1.8;
  const height = opts.height ?? 1.2;
  const g = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.22, 0.9), pal.body);
  slab.position.set(0, height, 0.45);
  slab.rotation.z = rng.jitter(0.02);
  slab.castShadow = true;
  slab.userData.walkable = true;
  g.add(slab);
  const taper = new THREE.Mesh(new THREE.ConeGeometry(0.5, height, 4), pal.trim);
  taper.rotation.x = Math.PI;
  taper.position.set(rng.jitter(width / 4), height / 2, 0.5);
  g.add(taper);
  // Crumble bits at the lip.
  for (let i = 0; i < 3; i++) {
    const bit = new THREE.Mesh(new THREE.DodecahedronGeometry(rng.range(0.04, 0.08), 0), pal.body);
    bit.position.set(rng.jitter(width / 2), height + 0.13, 0.85);
    g.add(bit);
  }
  return g;
}

/** A glowing fissure cracked into the floor (lava/energy/abyss — colour via opts). */
export function fissureGlow(
  rng: Rng,
  pal: Palette,
  opts: { length?: number; color?: number } = {},
): THREE.Group {
  const length = opts.length ?? 2.2;
  const g = new THREE.Group();
  // The crack: a jagged glowing ribbon flanked by lifted slabs.
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 5; i++) {
    pts.push(new THREE.Vector3(-length / 2 + (i / 5) * length, 0.012, rng.jitter(0.25)));
  }
  const crack = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.06, 5),
    pal.glow(opts.color ?? 0xff5a2b),
  );
  crack.scale.y = 0.25;
  g.add(crack);
  for (let i = 0; i < 8; i++) {
    const t = rng.next();
    const p = pts[Math.floor(t * 5)];
    const side = rng.chance(0.5) ? 1 : -1;
    const slabBit = new THREE.Mesh(
      new THREE.BoxGeometry(rng.range(0.2, 0.45), 0.06, rng.range(0.15, 0.3)),
      pal.body,
    );
    slabBit.position.set(p.x + rng.jitter(0.2), 0.035, p.z + side * rng.range(0.12, 0.25));
    slabBit.rotation.set(side * rng.range(0.05, 0.18), rng.jitter(0.3), rng.jitter(0.08));
    g.add(slabBit);
  }
  return g;
}

/** A cave mouth: rock tunnel entrance with darkness inside. Faces +Z. */
export function cavePortal(rng: Rng, pal: Palette, opts: { width?: number } = {}): THREE.Group {
  const width = opts.width ?? 1.6;
  const g = new THREE.Group();
  // The dark throat first, so rocks overlap its edges.
  const throat = new THREE.Mesh(
    new THREE.CircleGeometry(width * 0.48, 16),
    new THREE.MeshBasicMaterial({ color: 0x05060a }),
  );
  throat.userData.disposeMaterial = true;
  throat.position.set(0, width * 0.52, -0.1);
  g.add(throat);
  // Rock rim: boulders packed around the opening.
  const rimCount = 11;
  for (let i = 0; i < rimCount; i++) {
    const a = (i / rimCount) * Math.PI; // upper arc
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(rng.range(0.2, 0.34), 0),
      rng.chance(0.7) ? pal.body : pal.trim,
    );
    rock.position.set(Math.cos(a) * width * 0.62, 0.15 + Math.sin(a) * width * 0.62, rng.jitter(0.14));
    rock.rotation.set(rng.angle(), rng.angle(), rng.angle());
    rock.castShadow = true;
    g.add(rock);
  }
  for (const side of [-1, 1]) {
    const jambRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 0), pal.body);
    jambRock.position.set(side * width * 0.62, 0.2, 0);
    jambRock.scale.y = 1.5;
    g.add(jambRock);
  }
  // A hint of something inside: two faint eyes-height glints.
  if (rng.chance(0.5)) {
    for (const side of [-0.06, 0.06]) {
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), pal.glow());
      glint.position.set(side, width * 0.5, -0.08);
      g.add(glint);
    }
  }
  return g;
}
