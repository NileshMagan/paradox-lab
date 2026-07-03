import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Light fixtures & glow FX. Everything glows via emissive materials; a real
 * THREE.Light exists ONLY behind an explicit opts.withLight (default off),
 * because lights are the renderer's scarcest resource (see Dimension's
 * per-room gating). Fixtures that animate return their glow material.
 */

/** Half-shade wall lamp washing upward. `glowMaterial` is a private clone. */
export function wallSconce(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; glowMaterial: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.03), pal.trim);
  back.position.set(0, 1.7, 0.015);
  group.add(back);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.06, 0.14, 12, 1, true), pal.metal);
  shade.position.set(0, 1.74, 0.1);
  group.add(shade);
  const glowMaterial = pal.glow(0xffe2b0).clone();
  glowMaterial.emissiveIntensity = 1.4 + rng.jitter(0.3);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), glowMaterial);
  bulb.position.set(0, 1.78, 0.1);
  bulb.userData.disposeMaterial = true;
  group.add(bulb);
  return { group, glowMaterial };
}

/** Work floodlight on a tripod. `head` tilts about x; `light` only with opts.withLight. */
export function floodlightTripod(
  rng: Rng,
  pal: Palette,
  opts: { withLight?: boolean } = {},
): { group: THREE.Group; head: THREE.Group; light: THREE.SpotLight | null } {
  const group = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + rng.jitter(0.1);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.2, 6), pal.metal);
    leg.position.set(Math.cos(a) * 0.28, 0.55, Math.sin(a) * 0.28);
    leg.rotation.z = Math.cos(a) * 0.48;
    leg.rotation.x = -Math.sin(a) * 0.48;
    group.add(leg);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), pal.metal);
  mast.position.y = 1.3;
  group.add(mast);
  const head = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.12), pal.body);
  head.add(box);
  const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.22), pal.glow(0xfff3d0));
  lens.position.z = 0.062;
  head.add(lens);
  const cage = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.14), pal.trim);
  cage.position.y = 0.16;
  head.add(cage);
  head.position.y = 1.62;
  head.rotation.x = -0.3 + rng.jitter(0.1);
  group.add(head);
  let light: THREE.SpotLight | null = null;
  if (opts.withLight) {
    light = new THREE.SpotLight(0xfff3d0, 30, 12, 0.5, 0.5, 1.5);
    light.position.set(0, 0, 0.1);
    light.target.position.set(0, -2, 3);
    head.add(light, light.target);
  }
  return { group, head, light };
}

/** Alarm dome. Spin `rotor` about y for the sweep; flare `glowMaterial`. */
export function emergencyBeacon(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; rotor: THREE.Group; glowMaterial: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.05, 12), pal.trim);
  base.position.y = 0.025;
  group.add(base);
  const glowMaterial = pal.glow(0xff5a2b).clone();
  glowMaterial.emissiveIntensity = 1.8;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), glowMaterial);
  dome.position.y = 0.05;
  dome.userData.disposeMaterial = true;
  group.add(dome);
  // The rotor: an occluding vane inside the dome; spinning it makes the sweep.
  const rotor = new THREE.Group();
  const vane = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.08), pal.body);
  vane.position.set(0, 0.04, 0.04);
  rotor.add(vane);
  rotor.rotation.y = rng.angle();
  group.add(rotor);
  return { group, rotor, glowMaterial };
}

/** Bent neon tube glyph on a dark backboard. `tubeMaterial` flickers well. */
export function neonSign(
  rng: Rng,
  pal: Palette,
  opts: { color?: number } = {},
): { group: THREE.Group; tubeMaterial: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.03), pal.trim);
  board.position.set(0, 1.6, 0);
  group.add(board);
  // One continuous tube along a seeded zigzag-with-loop path.
  const pts: THREE.Vector3[] = [];
  let x = -0.35;
  let y = 1.45;
  pts.push(new THREE.Vector3(x, y, 0.04));
  for (let i = 0; i < 6; i++) {
    x += 0.12;
    y = 1.45 + (i % 2 === 0 ? 0.28 : 0) + rng.jitter(0.05);
    pts.push(new THREE.Vector3(x, y, 0.04));
  }
  const tubeMaterial = pal.glow(opts.color ?? pal.accent).clone();
  tubeMaterial.emissiveIntensity = 2.4;
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.014, 6),
    tubeMaterial,
  );
  tube.userData.disposeMaterial = true;
  group.add(tube);
  return { group, tubeMaterial };
}

/** Melted candle cluster with tiny warm flames. */
export function candleCluster(rng: Rng, pal: Palette, opts: { count?: number } = {}): THREE.Group {
  const count = opts.count ?? 7;
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const r = rng.range(0.02, 0.045);
    const h = rng.range(0.06, 0.24);
    const a = rng.angle();
    const d = rng.range(0, 0.2);
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r, h, 8), pal.soft);
    wax.position.set(x, h / 2, z);
    g.add(wax);
    // Drip lip.
    const lip = new THREE.Mesh(new THREE.TorusGeometry(r * 0.9, r * 0.25, 5, 8), pal.soft);
    lip.rotation.x = Math.PI / 2;
    lip.position.set(x, h - 0.005, z);
    g.add(lip);
    if (rng.chance(0.75)) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.03, 6), pal.glow(0xffd9a0));
      flame.position.set(x, h + 0.02, z);
      g.add(flame);
    }
  }
  return g;
}

