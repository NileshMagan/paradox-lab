import * as THREE from 'three';
import type { Rng } from '@/scenery/rng';

/**
 * Weather & atmosphere FX — the layer that makes a themed room feel ALIVE.
 * These are animated: every builder returns `{ group, update }`; call the
 * update from the room's per-frame hook (they're cheap — points and a few
 * translucent planes, no lights). Theme-agnostic by design: colours come from
 * opts, not palettes, so snow works in a city and embers work in a tomb.
 *
 * All motion derives from seeded per-particle phases + elapsed time, so two
 * clients render the same weather.
 */

export interface WeatherFx {
  group: THREE.Group;
  update: (delta: number, elapsed: number) => void;
}

interface Area3 {
  width: number;
  height: number;
  depth: number;
}

function pointsCloud(
  rng: Rng,
  count: number,
  area: Area3,
  material: THREE.PointsMaterial,
): { points: THREE.Points; positions: THREE.BufferAttribute; phases: Float32Array } {
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = rng.jitter(area.width / 2);
    positions[i * 3 + 1] = rng.next() * area.height;
    positions[i * 3 + 2] = rng.jitter(area.depth / 2);
    phases[i] = rng.next() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  const attr = new THREE.BufferAttribute(positions, 3);
  geo.setAttribute('position', attr);
  const points = new THREE.Points(geo, material);
  points.userData.disposeMaterial = true;
  return { points, positions: attr, phases };
}

/** Falling snow with per-flake drift. Fill a room: area ≈ the room size. */
export function snowfall(
  rng: Rng,
  opts: { width?: number; height?: number; depth?: number; count?: number } = {},
): WeatherFx {
  const area = { width: opts.width ?? 8, height: opts.height ?? 4, depth: opts.depth ?? 8 };
  const count = opts.count ?? 350;
  const mat = new THREE.PointsMaterial({
    color: 0xf2f7fa,
    size: 0.035,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const { points, positions, phases } = pointsCloud(rng, count, area, mat);
  const group = new THREE.Group();
  group.add(points);
  return {
    group,
    update: (delta, elapsed) => {
      for (let i = 0; i < count; i++) {
        let y = positions.getY(i) - delta * (0.35 + (phases[i] % 1) * 0.3);
        if (y < 0) y = area.height;
        positions.setY(i, y);
        positions.setX(i, positions.getX(i) + Math.sin(elapsed * 0.8 + phases[i]) * delta * 0.18);
      }
      positions.needsUpdate = true;
    },
  };
}

/** Driving rain: fast streaks (line segments), heavier than snow. */
export function rainfall(
  rng: Rng,
  opts: { width?: number; height?: number; depth?: number; count?: number } = {},
): WeatherFx {
  const area = { width: opts.width ?? 8, height: opts.height ?? 4.5, depth: opts.depth ?? 8 };
  const count = opts.count ?? 220;
  const positions = new Float32Array(count * 6);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const x = rng.jitter(area.width / 2);
    const y = rng.next() * area.height;
    const z = rng.jitter(area.depth / 2);
    positions.set([x, y, z, x + 0.03, y + 0.28, z], i * 6);
    speeds[i] = 5 + rng.next() * 3;
  }
  const geo = new THREE.BufferGeometry();
  const attr = new THREE.BufferAttribute(positions, 3);
  geo.setAttribute('position', attr);
  const lines = new THREE.LineSegments(
    geo,
    new THREE.LineBasicMaterial({ color: 0x9fc4e0, transparent: true, opacity: 0.4 }),
  );
  lines.userData.disposeMaterial = true;
  const group = new THREE.Group();
  group.add(lines);
  return {
    group,
    update: (delta) => {
      for (let i = 0; i < count; i++) {
        let y = attr.getY(i * 2) - delta * speeds[i];
        if (y < 0) y = area.height;
        attr.setY(i * 2, y);
        attr.setY(i * 2 + 1, y + 0.28);
      }
      attr.needsUpdate = true;
    },
  };
}

/** Hanging fog: overlapping translucent sheets that drift and breathe. */
export function fogBank(
  rng: Rng,
  opts: { width?: number; depth?: number; color?: number } = {},
): WeatherFx {
  const width = opts.width ?? 8;
  const depth = opts.depth ?? 8;
  const group = new THREE.Group();
  const sheets: Array<{ mesh: THREE.Mesh; base: number; phase: number }> = [];
  for (let i = 0; i < 5; i++) {
    // One material per sheet — each breathes on its own phase.
    const mat = new THREE.MeshBasicMaterial({
      color: opts.color ?? 0xcfd4da,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.9, 1.6), mat);
    sheet.userData.disposeMaterial = true;
    sheet.position.set(rng.jitter(width / 4), 0.9 + rng.next() * 1.4, rng.jitter(depth / 2));
    sheet.rotation.y = rng.angle();
    group.add(sheet);
    sheets.push({ mesh: sheet, base: sheet.position.x, phase: rng.angle() });
  }
  return {
    group,
    update: (_delta, elapsed) => {
      for (const s of sheets) {
        s.mesh.position.x = s.base + Math.sin(elapsed * 0.12 + s.phase) * 0.8;
        (s.mesh.material as THREE.MeshBasicMaterial).opacity =
          0.055 + Math.sin(elapsed * 0.3 + s.phase) * 0.025;
      }
    },
  };
}

/** Knee-height rolling mist for crypts, swamps, and cold floors. */
export function groundMist(
  rng: Rng,
  opts: { width?: number; depth?: number; color?: number } = {},
): WeatherFx {
  const width = opts.width ?? 8;
  const depth = opts.depth ?? 8;
  const group = new THREE.Group();
  const pads: Array<{ mesh: THREE.Mesh; phase: number }> = [];
  for (let i = 0; i < 7; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: opts.color ?? 0xd8dde2,
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
    });
    const pad = new THREE.Mesh(new THREE.CircleGeometry(rng.range(0.8, 1.6), 14), mat);
    pad.userData.disposeMaterial = true;
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(rng.jitter(width / 2), 0.12 + rng.next() * 0.3, rng.jitter(depth / 2));
    group.add(pad);
    pads.push({ mesh: pad, phase: rng.angle() });
  }
  return {
    group,
    update: (delta, elapsed) => {
      for (const p of pads) {
        p.mesh.position.x += delta * 0.08;
        if (p.mesh.position.x > width / 2) p.mesh.position.x = -width / 2;
        (p.mesh.material as THREE.MeshBasicMaterial).opacity =
          0.05 + Math.sin(elapsed * 0.4 + p.phase) * 0.02;
      }
    },
  };
}

