import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Vistas & structures — what players see THROUGH windows, plus building-scale
 * pieces. A window with a believable "outside" sells a themed room harder
 * than any prop inside it. Panoramas are seeded procedural paintings, so the
 * view out of a window is identical for every player in a session.
 */

export type VistaKind = 'city-night' | 'mountains' | 'desert' | 'forest' | 'ocean';

/** Seeded painted panorama texture — the world beyond the glass. */
export function vistaPanorama(rng: Rng, kind: VistaKind): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, 256);
    if (kind === 'city-night') {
      sky.addColorStop(0, '#060a18');
      sky.addColorStop(1, '#1a2340');
    } else if (kind === 'mountains') {
      sky.addColorStop(0, '#7fb2d9');
      sky.addColorStop(1, '#d9e6ee');
    } else if (kind === 'desert') {
      sky.addColorStop(0, '#f2b95e');
      sky.addColorStop(1, '#e8863a');
    } else if (kind === 'forest') {
      sky.addColorStop(0, '#9fb8a8');
      sky.addColorStop(1, '#5d7a63');
    } else {
      sky.addColorStop(0, '#8fc4e8');
      sky.addColorStop(1, '#cfe8f5');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 512, 256);

    if (kind === 'city-night') {
      // Moon + two depths of towers with lit windows.
      ctx.fillStyle = '#e8ecf2';
      ctx.beginPath();
      ctx.arc(80 + rng.int(340), 45 + rng.int(30), 14, 0, Math.PI * 2);
      ctx.fill();
      for (const [shade, base] of [
        ['#141b30', 110],
        ['#0a0f1f', 150],
      ] as const) {
        ctx.fillStyle = shade;
        for (let x = 0; x < 512; ) {
          const w = 24 + rng.int(50);
          const h = 40 + rng.int(base);
          ctx.fillRect(x, 256 - h, w, h);
          // Lit windows.
          ctx.fillStyle = '#ffd98a';
          for (let wy = 256 - h + 6; wy < 248; wy += 12) {
            for (let wx = x + 4; wx < x + w - 5; wx += 10) {
              if (rng.chance(0.3)) ctx.fillRect(wx, wy, 4, 6);
            }
          }
          ctx.fillStyle = shade;
          x += w + rng.int(10);
        }
      }
    } else if (kind === 'mountains') {
      for (const [shade, base, jag] of [
        ['#a8bfd0', 120, 55],
        ['#5d7590', 170, 75],
      ] as const) {
        ctx.fillStyle = shade;
        ctx.beginPath();
        ctx.moveTo(0, 256);
        for (let x = 0; x <= 512; x += 52) ctx.lineTo(x, base - rng.int(jag));
        ctx.lineTo(512, 256);
        ctx.fill();
      }
      // Snow caps: white ticks along the far ridge.
      ctx.strokeStyle = '#f2f7fa';
      ctx.lineWidth = 5;
      for (let x = 20; x < 512; x += 70 + rng.int(30)) {
        ctx.beginPath();
        ctx.moveTo(x, 96 + rng.int(30));
        ctx.lineTo(x + 20, 108 + rng.int(24));
        ctx.stroke();
      }
    } else if (kind === 'desert') {
      ctx.fillStyle = '#fadf9a';
      ctx.beginPath();
      ctx.arc(90 + rng.int(330), 60, 22, 0, Math.PI * 2);
      ctx.fill();
      for (const [shade, y] of [
        ['#d9a04e', 150],
        ['#b87a33', 195],
      ] as const) {
        ctx.fillStyle = shade;
        ctx.beginPath();
        ctx.moveTo(0, 256);
        for (let x = 0; x <= 512; x += 128) {
          ctx.quadraticCurveTo(x + 64, y - rng.int(30), x + 128, y + rng.int(20));
        }
        ctx.lineTo(512, 256);
        ctx.fill();
      }
    } else if (kind === 'forest') {
      for (const [shade, base] of [
        ['#42594a', 140],
        ['#26362b', 190],
      ] as const) {
        ctx.fillStyle = shade;
        for (let x = -10; x < 512; x += 26 + rng.int(14)) {
          const h = 60 + rng.int(70);
          ctx.beginPath();
          ctx.moveTo(x, base + 60);
          ctx.lineTo(x + 15, base + 60 - h);
          ctx.lineTo(x + 30, base + 60);
          ctx.fill();
        }
      }
    } else {
      // Ocean: horizon band + wave strokes + sun glints.
      ctx.fillStyle = '#2e6d94';
      ctx.fillRect(0, 150, 512, 106);
      ctx.strokeStyle = 'rgba(230, 245, 255, 0.5)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) {
        const y = 160 + rng.int(90);
        const x = rng.int(460);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 20 + rng.int(40), y);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255, 244, 200, 0.7)';
      for (let y = 152; y < 240; y += 8) ctx.fillRect(250 + rng.jitter(14), y, 12, 3);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Window with a lit view outside: frame, glass, and a recessed light-box
 * holding a panorama. Put it on any wall and the room has an "outside".
 * Returns the panorama material so day/night can be dimmed.
 */
