import * as THREE from 'three';
import { labelTexture, rackTexture } from '@/core/textures';
import type { BetaKit } from '@/scenery/kits';
import type { Rng } from '@/scenery/rng';

/**
 * Beta scenery — the Neon Future. Parametric tech builders, deterministic per
 * seed. Origins sit on the floor (y = 0) unless noted. Glow comes from
 * emissive materials, not lights — rooms add real lights deliberately (see
 * Dimension's per-room light gating for why).
 *
 * Builders that animate (flicker, blink) return their material(s) so the
 * room's `update` can drive them.
 */

/** A bundle of cables sagging between two points, with drip-loop slack. */
export function cableRun(
  rng: Rng,
  kit: BetaKit,
  from: THREE.Vector3,
  to: THREE.Vector3,
  opts: { cables?: number; sag?: number } = {},
): THREE.Group {
  const cables = opts.cables ?? 4;
  const sag = opts.sag ?? 0.45;
  const g = new THREE.Group();
  for (let i = 0; i < cables; i++) {
    const a = from.clone().add(new THREE.Vector3(rng.jitter(0.06), rng.jitter(0.04), rng.jitter(0.06)));
    const b = to.clone().add(new THREE.Vector3(rng.jitter(0.06), rng.jitter(0.04), rng.jitter(0.06)));
    const droop = sag * rng.range(0.7, 1.3);
    const mid1 = a.clone().lerp(b, 0.35).add(new THREE.Vector3(0, -droop, 0));
    const mid2 = a.clone().lerp(b, 0.65).add(new THREE.Vector3(0, -droop, 0));
    const curve = new THREE.CatmullRomCurve3([a, mid1, mid2, b]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, rng.range(0.012, 0.022), 5), kit.cable));
  }
  return g;
}

/** Parallel conduit pipes running along local Z, clamped to a wall behind them. */
export function conduitRun(
  rng: Rng,
  kit: BetaKit,
  opts: { length?: number; pipes?: number } = {},
): THREE.Group {
  const length = opts.length ?? 4;
  const pipes = opts.pipes ?? 3;
  const g = new THREE.Group();
  for (let i = 0; i < pipes; i++) {
    const r = rng.range(0.03, 0.065);
    const y = 0.12 + i * 0.16 + rng.jitter(0.02);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(r, r, length, 8), kit.steel);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(0, y, 0);
    g.add(pipe);
    // Junction box somewhere along one of the runs.
    if (rng.chance(0.4)) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.2), kit.black);
      box.position.set(0, y, rng.jitter(length * 0.4));
      g.add(box);
    }
  }
  // Brackets pinning the bundle at intervals.
  const brackets = Math.max(2, Math.round(length / 1.2));
  for (let b = 0; b < brackets; b++) {
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12 + pipes * 0.16, 0.08), kit.black);
    clamp.position.set(0, (0.12 + pipes * 0.16) / 2, -length / 2 + (b / (brackets - 1)) * length);
    g.add(clamp);
  }
  return g;
}

// All racks share one front texture — identical hardware off the same line.
let rackFront: THREE.MeshBasicMaterial | null = null;
function getRackFront(): THREE.MeshBasicMaterial {
  rackFront ??= new THREE.MeshBasicMaterial({ map: rackTexture() });
  return rackFront;
}

/**
 * A server cabinet with a lit equipment face and a status LED. Returns the
 * LED material so rooms can blink it.
 */
export function serverRack(
  rng: Rng,
  kit: BetaKit,
  opts: { statusColor?: number } = {},
): { group: THREE.Group; statusMaterial: THREE.MeshBasicMaterial } {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.9, 0.6), kit.black);
  body.position.y = 0.95;
  body.castShadow = true;
  group.add(body);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.78), getRackFront());
  face.position.set(0, 0.95, 0.301);
  group.add(face);
  const statusMaterial = new THREE.MeshBasicMaterial({ color: opts.statusColor ?? 0x2bff88 });
  const status = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.02), statusMaterial);
  status.position.set(rng.range(-0.25, 0.25), 1.86, 0.305);
  status.userData.disposeMaterial = true;
  group.add(status);
  return { group, statusMaterial };
}

