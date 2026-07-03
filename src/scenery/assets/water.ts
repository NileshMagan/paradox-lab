import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Water features. The animated ones (surface, waterfall, fountain, drips)
 * return `{ group, update }` like the weather FX — drive them from the room's
 * per-frame hook. Colours default to believable water but take opts.
 */

/** Animated rippling water surface (vertex sine waves). Lies at y≈0. */
export function waterSurface(
  rng: Rng,
  opts: { width?: number; depth?: number; color?: number } = {},
): { group: THREE.Group; update: (delta: number, elapsed: number) => void } {
  const width = opts.width ?? 3;
  const depth = opts.depth ?? 3;
  const geo = new THREE.PlaneGeometry(width, depth, 24, 24);
  const mat = new THREE.MeshStandardMaterial({
    color: opts.color ?? 0x2e6d94,
    transparent: true,
    opacity: 0.85,
    roughness: 0.1,
    metalness: 0.4,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.disposeMaterial = true;
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const phase = rng.angle();
  const group = new THREE.Group();
  group.add(mesh);
  return {
    group,
    update: (_delta, elapsed) => {
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        pos.setZ(i, Math.sin(x * 2.1 + elapsed * 1.4 + phase) * 0.02 + Math.cos(y * 1.7 + elapsed * 1.1) * 0.02);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    },
  };
}

/** Waterfall sheet with scrolling streaks and churning foam at the base. */
export function waterfallSheet(
  rng: Rng,
  opts: { width?: number; height?: number } = {},
): { group: THREE.Group; update: (delta: number, elapsed: number) => void } {
  const width = opts.width ?? 1.2;
  const height = opts.height ?? 2.4;
  const group = new THREE.Group();
  // Streak texture scrolls downward via offset — cheap and convincing.
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(120, 180, 210, 0.55)';
    ctx.fillRect(0, 0, 64, 128);
    ctx.strokeStyle = 'rgba(235, 250, 255, 0.8)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 9; i++) {
      const x = 4 + rng.int(56);
      ctx.beginPath();
      ctx.moveTo(x, rng.int(40));
      ctx.lineTo(x + rng.jitter(4), 128);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapT = THREE.RepeatWrapping;
  const sheetMat = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    opacity: 0.8,
    roughness: 0.2,
    side: THREE.DoubleSide,
  });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(width, height), sheetMat);
  sheet.userData.disposeMaterial = true;
  sheet.position.y = height / 2 + 0.05;
  group.add(sheet);
  // Foam: jittering translucent spheres at the plunge line.
  const foam: THREE.Mesh[] = [];
  const foamMat = new THREE.MeshStandardMaterial({
    color: 0xeaf6fa,
    transparent: true,
    opacity: 0.7,
    roughness: 1,
  });
  for (let i = 0; i < 7; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(rng.range(0.07, 0.14), 8, 6), foamMat);
    puff.userData.disposeMaterial = i === 0;
    puff.position.set(rng.jitter(width / 2), 0.06, rng.jitter(0.12));
    puff.scale.y = 0.5;
    group.add(puff);
    foam.push(puff);
  }
  return {
    group,
    update: (delta, elapsed) => {
      tex.offset.y += delta * 0.9;
      foam.forEach((p, i) => {
        p.scale.setScalar(1 + Math.sin(elapsed * 6 + i * 1.7) * 0.15);
        p.scale.y *= 0.5;
      });
    },
  };
}

/** Basin fountain: arcing jets and animated droplet spray. */
export function fountainRing(
  rng: Rng,
  pal: Palette,
  opts: { radius?: number } = {},
): { group: THREE.Group; update: (delta: number, elapsed: number) => void } {
  const radius = opts.radius ?? 0.8;
  const group = new THREE.Group();
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius + 0.06, 0.3, 18), pal.body);
  basin.position.y = 0.15;
  basin.castShadow = true;
  group.add(basin);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x2e6d94,
    transparent: true,
    opacity: 0.85,
    roughness: 0.08,
    metalness: 0.35,
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(radius - 0.06, 18), waterMat);
  water.userData.disposeMaterial = true;
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.28;
  group.add(water);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.5, 10), pal.trim);
  spout.position.y = 0.5;
  group.add(spout);
  // Fixed arcing jets from the spout crown to the basin.
  const jetMat = new THREE.MeshStandardMaterial({
    color: 0x9fd8ea,
    transparent: true,
    opacity: 0.55,
    roughness: 0.2,
  });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const jet = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(0, 0.76, 0),
          new THREE.Vector3(Math.cos(a) * radius * 0.55, 0.95, Math.sin(a) * radius * 0.55),
          new THREE.Vector3(Math.cos(a) * (radius - 0.12), 0.3, Math.sin(a) * (radius - 0.12)),
        ),
        10,
        0.016,
        5,
      ),
      jetMat,
    );
    jet.userData.disposeMaterial = i === 0;
    group.add(jet);
  }
  // Spray droplets above the crown.
  const count = 40;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = rng.jitter(0.1);
    positions[i * 3 + 1] = 0.76 + rng.next() * 0.35;
    positions[i * 3 + 2] = rng.jitter(0.1);
    phases[i] = rng.next();
  }
  const sprayGeo = new THREE.BufferGeometry();
  const sprayAttr = new THREE.BufferAttribute(positions, 3);
  sprayGeo.setAttribute('position', sprayAttr);
  const spray = new THREE.Points(
    sprayGeo,
    new THREE.PointsMaterial({ color: 0xcfeaf5, size: 0.02, transparent: true, opacity: 0.8, depthWrite: false }),
  );
  spray.userData.disposeMaterial = true;
  group.add(spray);
  return {
    group,
    update: (delta, elapsed) => {
      for (let i = 0; i < count; i++) {
        let y = sprayAttr.getY(i) + delta * (0.4 + phases[i] * 0.4);
        if (y > 1.25) y = 0.76;
        sprayAttr.setY(i, y);
      }
      sprayAttr.needsUpdate = true;
      waterMat.opacity = 0.8 + Math.sin(elapsed * 2) * 0.05;
    },
  };
}