export function windowVista(
  rng: Rng,
  pal: Palette,
  opts: { kind?: VistaKind; width?: number; height?: number } = {},
): { group: THREE.Group; viewMaterial: THREE.MeshStandardMaterial } {
  const kind = opts.kind ?? 'city-night';
  const width = opts.width ?? 1.1;
  const height = opts.height ?? 0.9;
  const group = new THREE.Group();
  const sill = 1;
  // Recess box (the "wall thickness" behind the frame).
  const depth = 0.35;
  for (const side of [-1, 1]) {
    const reveal = new THREE.Mesh(new THREE.BoxGeometry(0.06, height, depth), pal.body);
    reveal.position.set((side * (width + 0.06)) / 2, sill + height / 2, -depth / 2);
    group.add(reveal);
  }
  for (const y of [sill - 0.03, sill + height + 0.03]) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(width + 0.18, 0.06, depth), pal.body);
    cap.position.set(0, y, -depth / 2);
    group.add(cap);
  }
  // The view: emissive-lit panorama at the back of the recess.
  const viewMaterial = new THREE.MeshStandardMaterial({
    map: vistaPanorama(rng, kind),
    emissiveMap: vistaPanorama(rng.fork('glowcopy'), kind),
    emissive: 0xffffff,
    emissiveIntensity: 0.55,
    roughness: 1,
  });
  const view = new THREE.Mesh(new THREE.PlaneGeometry(width + 0.3, height + 0.2), viewMaterial);
  view.userData.disposeMaterial = true;
  view.position.set(0, sill + height / 2, -depth + 0.01);
  group.add(view);
  // Frame + mullions + glass, flush with the wall plane.
  const frameMat = pal.trim;
  const bar = (w: number, h: number, x: number, y: number): THREE.Mesh => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), frameMat);
    m.position.set(x, y, 0);
    return m;
  };
  group.add(
    bar(width + 0.12, 0.07, 0, sill),
    bar(width + 0.12, 0.07, 0, sill + height),
    bar(0.07, height, -width / 2, sill + height / 2),
    bar(0.07, height, width / 2, sill + height / 2),
    bar(0.045, height, 0, sill + height / 2),
  );
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(width, height), pal.glass);
  glass.position.set(0, sill + height / 2, -0.01);
  group.add(glass);
  return { group, viewMaterial };
}

/**
 * Multi-storey building facade with a seeded pattern of lit windows — an
 * exterior for city scenes or the far side of a courtyard.
 */
export function buildingFacade(
  rng: Rng,
  pal: Palette,
  opts: { floors?: number; bays?: number } = {},
): THREE.Group {
  const floors = opts.floors ?? 3;
  const bays = opts.bays ?? 4;
  const width = bays * 0.8 + 0.4;
  const height = floors * 1.1 + 0.5;
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.2), pal.body);
  wall.position.y = height / 2;
  wall.castShadow = true;
  g.add(wall);
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(width + 0.14, 0.18, 0.3), pal.trim);
  parapet.position.y = height + 0.09;
  g.add(parapet);
  for (let f = 0; f < floors; f++) {
    const y = 0.9 + f * 1.1;
    // Floor string-course line.
    const course = new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, 0.05, 0.24), pal.trim);
    course.position.set(0, y - 0.45, 0);
    g.add(course);
    for (let b = 0; b < bays; b++) {
      const x = (b - (bays - 1) / 2) * 0.8;
      if (f === 0 && b === Math.floor(bays / 2)) {
        // Ground-floor entrance.
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.95, 0.06), pal.trim);
        door.position.set(x, 0.48, 0.11);
        g.add(door);
        const transom = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.12), pal.glow(0xffe2b0));
        transom.position.set(x, 1.04, 0.14);
        g.add(transom);
        continue;
      }
      const lit = rng.chance(0.45);
      const pane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.44, 0.6),
        lit ? pal.glow(0xffd98a) : pal.glass,
      );
      pane.position.set(x, y, 0.101);
      g.add(pane);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 0.06), pal.trim);
      lintel.position.set(x, y + 0.34, 0.11);
      g.add(lintel);
      const sillBar = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 0.08), pal.trim);
      sillBar.position.set(x, y - 0.33, 0.11);
      g.add(sillBar);
    }
  }
  return g;
}

