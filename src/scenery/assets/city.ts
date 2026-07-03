import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * City street — urban furniture (pairs with the 'streets' palette).
 * Origins on the floor; graffitiWall is a wall prop facing +Z.
 */

/** Curved-arm street lamp with a glowing cobra head. */
export function streetLamp(rng: Rng, pal: Palette, opts: { height?: number } = {}): THREE.Group {
  const height = opts.height ?? 3;
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.5, 10), pal.trim);
  base.position.y = 0.25;
  g.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, height - 0.5, 10), pal.metal);
  pole.position.y = 0.5 + (height - 0.5) / 2;
  pole.castShadow = true;
  g.add(pole);
  const arm = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, height - 0.05, 0),
        new THREE.Vector3(0, height + 0.28, 0.35),
        new THREE.Vector3(0, height + 0.22, 0.75),
      ),
      10,
      0.035,
      8,
    ),
    pal.metal,
  );
  g.add(arm);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.4), pal.trim);
  head.position.set(0, height + 0.2, 0.78);
  g.add(head);
  const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.34), pal.glow(0xffe2b0));
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, height + 0.165, 0.78);
  lens.rotation.z = rng.jitter(0.02);
  g.add(lens);
  return g;
}

/** Traffic light on a pole. `lampMaterials` = [red, amber, green] clones. */
export function trafficLight(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; lampMaterials: THREE.MeshStandardMaterial[] } {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.6, 10), pal.metal);
  pole.position.y = 1.3;
  group.add(pole);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.72, 0.2), pal.trim);
  head.position.y = 2.5;
  head.rotation.y = rng.jitter(0.1);
  head.castShadow = true;
  group.add(head);
  const lampMaterials: THREE.MeshStandardMaterial[] = [];
  [0xff2b3a, 0xffb347, 0x2bff88].forEach((color, i) => {
    const mat = pal.glow(color).clone();
    mat.emissiveIntensity = i === 0 ? 2 : 0.15; // red phase by default
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 12), mat);
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(0, 2.72 - i * 0.22, 0.11);
    lamp.rotation.z = head.rotation.y;
    lamp.userData.disposeMaterial = true;
    group.add(lamp);
    lampMaterials.push(mat);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.1), pal.trim);
    visor.position.set(0, 2.8 - i * 0.22, 0.13);
    group.add(visor);
  });
  return { group, lampMaterials };
}

/** Squat fire hydrant with side caps and chain. */
export function fireHydrant(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.6, 12), pal.glow(0xff5a2b));
  barrel.position.y = 0.3;
  barrel.castShadow = true;
  g.add(barrel);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), pal.trim);
  dome.position.y = 0.6;
  g.add(dome);
  const bonnet = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.09, 8), pal.trim);
  bonnet.position.y = 0.71;
  g.add(bonnet);
  for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    if (a !== 0 && rng.chance(0.3)) continue;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.08, 8), pal.trim);
    cap.rotation.z = Math.PI / 2;
    cap.rotation.y = a;
    cap.position.set(Math.sin(a) * 0.17, 0.42, Math.cos(a) * 0.17);
    g.add(cap);
  }
  return g;
}

/** Curbside mailbox on legs with a drop flap. */
export function mailbox(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.45), pal.body);
  body.position.y = 0.85;
  body.castShadow = true;
  g.add(body);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.55, 12, 1, false, 0, Math.PI), pal.body);
  roof.rotation.z = Math.PI / 2;
  roof.rotation.y = Math.PI / 2;
  roof.position.y = 1.1;
  g.add(roof);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.02), pal.trim);
  flap.position.set(0, 1.02, 0.23);
  flap.rotation.x = rng.chance(0.4) ? -0.7 : -0.1; // sometimes hanging open
  g.add(flap);
  for (const [x, z] of [
    [-0.2, -0.15],
    [0.2, -0.15],
    [-0.2, 0.15],
    [0.2, 0.15],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.6, 6), pal.metal);
    leg.position.set(x, 0.3, z);
    g.add(leg);
  }
  const slotPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.05), pal.trim);
  slotPlate.position.set(0, 0.88, 0.226);
  g.add(slotPlate);
  return g;
}

