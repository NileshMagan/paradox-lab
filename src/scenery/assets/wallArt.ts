import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Wall art & photographs. Escape rooms hide clues in pictures, so these are
 * built to carry information: seeded procedural "prints" mean a photo can be
 * regenerated identically on every client from the room seed. All are wall
 * props: facing +Z, origin at the wall base (y = 0), hung at eye height.
 */

/** Seeded canvas → texture. The draw callback must take all variation from rng. */
function paintTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx);
  return new THREE.CanvasTexture(canvas);
}

/** Flat print plane owning its texture (disposed with the prop). */
function printMesh(w: number, h: number, tex: THREE.CanvasTexture): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }),
  );
  mesh.userData.disposeMaterial = true;
  return mesh;
}

/**
 * Framed photograph: seeded silhouette landscape/figure scene with a vignette
 * and an era tint. Same seed ⇒ same photo — safe to use as a clue.
 */
export function framedPhoto(
  rng: Rng,
  pal: Palette,
  opts: { width?: number; height?: number } = {},
): THREE.Group {
  const width = opts.width ?? 0.7;
  const height = opts.height ?? 0.55;
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, height + 0.1, 0.05), pal.trim);
  frame.position.set(0, 1.5, 0);
  frame.castShadow = true;
  g.add(frame);
  const matte = new THREE.Mesh(new THREE.PlaneGeometry(width + 0.04, height + 0.04), pal.soft);
  matte.position.set(0, 1.5, 0.028);
  g.add(matte);
  const sepia = rng.chance(0.5);
  const subject = rng.pick(['skyline', 'hills', 'figures'] as const);
  const tex = paintTexture(256, 192, (ctx) => {
    // Sky: vertical gradient between two seeded tones.
    const sky = ctx.createLinearGradient(0, 0, 0, 192);
    sky.addColorStop(0, `hsl(${rng.int(360)}, 30%, ${55 + rng.int(25)}%)`);
    sky.addColorStop(1, `hsl(${rng.int(360)}, 25%, ${30 + rng.int(20)}%)`);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 256, 192);
    // Two silhouette layers, far (lighter) then near (darker).
    for (const [shade, base] of [
      ['rgba(30,30,40,0.55)', 120],
      ['rgba(12,12,18,0.9)', 150],
    ] as const) {
      ctx.fillStyle = shade;
      if (subject === 'skyline') {
        for (let x = 0; x < 256; ) {
          const bw = 14 + rng.int(30);
          const bh = 20 + rng.int(70);
          ctx.fillRect(x, base + (192 - base) - bh, bw, bh + 60);
          x += bw + rng.int(8);
        }
      } else if (subject === 'hills') {
        ctx.beginPath();
        ctx.moveTo(0, 192);
        for (let x = 0; x <= 256; x += 32) ctx.lineTo(x, base + rng.int(50));
        ctx.lineTo(256, 192);
        ctx.fill();
      } else {
        // A row of standing figures.
        for (let i = 0, n = 3 + rng.int(4); i < n; i++) {
          const x = 30 + i * (200 / n) + rng.int(12);
          const fh = 55 + rng.int(25);
          ctx.fillRect(x - 7, 192 - fh, 14, fh);
          ctx.beginPath();
          ctx.arc(x, 192 - fh - 8, 9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    // Era tint + vignette.
    ctx.fillStyle = sepia ? 'rgba(112, 84, 40, 0.35)' : 'rgba(40, 60, 90, 0.3)';
    ctx.fillRect(0, 0, 256, 192);
    const vin = ctx.createRadialGradient(128, 96, 70, 128, 96, 175);
    vin.addColorStop(0, 'rgba(0,0,0,0)');
    vin.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vin;
    ctx.fillRect(0, 0, 256, 192);
  });
  const print = printMesh(width - 0.06, height - 0.06, tex);
  print.position.set(0, 1.5, 0.032);
  g.add(print);
  return g;
}

/** Head-and-shoulders portrait in an ornate stepped frame, paint craquelured. */
export function portraitPainting(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.92, 0.06), pal.trim);
  outer.position.set(0, 1.55, 0);
  outer.castShadow = true;
  const inner = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.05), pal.metal);
  inner.position.set(0, 1.55, 0.012);
  g.add(outer, inner);
  const tex = paintTexture(160, 224, (ctx) => {
    ctx.fillStyle = `hsl(${20 + rng.int(40)}, 25%, ${18 + rng.int(14)}%)`;
    ctx.fillRect(0, 0, 160, 224);
    // Mottled backdrop.
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(255, 240, 200, ${0.02 + rng.next() * 0.05})`;
      ctx.fillRect(rng.int(160), rng.int(224), 10 + rng.int(30), 8 + rng.int(20));
    }
    // Sitter: shoulders + head + faint collar highlight.
    ctx.fillStyle = 'rgba(10, 8, 8, 0.92)';
    ctx.beginPath();
    ctx.ellipse(80, 210, 62, 60, 0, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(80, 108 + rng.int(10), 30, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(230, 220, 190, 0.25)';
    ctx.fillRect(60, 165, 40, 8);
    // Craquelure scratches.
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(rng.int(160), rng.int(224));
      ctx.lineTo(rng.int(160), rng.int(224));
      ctx.stroke();
    }
  });
  const canvasMesh = printMesh(0.52, 0.72, tex);
  canvasMesh.position.set(0, 1.55, 0.045);
  g.add(canvasMesh);
  return g;
}

/** Faded poster, one corner peeling. The "print" is blocked-out title/text bars. */
export function agedPoster(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const tex = paintTexture(160, 224, (ctx) => {
    ctx.fillStyle = `hsl(${rng.int(50)}, ${20 + rng.int(20)}%, ${62 + rng.int(15)}%)`;
    ctx.fillRect(0, 0, 160, 224);
    ctx.fillStyle = 'rgba(30, 25, 20, 0.8)';
    ctx.fillRect(16, 14, 128, 22); // title bar
    ctx.fillStyle = `hsl(${rng.int(360)}, 35%, 35%)`;
    ctx.fillRect(20, 48, 120, 90); // image block
    ctx.fillStyle = 'rgba(30, 25, 20, 0.6)';
    for (let y = 150; y < 210; y += 12) ctx.fillRect(20, y, 60 + rng.int(60), 6);
    // Sun-fade wash.
    ctx.fillStyle = 'rgba(255, 250, 230, 0.25)';
    ctx.fillRect(0, 0, 160, 224);
  });
  const sheet = printMesh(0.55, 0.78, tex);
  sheet.position.set(0, 1.45, 0.01);
  sheet.rotation.z = rng.jitter(0.06);
  g.add(sheet);
  // Curled corner: a small doubled-back strip showing the paper's underside.
  const curl = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), pal.soft);
  curl.position.set(0.21, 1.13, 0.035);
  curl.rotation.set(0.5, 0.6, sheet.rotation.z);
  g.add(curl);
  return g;
}

/** 4-7 instant photos clipped along a sagging string between two pins. */
export function polaroidString(rng: Rng, pal: Palette, opts: { span?: number } = {}): THREE.Group {
  const span = opts.span ?? 1.4;
  const g = new THREE.Group();
  for (const x of [-span / 2, span / 2]) {
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), pal.metal);
    pin.position.set(x, 1.9, 0.01);
    g.add(pin);
  }
  const sag = 0.12 + rng.next() * 0.08;
  const wire = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-span / 2, 1.9, 0.01),
    new THREE.Vector3(0, 1.9 - sag, 0.02),
    new THREE.Vector3(span / 2, 1.9, 0.01),
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(wire, 12, 0.004, 4), pal.trim));
  const count = 4 + rng.int(4);
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    const p = wire.getPoint(t);
    const tex = paintTexture(64, 64, (ctx) => {
      ctx.fillStyle = `hsl(${rng.int(360)}, 30%, ${35 + rng.int(35)}%)`;
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = 'rgba(15, 12, 15, 0.8)';
      // A blobby subject — deliberately ambiguous at arm's length.
      ctx.beginPath();
      ctx.ellipse(20 + rng.int(24), 24 + rng.int(20), 8 + rng.int(10), 12 + rng.int(10), 0, 0, Math.PI * 2);
      ctx.fill();
    });
    const card = new THREE.Group();
    const border = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.13), pal.soft);
    const photo = printMesh(0.09, 0.09, tex);
    photo.position.set(0, 0.012, 0.002);
    card.add(border, photo);
    card.position.set(p.x, p.y - 0.065, p.z + 0.005);
    card.rotation.z = rng.jitter(0.25);
    g.add(card);
  }
  return g;
}

/** Large mural slab: concentric arcs, radial ticks, scattered star marks. */
export function muralPanel(
  rng: Rng,
  pal: Palette,
  opts: { width?: number; height?: number } = {},
): THREE.Group {
  const width = opts.width ?? 1.8;
  const height = opts.height ?? 1.6;
  const g = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(width + 0.12, height + 0.12, 0.09), pal.body);
  slab.position.set(0, 0.1 + (height + 0.12) / 2 + 0.9, 0);
  slab.castShadow = true;
  g.add(slab);
  const tex = paintTexture(256, 256, (ctx) => {
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.clearRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(235, 225, 200, 0.8)';
    ctx.lineWidth = 3;
    // Concentric arc rings — kin to the R1 stone mural's zodiac wheel.
    for (let r = 30; r < 120; r += 22 + rng.int(8)) {
      const start = rng.angle();
      ctx.beginPath();
      ctx.arc(128, 128, r, start, start + Math.PI * (0.7 + rng.next() * 1.1));
      ctx.stroke();
    }
    // Radial ticks.
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112);
      ctx.lineTo(128 + Math.cos(a) * 124, 128 + Math.sin(a) * 124);
      ctx.stroke();
    }
    // Star marks.
    ctx.fillStyle = 'rgba(235, 225, 200, 0.9)';
    for (let i = 0; i < 9; i++) {
      const x = 20 + rng.int(216);
      const y = 20 + rng.int(216);
      ctx.fillRect(x - 1, y - 4, 2, 8);
      ctx.fillRect(x - 4, y - 1, 8, 2);
    }
  });
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.95 }),
  );
  art.userData.disposeMaterial = true;
  art.position.set(0, slab.position.y, 0.048);
  g.add(art);
  return g;
}

/** Pinned blueprint sheet: white line-work on process blue. */
export function blueprintPinup(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const tex = paintTexture(224, 160, (ctx) => {
    ctx.fillStyle = '#183f6e';
    ctx.fillRect(0, 0, 224, 160);
    ctx.strokeStyle = 'rgba(230, 242, 255, 0.85)';
    ctx.lineWidth = 1.5;
    // Plan rectangles with a few dimension ticks and one circle detail.
    for (let i = 0, n = 3 + rng.int(3); i < n; i++) {
      const x = 12 + rng.int(120);
      const y = 12 + rng.int(80);
      const w = 30 + rng.int(70);
      const h = 20 + rng.int(50);
      ctx.strokeRect(x, y, Math.min(w, 210 - x), Math.min(h, 145 - y));
    }
    ctx.beginPath();
    ctx.arc(40 + rng.int(140), 40 + rng.int(80), 12 + rng.int(14), 0, Math.PI * 2);
    ctx.stroke();
    for (let x = 16; x < 208; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 150);
      ctx.lineTo(x, 155);
      ctx.stroke();
    }
  });
  const sheet = printMesh(0.85, 0.6, tex);
  sheet.position.set(0, 1.55, 0.012);
  sheet.rotation.z = rng.jitter(0.03);
  g.add(sheet);
  for (const [px, py] of [
    [-0.4, 1.82],
    [0.4, 1.82],
    [-0.4, 1.28],
    [0.4, 1.28],
  ]) {
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), pal.metal);
    pin.position.set(px, py, 0.02);
    g.add(pin);
  }
  return g;
}

/**
 * Round wall clock with settable hands — 12 o'clock is rotation.z = 0 and
 * hands sweep clockwise with NEGATIVE z rotation. Made for time puzzles.
 */
export function wallClock(pal: Palette): {
  group: THREE.Group;
  hourHand: THREE.Mesh;
  minuteHand: THREE.Mesh;
} {
  const group = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 8, 24), pal.trim);
  rim.position.set(0, 1.7, 0.02);
  group.add(rim);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.23, 24), pal.soft);
  face.position.set(0, 1.7, 0.015);
  group.add(face);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.008, i % 3 === 0 ? 0.045 : 0.025, 0.005), pal.metal);
    tick.position.set(Math.sin(a) * 0.195, 1.7 + Math.cos(a) * 0.195, 0.022);
    tick.rotation.z = -a;
    group.add(tick);
  }
  // Hands pivot at their base: geometry is offset so rotation.z sets the time.
  const hourGeo = new THREE.BoxGeometry(0.016, 0.11, 0.006).translate(0, 0.055, 0);
  const hourHand = new THREE.Mesh(hourGeo, pal.metal);
  hourHand.position.set(0, 1.7, 0.028);
  const minuteGeo = new THREE.BoxGeometry(0.01, 0.17, 0.006).translate(0, 0.085, 0);
  const minuteHand = new THREE.Mesh(minuteGeo, pal.metal);
  minuteHand.position.set(0, 1.7, 0.034);
  group.add(hourHand, minuteHand);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), pal.trim);
  hub.position.set(0, 1.7, 0.036);
  group.add(hub);
  return { group, hourHand, minuteHand };
}

/**
 * Backlit film viewer: glowing panel with dark film sheets clipped over it.
 * Returns the panel material so rooms can switch it on/off.
 */
export function lightboxSlide(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; panelMaterial: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 0.07), pal.trim);
  frame.position.set(0, 1.55, 0);
  group.add(frame);
  const panelMaterial = pal.glow(0xdfe9ff).clone();
  panelMaterial.emissiveIntensity = 1.1;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.55), panelMaterial);
  panel.position.set(0, 1.55, 0.037);
  panel.userData.disposeMaterial = true;
  group.add(panel);
  const films = 2 + rng.int(2);
  for (let i = 0; i < films; i++) {
    const film = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x10141a, transparent: true, opacity: 0.85 }),
    );
    film.userData.disposeMaterial = i === 0; // one shared throwaway material would be nicer, but keep ownership simple
    film.position.set(-0.25 + i * 0.26 + rng.jitter(0.02), 1.55 + rng.jitter(0.06), 0.042);
    film.rotation.z = rng.jitter(0.08);
    group.add(film);
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.02), pal.metal);
    clip.position.set(film.position.x, film.position.y + 0.16, 0.045);
    group.add(clip);
  }
  return { group, panelMaterial };
}

/** Bevelled wall mirror in a palette frame. */
export function wallMirror(
  pal: Palette,
  opts: { width?: number; height?: number } = {},
): THREE.Group {
  const width = opts.width ?? 0.6;
  const height = opts.height ?? 0.9;
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.08, height + 0.08, 0.05), pal.trim);
  frame.position.set(0, 1.5, 0);
  frame.castShadow = true;
  g.add(frame);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ color: 0xcfe0ea, metalness: 1, roughness: 0.05 }),
  );
  face.userData.disposeMaterial = true;
  face.position.set(0, 1.5, 0.028);
  g.add(face);
  return g;
}

/** A column of small engraved plaques — raised lettering bars, varied lengths. */
export function plaqueRow(rng: Rng, pal: Palette, opts: { count?: number } = {}): THREE.Group {
  const count = opts.count ?? 4;
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const y = 1.8 - i * 0.24;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.02), pal.metal);
    plate.position.set(0, y, 0.01);
    g.add(plate);
    // "Engraving": two rows of raised bars standing in for text.
    for (let row = 0; row < 2; row++) {
      let x = -0.2;
      while (x < 0.16) {
        const w = 0.03 + rng.next() * 0.06;
        const bar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, 0.005), pal.trim);
        bar.position.set(x + w / 2, y + 0.035 - row * 0.06, 0.023);
        g.add(bar);
        x += w + 0.02;
      }
    }
  }
  return g;
}