/** Distant skyline: a depth-staggered row of dark towers with lit windows. */
export function skylineBlocks(rng: Rng, pal: Palette, opts: { width?: number } = {}): THREE.Group {
  const width = opts.width ?? 4;
  const g = new THREE.Group();
  let x = -width / 2;
  while (x < width / 2) {
    const w = rng.range(0.3, 0.7);
    const h = rng.range(0.8, 2.6);
    const d = rng.range(0.3, 0.5);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), pal.trim);
    tower.position.set(x + w / 2, h / 2, rng.jitter(0.5));
    tower.castShadow = true;
    g.add(tower);
    // Sparse lit windows: tiny emissive planes on the front face.
    for (let wy = 0.2; wy < h - 0.15; wy += 0.22) {
      for (let wx = -w / 2 + 0.08; wx < w / 2 - 0.06; wx += 0.16) {
        if (!rng.chance(0.22)) continue;
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.07), pal.glow(0xffd98a));
        win.position.set(tower.position.x + wx, wy, tower.position.z + d / 2 + 0.002);
        g.add(win);
      }
    }
    // Occasional rooftop beacon.
    if (h > 2 && rng.chance(0.5)) {
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), pal.glow(0xff2b3a));
      beacon.position.set(tower.position.x, h + 0.04, tower.position.z);
      g.add(beacon);
    }
    x += w + rng.range(0.05, 0.25);
  }
  return g;
}

/** Small gabled cabin: log walls, door, window, chimney. A building in a prop. */
export function cabinHut(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const W = 1.8;
  const D = 1.4;
  const H = 1.3;
  // Log courses: stacked horizontal cylinders on the two long walls.
  for (let i = 0; i < 6; i++) {
    for (const z of [-D / 2, D / 2]) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, W, 8), pal.body);
      log.rotation.z = Math.PI / 2;
      log.position.set(0, 0.11 + i * 0.21, z);
      log.castShadow = true;
      g.add(log);
    }
  }
  for (const x of [-W / 2, W / 2]) {
    const end = new THREE.Mesh(new THREE.BoxGeometry(0.16, H, D), pal.body);
    end.position.set(x, H / 2, 0);
    g.add(end);
    // Gable triangle.
    const gable = new THREE.Mesh(new THREE.ConeGeometry(D / 1.4, 0.6, 4), pal.body);
    gable.position.set(x, H + 0.3, 0);
    gable.rotation.y = Math.PI / 4;
    g.add(gable);
  }
  for (const side of [-1, 1]) {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, 0.07, D * 0.78), pal.trim);
    roof.position.set(0, H + 0.32, (side * D) / 3.6);
    roof.rotation.x = side * -0.55;
    roof.castShadow = true;
    g.add(roof);
  }
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.85, 0.05), pal.trim);
  door.position.set(-0.35, 0.43, D / 2 + 0.09);
  g.add(door);
  const window = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.3), pal.glow(0xffd98a));
  window.position.set(0.4, 0.75, D / 2 + 0.12);
  g.add(window);
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), pal.trim);
  chimney.position.set(W / 2 - 0.3, H + 0.55, rng.jitter(0.2));
  g.add(chimney);
  return g;
}