/** Sunlit dust motes drifting upward — humid, still air. */
export function dustMotes(
  rng: Rng,
  opts: { width?: number; height?: number; depth?: number; count?: number; color?: number } = {},
): WeatherFx {
  const area = { width: opts.width ?? 6, height: opts.height ?? 4, depth: opts.depth ?? 6 };
  const count = opts.count ?? 200;
  const mat = new THREE.PointsMaterial({
    color: opts.color ?? 0xffe6b0,
    size: 0.02,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const { points, positions } = pointsCloud(rng, count, area, mat);
  const group = new THREE.Group();
  group.add(points);
  return {
    group,
    update: (delta) => {
      for (let i = 0; i < count; i++) {
        let y = positions.getY(i) + delta * 0.05;
        if (y > area.height) y = 0;
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
    },
  };
}

/** Autumn leaves fluttering down — swaying fall plus tumble. */
export function fallingLeaves(
  rng: Rng,
  opts: { width?: number; height?: number; depth?: number; count?: number } = {},
): WeatherFx {
  const area = { width: opts.width ?? 6, height: opts.height ?? 3.5, depth: opts.depth ?? 6 };
  const count = opts.count ?? 26;
  const group = new THREE.Group();
  const palette = [0xc77b30, 0xa8552a, 0xd9a441, 0x8a6b3a];
  const leaves: Array<{ mesh: THREE.Mesh; speed: number; phase: number }> = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: palette[rng.int(palette.length)],
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.09), mat);
    leaf.userData.disposeMaterial = true;
    leaf.position.set(rng.jitter(area.width / 2), rng.next() * area.height, rng.jitter(area.depth / 2));
    group.add(leaf);
    leaves.push({ mesh: leaf, speed: rng.range(0.25, 0.5), phase: rng.angle() });
  }
  return {
    group,
    update: (delta, elapsed) => {
      for (const l of leaves) {
        l.mesh.position.y -= delta * l.speed;
        if (l.mesh.position.y < 0) l.mesh.position.y = area.height;
        l.mesh.position.x += Math.sin(elapsed * 1.4 + l.phase) * delta * 0.4;
        l.mesh.rotation.set(elapsed * 1.2 + l.phase, l.phase, elapsed * 0.8);
      }
    },
  };
}