/** Vertical ventilation duct with an intake grille. */
export function ventStack(rng: Rng, kit: BetaKit, opts: { height?: number } = {}): THREE.Group {
  const height = opts.height ?? 2.6;
  const g = new THREE.Group();
  const duct = new THREE.Mesh(new THREE.BoxGeometry(0.42, height, 0.42), kit.steel);
  duct.position.y = height / 2;
  duct.castShadow = true;
  g.add(duct);
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), kit.black);
  collar.position.y = height - 0.05;
  g.add(collar);
  // Grille slats over the intake.
  const slats = 5;
  const grilleY = height * rng.range(0.35, 0.55);
  for (let i = 0; i < slats; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.03), kit.black);
    slat.position.set(0, grilleY + i * 0.06, 0.215);
    slat.rotation.x = 0.5;
    g.add(slat);
  }
  return g;
}

/**
 * Floating holographic signage. Origin at the sign's centre. Returns the
 * material so rooms can flicker its opacity.
 */
export function holoSign(
  text: string,
  opts: { color?: string; size?: number } = {},
): { group: THREE.Group; material: THREE.MeshBasicMaterial } {
  const size = opts.size ?? 0.7;
  const material = new THREE.MeshBasicMaterial({
    map: labelTexture(text, opts.color ?? '#54e0ff'),
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const group = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  plate.userData.disposeMaterial = true;
  group.add(plate);
  return { group, material };
}

/** Emissive light strip — glow without a light. Runs along local Z. */
export function lightStrip(
  kit: BetaKit,
  opts: { length?: number; color?: number } = {},
): THREE.Mesh {
  const length = opts.length ?? 2;
  return new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.03, length),
    kit.glow(opts.color ?? 0x1fd1ff),
  );
}

/** Grated maintenance catwalk with railings, running along local Z. */
export function catwalk(rng: Rng, kit: BetaKit, opts: { length?: number; width?: number } = {}): THREE.Group {
  const length = opts.length ?? 4;
  const width = opts.width ?? 1;
  const g = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, length), kit.black);
  deck.position.y = 0.03;
  deck.castShadow = true;
  g.add(deck);
  // Cross-slats suggest grating without a texture.
  const slats = Math.round(length / 0.35);
  for (let i = 0; i < slats; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(width - 0.08, 0.012, 0.03), kit.steel);
    slat.position.set(0, 0.07, -length / 2 + 0.2 + i * 0.35);
    g.add(slat);
  }
  const postCount = Math.max(2, Math.round(length / 1.1));
  for (const side of [-1, 1]) {
    for (let p = 0; p < postCount; p++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), kit.steel);
      post.position.set((side * width) / 2, 0.48, -length / 2 + (p / (postCount - 1)) * length);
      g.add(post);
    }
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, length, 6), kit.steel);
    rail.rotation.x = Math.PI / 2;
    rail.position.set((side * width) / 2, 0.93, 0);
    g.add(rail);
    if (rng.chance(0.5)) {
      const kick = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, length), kit.black);
      kick.position.set((side * width) / 2, 0.11, 0);
      g.add(kick);
    }
  }
  return g;
}

/** A row of stanchions with a glowing barrier line between the endpoints. */
export function barrierLine(
  kit: BetaKit,
  from: THREE.Vector3,
  to: THREE.Vector3,
  opts: { color?: number } = {},
): THREE.Group {
  const color = opts.color ?? 0xff2b3a;
  const g = new THREE.Group();
  const span = from.distanceTo(to);
  const posts = Math.max(2, Math.round(span / 1.2) + 1);
  for (let i = 0; i < posts; i++) {
    const p = from.clone().lerp(to, i / (posts - 1));
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1, 8), kit.black);
    post.position.set(p.x, 0.5, p.z);
    g.add(post);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 8), kit.glow(color));
    cap.position.set(p.x, 1.01, p.z);
    g.add(cap);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.06, span), kit.holo(color));
  beam.position.copy(from.clone().add(to).multiplyScalar(0.5)).setY(0.85);
  beam.lookAt(new THREE.Vector3(to.x, 0.85, to.z));
  g.add(beam);
  return g;
}

/** Wall-mounted pipe manifold: header, drops, flanges, and a lit gauge. */
export function pipeManifold(rng: Rng, kit: BetaKit, opts: { accent?: number } = {}): THREE.Group {
  const accent = opts.accent ?? 0x1fd1ff;
  const g = new THREE.Group();
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 0.06), kit.black);
  back.position.y = 1.1;
  g.add(back);
  const drops = 3 + rng.int(3);
  for (let i = 0; i < drops; i++) {
    const x = -0.55 + (i / (drops - 1)) * 1.1;
    const r = rng.range(0.035, 0.06);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.4, 8), kit.steel);
    pipe.position.set(x, 1.0, 0.1);
    g.add(pipe);
    const flange = new THREE.Mesh(new THREE.TorusGeometry(r + 0.02, 0.015, 6, 14), kit.black);
    flange.rotation.x = Math.PI / 2;
    flange.position.set(x, rng.range(0.7, 1.3), 0.1);
    g.add(flange);
  }
  // Header pipe tying the drops together.
  const header = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.3, 8), kit.steel);
  header.rotation.z = Math.PI / 2;
  header.position.set(0, 1.75, 0.1);
  g.add(header);
  // Gauge with a glowing face.
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 12), kit.black);
  gauge.rotation.x = Math.PI / 2;
  gauge.position.set(rng.jitter(0.4), 1.45, 0.16);
  g.add(gauge);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.065, 12), kit.glow(accent));
  dial.position.set(gauge.position.x, 1.45, 0.19);
  g.add(dial);
  return g;
}