/** Alley dumpster. `lid` hinges at the back edge about x. */
export function dumpster(rng: Rng, pal: Palette): { group: THREE.Group; lid: THREE.Group } {
  const group = new THREE.Group();
  const bin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.85, 0.85), pal.body);
  bin.position.y = 0.55;
  bin.castShadow = true;
  group.add(bin);
  for (const x of [-0.6, 0.6]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 10), pal.trim);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.07, 0.3);
    group.add(wheel);
  }
  // Side sled rails for the truck forks.
  for (const y of [0.35, 0.6]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.05, 0.06), pal.trim);
    rail.position.set(0, y, 0.44);
    group.add(rail);
  }
  const lid = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.05, 0.84).translate(0, 0.025, 0.42), pal.trim);
  lid.add(slab);
  lid.position.set(0, 0.975, -0.42);
  lid.rotation.x = rng.chance(0.6) ? -0.55 - rng.next() * 0.4 : 0; // propped open by the trash
  group.add(lid);
  if (lid.rotation.x !== 0) {
    // Overflowing bags.
    for (let i = 0; i < 3; i++) {
      const bag = new THREE.Mesh(new THREE.SphereGeometry(rng.range(0.12, 0.2), 8, 6), pal.soft);
      bag.position.set(rng.jitter(0.6), 1.02, rng.jitter(0.2));
      bag.scale.y = 0.8;
      group.add(bag);
    }
  }
  return { group, lid };
}

/** Bus shelter: frame, glass panes, bench, lit ad panel. */
export function busShelter(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  for (const x of [-1.1, 1.1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.3, 0.08), pal.metal);
    post.position.set(x, 1.15, -0.35);
    g.add(post);
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 1.1), pal.trim);
  roof.position.set(0, 2.32, 0);
  roof.rotation.x = -0.04;
  roof.castShadow = true;
  g.add(roof);
  const backGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.7), pal.glass);
  backGlass.position.set(0, 1.15, -0.38);
  g.add(backGlass);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.35), pal.metal);
  bench.position.set(-0.2, 0.5, -0.15);
  g.add(bench);
  for (const x of [-0.9, 0.5]) {
    const benchLeg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.3), pal.trim);
    benchLeg.position.set(x, 0.25, -0.15);
    g.add(benchLeg);
  }
  // Lit advertisement panel on one end.
  const ad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.75), pal.trim);
  ad.position.set(1.14, 1.05, 0.1);
  g.add(ad);
  const adFace = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.4), pal.glow(0xdfe9ff));
  adFace.rotation.y = -Math.PI / 2;
  adFace.position.set(1.09, 1.05, 0.1);
  adFace.rotation.z = rng.jitter(0.01);
  g.add(adFace);
  return g;
}

/** Graffiti-tagged wall section (procedural tag, seeded). */
export function graffitiWall(rng: Rng, pal: Palette, opts: { width?: number } = {}): THREE.Group {
  const width = opts.width ?? 2;
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, 2.2, 0.1), pal.body);
  wall.position.y = 1.1;
  wall.castShadow = true;
  g.add(wall);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Bubble-letter tag: fat overlapping strokes with an outline + drips.
    const hue = rng.int(360);
    ctx.lineCap = 'round';
    for (const [w, style] of [
      [26, `hsl(${hue}, 80%, 55%)`],
      [16, `hsl(${(hue + 40) % 360}, 90%, 70%)`],
    ] as const) {
      ctx.strokeStyle = style;
      ctx.lineWidth = w;
      ctx.beginPath();
      let x = 30;
      ctx.moveTo(x, 90 + rng.jitter(20));
      for (let i = 0; i < 5; i++) {
        x += 40;
        ctx.quadraticCurveTo(x - 20, 30 + rng.int(40), x, 80 + rng.jitter(30));
      }
      ctx.stroke();
    }
    // Drips.
    ctx.strokeStyle = `hsl(${hue}, 80%, 55%)`;
    ctx.lineWidth = 4;
    for (let i = 0; i < 5; i++) {
      const dx = 40 + rng.int(180);
      ctx.beginPath();
      ctx.moveTo(dx, 100);
      ctx.lineTo(dx, 115 + rng.int(30));
      ctx.stroke();
    }
  }
  const tag = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.2, (width - 0.2) * 0.62),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }),
  );
  tag.userData.disposeMaterial = true;
  tag.position.set(0, 1.2, 0.052);
  tag.rotation.z = rng.jitter(0.03);
  g.add(tag);
  return g;
}