/** CEILING: caged lantern on a chain, warm core. Hangs into -Y. */
export function hangingLantern(rng: Rng, pal: Palette, opts: { drop?: number } = {}): THREE.Group {
  const drop = opts.drop ?? 0.8;
  const g = new THREE.Group();
  for (let i = 0; i < Math.round(drop / 0.07); i++) {
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.006, 5, 8), pal.metal);
    link.position.y = -0.04 - i * 0.07;
    link.rotation.y = (i % 2) * (Math.PI / 2);
    link.rotation.x = Math.PI / 2;
    g.add(link);
  }
  const cageY = -drop - 0.18;
  for (const y of [cageY + 0.14, cageY - 0.12]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 12), pal.trim);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    g.add(ring);
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.27, 0.01), pal.trim);
    rib.position.set(Math.cos(a) * 0.09, cageY, Math.sin(a) * 0.09);
    g.add(rib);
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), pal.glow(0xffd9a0));
  core.position.y = cageY + rng.jitter(0.01);
  g.add(core);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.07, 10), pal.metal);
  cap.position.y = cageY + 0.2;
  g.add(cap);
  return g;
}

/** CEILING: catenary of small bulbs between two anchor points along X. */
export function stringLights(
  rng: Rng,
  pal: Palette,
  opts: { span?: number } = {},
): { group: THREE.Group; bulbMaterial: THREE.MeshStandardMaterial } {
  const span = opts.span ?? 3;
  const group = new THREE.Group();
  const sag = 0.3 + rng.next() * 0.15;
  const wire = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-span / 2, 0, 0),
    new THREE.Vector3(rng.jitter(0.2), -sag, rng.jitter(0.1)),
    new THREE.Vector3(span / 2, 0, 0),
  ]);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(wire, 20, 0.006, 4), pal.trim));
  const bulbMaterial = pal.glow(0xffe2b0).clone();
  bulbMaterial.emissiveIntensity = 1.6;
  const bulbs = 8 + rng.int(5);
  for (let i = 0; i < bulbs; i++) {
    const p = wire.getPoint((i + 1) / (bulbs + 1));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), bulbMaterial);
    bulb.position.set(p.x, p.y - 0.04, p.z);
    bulb.userData.disposeMaterial = i === 0; // one owner for the shared clone
    group.add(bulb);
  }
  return { group, bulbMaterial };
}

/** Short truss with two aimable can lights. `cans` rotate about x (tilt) and y (pan). */
export function spotRig(rng: Rng, pal: Palette): { group: THREE.Group; cans: THREE.Group[] } {
  const group = new THREE.Group();
  for (const side of [-0.7, 0.7]) {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.9, 8), pal.metal);
    stand.position.set(side, 0.95, 0);
    group.add(stand);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.04, 10), pal.trim);
    foot.position.set(side, 0.02, 0);
    group.add(foot);
  }
  const truss = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.08), pal.metal);
  truss.position.y = 1.9;
  group.add(truss);
  const cans: THREE.Group[] = [];
  for (const x of [-0.35, 0.35]) {
    const can = new THREE.Group();
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.26, 12), pal.body);
    barrel.rotation.x = Math.PI / 2;
    can.add(barrel);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.075, 12), pal.glow(0xfff3d0));
    lens.position.z = 0.135;
    can.add(lens);
    can.position.set(x, 1.82, 0);
    can.rotation.x = -0.5 + rng.jitter(0.2);
    can.rotation.y = rng.jitter(0.5);
    group.add(can);
    cans.push(can);
  }
  return { group, cans };
}

/** Floor-level rope light snaking along a seeded curve — wayfinding. */
export function glowRope(rng: Rng, pal: Palette, opts: { length?: number } = {}): THREE.Group {
  const length = opts.length ?? 3;
  const g = new THREE.Group();
  const pts: THREE.Vector3[] = [];
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    pts.push(new THREE.Vector3(-length / 2 + (i / steps) * length, 0.03, rng.jitter(0.35)));
  }
  const rope = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.018, 6),
    pal.glow(),
  );
  g.add(rope);
  // Anchor clips pin it down every so often.
  for (let i = 1; i < steps; i++) {
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.06), pal.trim);
    clip.position.copy(pts[i]).setY(0.015);
    g.add(clip);
  }
  return g;
}

/** Flat edge-lit panel in a slim frame (wall or ceiling). */
export function lightPanel(
  pal: Palette,
  opts: { width?: number; height?: number } = {},
): { group: THREE.Group; panelMaterial: THREE.MeshStandardMaterial } {
  const width = opts.width ?? 1.1;
  const height = opts.height ?? 0.6;
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, height + 0.06, 0.04), pal.trim);
  frame.position.set(0, 1.6, 0);
  group.add(frame);
  const panelMaterial = pal.glow(0xf4f9ff).clone();
  panelMaterial.emissiveIntensity = 1.2;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, height), panelMaterial);
  panel.position.set(0, 1.6, 0.022);
  panel.userData.disposeMaterial = true;
  group.add(panel);
  return { group, panelMaterial };
}