/**
 * Free-standing terminal kiosk with an angled emissive screen. Returns the
 * screen material for flicker/state changes. Screen faces +Z.
 */
export function terminalKiosk(
  rng: Rng,
  kit: BetaKit,
  opts: { color?: number } = {},
): { group: THREE.Group; screenMaterial: THREE.MeshStandardMaterial } {
  const color = opts.color ?? 0x1fd1ff;
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.4), kit.black);
  base.position.y = 0.05;
  group.add(base);
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.85, 0.14), kit.steel);
  stem.position.y = 0.5;
  stem.rotation.x = -0.12;
  group.add(stem);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.4, 0.06), kit.black);
  head.position.set(0, 1.0, 0.08);
  head.rotation.x = -0.45;
  head.castShadow = true;
  group.add(head);
  // Private glow clone so each kiosk's screen can animate independently.
  const screenMaterial = kit.glow(color).clone();
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.32), screenMaterial);
  screen.position.set(0, 1.015, 0.115);
  screen.rotation.x = -0.45;
  screen.userData.disposeMaterial = true;
  group.add(screen);
  if (rng.chance(0.7)) {
    const key = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.12), kit.steel);
    key.position.set(0, 0.82, 0.16);
    key.rotation.x = -0.25;
    group.add(key);
  }
  return { group, screenMaterial };
}

// Hazard stripes are identical everywhere — one cached material.
let hazardMaterial: THREE.MeshBasicMaterial | null = null;
function getHazardMaterial(): THREE.MeshBasicMaterial {
  if (hazardMaterial) return hazardMaterial;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(0, 0, 128, 32);
    ctx.fillStyle = '#15151a';
    for (let x = -32; x < 128; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 32);
      ctx.lineTo(x + 16, 0);
      ctx.lineTo(x + 32, 0);
      ctx.lineTo(x + 16, 32);
      ctx.closePath();
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  hazardMaterial = new THREE.MeshBasicMaterial({
    map: tex,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  return hazardMaterial;
}

/** Hazard-stripe floor decal, `length` long along local Z. Lies flat at y≈0. */
export function hazardDecal(opts: { length?: number; width?: number } = {}): THREE.Mesh {
  const length = opts.length ?? 2;
  const width = opts.width ?? 0.3;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, length), getHazardMaterial());
  mesh.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
  mesh.position.y = 0.012;
  return mesh;
}

/**
 * A wall of surveillance monitors, each tinted from a small palette. Facing
 * +Z, origin at the bottom centre. Returns the per-screen materials so rooms
 * can flicker them out of phase.
 */
export function monitorWall(
  rng: Rng,
  kit: BetaKit,
  opts: { cols?: number; rows?: number } = {},
): { group: THREE.Group; screenMaterials: THREE.MeshStandardMaterial[] } {
  const cols = opts.cols ?? 3;
  const rows = opts.rows ?? 2;
  const palette = [0x1fd1ff, 0x2bff88, 0xffb347, 0xff2b3a];
  const group = new THREE.Group();
  const screenMaterials: THREE.MeshStandardMaterial[] = [];
  const w = 0.55;
  const h = 0.38;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), kit.black);
      const x = (c - (cols - 1) / 2) * (w + 0.06);
      const y = 0.4 + r * (h + 0.06);
      frame.position.set(x, y, 0);
      frame.rotation.y = rng.jitter(0.04);
      group.add(frame);
      const mat = kit.glow(rng.pick(palette)).clone();
      mat.emissiveIntensity = rng.range(0.7, 1.6);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), mat);
      screen.position.set(x, y, 0.04);
      screen.rotation.copy(frame.rotation);
      screen.userData.disposeMaterial = true;
      group.add(screen);
      screenMaterials.push(mat);
    }
  }
  return { group, screenMaterials };
}