/** Rising embers for fires, forges, and scorched reactors. */
export function emberSparks(
  rng: Rng,
  opts: { radius?: number; height?: number; count?: number } = {},
): WeatherFx {
  const radius = opts.radius ?? 0.6;
  const height = opts.height ?? 2;
  const count = opts.count ?? 60;
  const mat = new THREE.PointsMaterial({
    color: 0xff8a3a,
    size: 0.03,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const { points, positions, phases } = pointsCloud(
    rng,
    count,
    { width: radius * 2, height, depth: radius * 2 },
    mat,
  );
  const group = new THREE.Group();
  group.add(points);
  return {
    group,
    update: (delta, elapsed) => {
      for (let i = 0; i < count; i++) {
        let y = positions.getY(i) + delta * (0.5 + (phases[i] % 1) * 0.6);
        if (y > height) y = 0;
        positions.setY(i, y);
        positions.setX(i, positions.getX(i) + Math.sin(elapsed * 2.2 + phases[i]) * delta * 0.12);
      }
      positions.needsUpdate = true;
    },
  };
}

/**
 * Storm lightning: a jagged bolt that strobes at seeded intervals with a sky
 * flash behind it. Pair with rainfall.
 */
export function lightningRig(
  rng: Rng,
  opts: { height?: number; period?: number } = {},
): WeatherFx {
  const height = opts.height ?? 4;
  const period = opts.period ?? rng.range(4, 7);
  const group = new THREE.Group();
  const pts: THREE.Vector3[] = [];
  let x = 0;
  for (let i = 0; i <= 6; i++) {
    pts.push(new THREE.Vector3(x, height - (i / 6) * height, rng.jitter(0.1)));
    x += rng.jitter(0.4);
  }
  const boltMat = new THREE.MeshBasicMaterial({ color: 0xeaf4ff });
  const bolt = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.02, 4), boltMat);
  bolt.userData.disposeMaterial = true;
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xdfe9ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(3, height), flashMat);
  flash.userData.disposeMaterial = true;
  flash.position.set(0, height / 2, -0.5);
  bolt.visible = false;
  group.add(bolt, flash);
  return {
    group,
    update: (_delta, elapsed) => {
      // Strobe pattern inside a short window once per period: on-off-on.
      const t = elapsed % period;
      const strobing = t < 0.35 && (t < 0.08 || (t > 0.15 && t < 0.28));
      bolt.visible = strobing;
      flashMat.opacity = strobing ? 0.28 : Math.max(0, flashMat.opacity - 0.05);
    },
  };
}

/** A drifting cluster of soft cloud puffs (for vista ceilings and skies). */
export function cloudPuffs(
  rng: Rng,
  opts: { width?: number; count?: number } = {},
): WeatherFx {
  const width = opts.width ?? 4;
  const count = opts.count ?? 5;
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xe8eef4,
    transparent: true,
    opacity: 0.5,
    roughness: 1,
  });
  for (let i = 0; i < count; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(rng.range(0.3, 0.7), 10, 7), mat);
    puff.userData.disposeMaterial = i === 0;
    puff.position.set(rng.jitter(width / 2), rng.jitter(0.3), rng.jitter(0.6));
    puff.scale.y = 0.55;
    group.add(puff);
  }
  group.position.y = 2.6;
  const drift = rng.range(0.05, 0.12);
  return {
    group,
    update: (delta, elapsed) => {
      group.position.x += delta * drift;
      if (group.position.x > width) group.position.x = -width;
      group.position.y = 2.6 + Math.sin(elapsed * 0.3) * 0.08;
    },
  };
}

/** Volumetric-feeling god-ray sheets slanting from above, gently pulsing. */
export function godRays(
  rng: Rng,
  opts: { color?: number; height?: number; count?: number } = {},
): WeatherFx {
  const color = opts.color ?? 0xffe2a8;
  const height = opts.height ?? 4;
  const count = opts.count ?? 3;
  const group = new THREE.Group();
  const mats: Array<{ mat: THREE.MeshBasicMaterial; phase: number }> = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ray = new THREE.Mesh(new THREE.PlaneGeometry(rng.range(0.5, 1.2), height + 1), mat);
    ray.userData.disposeMaterial = true;
    ray.position.set(rng.jitter(1.4), height / 2, rng.jitter(1.4));
    ray.rotation.set(0, rng.angle(), -0.3 + rng.jitter(0.1));
    group.add(ray);
    mats.push({ mat, phase: rng.angle() });
  }
  return {
    group,
    update: (_delta, elapsed) => {
      for (const r of mats) r.mat.opacity = 0.045 + Math.sin(elapsed * 0.5 + r.phase) * 0.02;
    },
  };
}