/** Manhole cover set into a shallow collar, lies flush with the floor. */
export function manholeCover(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 20), pal.trim);
  collar.position.y = 0.015;
  g.add(collar);
  const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.035, 20), pal.metal);
  cover.position.y = 0.028;
  cover.rotation.y = rng.angle();
  g.add(cover);
  // Radial tread pattern.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + cover.rotation.y;
    const tread = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.006, 0.03), pal.trim);
    tread.position.set(Math.cos(a) * 0.15, 0.048, Math.sin(a) * 0.15);
    tread.rotation.y = -a;
    g.add(tread);
  }
  return g;
}

/** Storefront awning on wall brackets with a hanging OPEN sign. */
export function storefrontAwning(rng: Rng, pal: Palette, opts: { width?: number } = {}): THREE.Group {
  const width = opts.width ?? 2.2;
  const g = new THREE.Group();
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, 0.9), pal.soft);
  canopy.position.set(0, 2.25, 0.45);
  canopy.rotation.x = 0.35;
  canopy.castShadow = true;
  g.add(canopy);
  // Scalloped valance: alternating tabs along the front edge.
  const tabs = Math.round(width / 0.28);
  for (let i = 0; i < tabs; i++) {
    const tab = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.16), i % 2 ? pal.soft : pal.glow());
    tab.position.set(-width / 2 + 0.14 + i * 0.28, 2.05, 0.86);
    tab.rotation.x = rng.jitter(0.05);
    g.add(tab);
  }
  for (const x of [-width / 2 + 0.2, width / 2 - 0.2]) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.95, 6), pal.metal);
    strut.position.set(x, 2.08, 0.44);
    strut.rotation.x = 0.8;
    g.add(strut);
  }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.22), pal.glow(0xff5a2b));
  sign.position.set(rng.jitter(0.4), 1.65, 0.1);
  sign.rotation.z = rng.jitter(0.06);
  g.add(sign);
  return g;
}

/** Classic phone booth with glass sides and a lit crown. */
export function phoneBooth(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  for (const [x, z] of [
    [-0.4, -0.4],
    [-0.4, 0.4],
    [0.4, -0.4],
    [0.4, 0.4],
  ]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.3, 0.08), pal.body);
    post.position.set(x, 1.15, z);
    g.add(post);
  }
  for (const [rx, rz, ry] of [
    [0, -0.4, 0],
    [-0.4, 0, Math.PI / 2],
    [0.4, 0, Math.PI / 2],
  ]) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.9), pal.glass);
    pane.position.set(rx, 1.15, rz);
    pane.rotation.y = ry;
    g.add(pane);
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1, 0.12, 1), pal.body);
  roof.position.y = 2.36;
  roof.castShadow = true;
  g.add(roof);
  const crown = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.9), pal.glow(0xffe2b0));
  crown.position.y = 2.52;
  g.add(crown);
  // The phone unit inside.
  const unit = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.4, 0.12), pal.trim);
  unit.position.set(0, 1.35, -0.3);
  g.add(unit);
  const handset = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.2, 8), pal.body);
  handset.position.set(rng.chance(0.2) ? 0.2 : 0.09, 1.42, -0.28);
  handset.rotation.z = 0.3;
  g.add(handset);
  return g;
}