/** Watchtower: stilt legs, cabin, ladder, sweeping lamp housing. */
export function guardTower(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const H = 2.2;
  for (const [x, z] of [
    [-0.4, -0.4],
    [-0.4, 0.4],
    [0.4, -0.4],
    [0.4, 0.4],
  ]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, H, 0.1), pal.trim);
    leg.position.set(x * 1.2, H / 2, z * 1.2);
    leg.rotation.z = -x * 0.12;
    leg.rotation.x = z * 0.12;
    leg.castShadow = true;
    g.add(leg);
  }
  // Cross braces.
  for (const y of [0.7, 1.4]) {
    for (const rotY of [0, Math.PI / 2]) {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.05), pal.trim);
      brace.position.y = y;
      brace.rotation.y = rotY;
      g.add(brace);
    }
  }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 1.2), pal.body);
  deck.position.y = H;
  g.add(deck);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), pal.body);
  cabin.position.y = H + 0.43;
  cabin.castShadow = true;
  g.add(cabin);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.4, 4), pal.trim);
  roof.position.y = H + 0.98;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  const slit = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), pal.glow(0xffe2b0));
  slit.position.set(0, H + 0.5, 0.451);
  g.add(slit);
  // Ladder up one leg.
  for (let i = 0; i < Math.round(H / 0.25); i++) {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 5), pal.metal);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(0, 0.2 + i * 0.25, 0.52 + rng.jitter(0.005));
    g.add(rung);
  }
  return g;
}

/** Colonnade: a rhythm of pillars under a continuous lintel, on a step. */
export function colonnade(rng: Rng, pal: Palette, opts: { bays?: number } = {}): THREE.Group {
  const bays = opts.bays ?? 3;
  const span = bays * 1.1;
  const g = new THREE.Group();
  const step = new THREE.Mesh(new THREE.BoxGeometry(span + 0.5, 0.14, 0.9), pal.trim);
  step.position.y = 0.07;
  g.add(step);
  for (let i = 0; i <= bays; i++) {
    const x = -span / 2 + i * 1.1;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 2.1, 10), pal.body);
    shaft.position.set(x, 1.19, 0);
    shaft.rotation.y = rng.jitter(0.1);
    shaft.castShadow = true;
    g.add(shaft);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.34), pal.trim);
    cap.position.set(x, 2.3, 0);
    g.add(cap);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(span + 0.5, 0.22, 0.42), pal.body);
  lintel.position.y = 2.47;
  lintel.castShadow = true;
  g.add(lintel);
  return g;
}

/**
 * A wall segment WITH an opening cut into it — door or window — built from
 * solid panels, ready to be a real room boundary.
 */
export function openingWall(
  pal: Palette,
  opts: { width?: number; height?: number; opening?: 'door' | 'window' } = {},
): THREE.Group {
  const width = opts.width ?? 3;
  const height = opts.height ?? 2.6;
  const opening = opts.opening ?? 'door';
  const g = new THREE.Group();
  const ow = opening === 'door' ? 1.0 : 1.2;
  const oh = opening === 'door' ? 2.1 : 1.0;
  const sillH = opening === 'door' ? 0 : 0.95;
  const sideW = (width - ow) / 2;
  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(sideW, height, 0.18), pal.body);
    panel.position.set(side * (ow / 2 + sideW / 2), height / 2, 0);
    panel.castShadow = true;
    g.add(panel);
  }
  const header = new THREE.Mesh(new THREE.BoxGeometry(ow, height - sillH - oh, 0.18), pal.body);
  header.position.set(0, sillH + oh + (height - sillH - oh) / 2, 0);
  g.add(header);
  if (sillH > 0) {
    const below = new THREE.Mesh(new THREE.BoxGeometry(ow, sillH, 0.18), pal.body);
    below.position.set(0, sillH / 2, 0);
    g.add(below);
  }
  // Trim the opening so it reads as finished, not a hole.
  const jambMat = pal.trim;
  for (const side of [-1, 1]) {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.08, oh, 0.22), jambMat);
    jamb.position.set((side * ow) / 2, sillH + oh / 2, 0);
    g.add(jamb);
  }
  const head = new THREE.Mesh(new THREE.BoxGeometry(ow + 0.16, 0.08, 0.22), jambMat);
  head.position.set(0, sillH + oh + 0.04, 0);
  g.add(head);
  if (sillH > 0) {
    const sillBar = new THREE.Mesh(new THREE.BoxGeometry(ow + 0.16, 0.08, 0.26), jambMat);
    sillBar.position.set(0, sillH - 0.04, 0);
    g.add(sillBar);
  }
  return g;
}