/** A winding brook segment: translucent ribbon with stony banks. */
export function streamRibbon(rng: Rng, pal: Palette, opts: { length?: number } = {}): THREE.Group {
  const length = opts.length ?? 3;
  const g = new THREE.Group();
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 4; i++) {
    pts.push(new THREE.Vector3(-length / 2 + (i / 4) * length, 0.02, rng.jitter(0.4)));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const ribbon = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 24, 0.16, 6),
    new THREE.MeshStandardMaterial({
      color: 0x2e6d94,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.3,
    }),
  );
  ribbon.userData.disposeMaterial = true;
  ribbon.scale.y = 0.18; // flatten the tube into a stream bed
  g.add(ribbon);
  // Banks: stones scattered along both edges.
  for (let i = 0; i < 14; i++) {
    const t = rng.next();
    const p = curve.getPoint(t);
    const side = rng.chance(0.5) ? 1 : -1;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(rng.range(0.04, 0.1), 0), pal.trim);
    stone.position.set(p.x, 0.04, p.z + side * rng.range(0.2, 0.32));
    stone.rotation.set(rng.angle(), rng.angle(), rng.angle());
    g.add(stone);
  }
  return g;
}

/** Stone wishing well: ring wall, roof, crank and bucket. */
export function stoneWell(rng: Rng, pal: Palette): { group: THREE.Group; crank: THREE.Group } {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.7, 14), pal.body);
  ring.position.y = 0.35;
  ring.castShadow = true;
  group.add(ring);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.38, 14), pal.trim);
  hole.rotation.x = -Math.PI / 2;
  hole.position.y = 0.705;
  group.add(hole);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 0.08), pal.soft);
    post.position.set(side * 0.45, 1.15, 0);
    group.add(post);
  }
  for (const s of [-1, 1]) {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.55), pal.trim);
    roof.position.set(0, 1.78, s * 0.22);
    roof.rotation.x = s * -0.6;
    roof.castShadow = true;
    group.add(roof);
  }
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 8), pal.soft);
  axle.rotation.z = Math.PI / 2;
  axle.position.y = 1.55;
  group.add(axle);
  const crank = new THREE.Group();
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.04).translate(0, 0.11, 0), pal.metal);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 6), pal.trim);
  grip.rotation.z = Math.PI / 2;
  grip.position.y = 0.22;
  crank.add(arm, grip);
  crank.position.set(0.52, 1.55, 0);
  crank.rotation.x = rng.angle();
  group.add(crank);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 5), pal.soft);
  rope.position.y = 1.25;
  group.add(rope);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.16, 10), pal.trim);
  bucket.position.y = 0.9;
  group.add(bucket);
  return { group, crank };
}

/** Lily pads with blooms — floats on any water surface. */
export function lilyCluster(rng: Rng, pal: Palette, opts: { radius?: number } = {}): THREE.Group {
  const radius = opts.radius ?? 0.8;
  const g = new THREE.Group();
  const padMat = new THREE.MeshStandardMaterial({ color: 0x2f6b35, roughness: 0.85, side: THREE.DoubleSide });
  let owner = true;
  for (let i = 0, n = 4 + rng.int(4); i < n; i++) {
    const r = rng.range(0.08, 0.16);
    const pad = new THREE.Mesh(new THREE.CircleGeometry(r, 12, 0.4, Math.PI * 1.8), padMat);
    pad.userData.disposeMaterial = owner;
    owner = false;
    pad.rotation.x = -Math.PI / 2;
    pad.rotation.z = rng.angle();
    const a = rng.angle();
    const d = rng.range(0, radius);
    pad.position.set(Math.cos(a) * d, 0.035, Math.sin(a) * d);
    g.add(pad);
    if (rng.chance(0.4)) {
      const bloom = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.07, 7), pal.glow(0xe344c4));
      bloom.position.set(pad.position.x, 0.07, pad.position.z);
      g.add(bloom);
    }
  }
  return g;
}

/** Ceiling drip line: droplets fall from a seam and vanish at the floor. */
export function dripLine(
  rng: Rng,
  opts: { span?: number; height?: number; count?: number } = {},
): { group: THREE.Group; update: (delta: number, elapsed: number) => void } {
  const span = opts.span ?? 2;
  const height = opts.height ?? 2.6;
  const count = opts.count ?? 10;
  const positions = new Float32Array(count * 3);
  const lanes = new Float32Array(count);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    lanes[i] = rng.jitter(span / 2);
    positions[i * 3] = lanes[i];
    positions[i * 3 + 1] = rng.next() * height;
    positions[i * 3 + 2] = rng.jitter(0.05);
    speeds[i] = rng.range(1.2, 2.2);
  }
  const geo = new THREE.BufferGeometry();
  const attr = new THREE.BufferAttribute(positions, 3);
  geo.setAttribute('position', attr);
  const drops = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color: 0xbfe4f5, size: 0.03, transparent: true, opacity: 0.85, depthWrite: false }),
  );
  drops.userData.disposeMaterial = true;
  const group = new THREE.Group();
  group.add(drops);
  return {
    group,
    update: (delta) => {
      for (let i = 0; i < count; i++) {
        let y = attr.getY(i) - delta * speeds[i];
        if (y < 0.02) y = height;
        attr.setY(i, y);
      }
      attr.needsUpdate = true;
    },
  };
}
