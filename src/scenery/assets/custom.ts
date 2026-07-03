import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Customisable media props — frames, screens, and signage with SWAPPABLE
 * content. Every builder here returns one or more `ImageSlot`s: a mesh whose
 * texture can be replaced at any time (a player's photo, a sponsor logo, a
 * clue image), plus text props that render arbitrary strings. This is how a
 * room gets personalised per group without touching geometry.
 *
 *   const { group, slot } = pictureFrame(pal);
 *   slot.setImage(await loadImageTexture('/photos/team-42.jpg'));
 */

/** A content surface whose texture can be swapped after build. */
export interface ImageSlot {
  mesh: THREE.Mesh;
  /** Replace the displayed texture (the previous one is disposed). */
  setImage(texture: THREE.Texture): void;
}

/** Load an image URL as a colour-correct texture for an ImageSlot. */
export function loadImageTexture(url: string): Promise<THREE.Texture> {
  return new THREE.TextureLoader().loadAsync(url).then((tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

/** Render text lines to a texture (labels, dedications, custom clues). */
export function textTexture(
  lines: string[],
  opts: { color?: string; background?: string; font?: string } = {},
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128 + (lines.length - 1) * 40;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (opts.background) {
      ctx.fillStyle = opts.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.fillStyle = opts.color ?? '#e8e0cc';
    ctx.font = opts.font ?? 'bold 30px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((line, i) => {
      ctx.fillText(line, 128, canvas.height / 2 + (i - (lines.length - 1) / 2) * 40, 240);
    });
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Hatched "insert photo" placeholder so empty slots read as intentional. */
function placeholderTexture(label: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 144;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#2c313a';
    ctx.fillRect(0, 0, 192, 144);
    ctx.strokeStyle = '#3d4450';
    ctx.lineWidth = 6;
    for (let x = -144; x < 192; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 144);
      ctx.lineTo(x + 144, 0);
      ctx.stroke();
    }
    ctx.strokeStyle = '#5a6270';
    ctx.strokeRect(6, 6, 180, 132);
    ctx.fillStyle = '#8a93a2';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 96, 78);
  }
  return new THREE.CanvasTexture(canvas);
}

/** Build a swappable content surface. */
function makeSlot(width: number, height: number, label = 'INSERT PHOTO'): ImageSlot {
  const material = new THREE.MeshStandardMaterial({
    map: placeholderTexture(label),
    roughness: 0.85,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.userData.disposeMaterial = true;
  return {
    mesh,
    setImage(texture: THREE.Texture): void {
      material.map?.dispose();
      material.map = texture;
      material.needsUpdate = true;
    },
  };
}

/** Wall picture frame with a swappable print. Origin at wall base, faces +Z. */
export function pictureFrame(
  pal: Palette,
  opts: { width?: number; height?: number; image?: THREE.Texture } = {},
): { group: THREE.Group; slot: ImageSlot } {
  const width = opts.width ?? 0.6;
  const height = opts.height ?? 0.45;
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, height + 0.1, 0.05), pal.trim);
  frame.position.set(0, 1.5, 0);
  frame.castShadow = true;
  group.add(frame);
  const matte = new THREE.Mesh(new THREE.PlaneGeometry(width + 0.04, height + 0.04), pal.soft);
  matte.position.set(0, 1.5, 0.027);
  group.add(matte);
  const slot = makeSlot(width, height);
  slot.mesh.position.set(0, 1.5, 0.032);
  group.add(slot.mesh);
  if (opts.image) slot.setImage(opts.image);
  return { group, slot };
}

/** Salon wall: a seeded arrangement of mixed frames, every print swappable. */
export function galleryWall(
  rng: Rng,
  pal: Palette,
  opts: { frames?: number } = {},
): { group: THREE.Group; slots: ImageSlot[] } {
  const frames = opts.frames ?? 6;
  const group = new THREE.Group();
  const slots: ImageSlot[] = [];
  for (let i = 0; i < frames; i++) {
    const w = rng.range(0.28, 0.5);
    const h = w * rng.range(0.7, 1.3);
    const x = rng.jitter(0.75);
    const y = 1.5 + rng.jitter(0.5);
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.04),
      rng.chance(0.5) ? pal.trim : pal.metal,
    );
    frame.position.set(x, y, 0);
    frame.rotation.z = rng.jitter(0.03);
    group.add(frame);
    const slot = makeSlot(w, h, `PHOTO ${i + 1}`);
    slot.mesh.position.set(x, y, 0.022);
    slot.mesh.rotation.z = frame.rotation.z;
    group.add(slot.mesh);
    slots.push(slot);
  }
  return { group, slots };
}

/** Large swappable poster in a snap frame (event posters, wanted posters…). */
export function posterBoard(
  pal: Palette,
  opts: { width?: number; height?: number; image?: THREE.Texture } = {},
): { group: THREE.Group; slot: ImageSlot } {
  const width = opts.width ?? 0.7;
  const height = opts.height ?? 1;
  const group = new THREE.Group();
  const backing = new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, height + 0.06, 0.03), pal.metal);
  backing.position.set(0, 1.4, 0);
  group.add(backing);
  const slot = makeSlot(width, height, 'INSERT POSTER');
  slot.mesh.position.set(0, 1.4, 0.017);
  group.add(slot.mesh);
  if (opts.image) slot.setImage(opts.image);
  return { group, slot };
}

/** Wall-mounted flatscreen with a swappable display. */
export function tvScreen(
  pal: Palette,
  opts: { width?: number; image?: THREE.Texture } = {},
): { group: THREE.Group; slot: ImageSlot } {
  const width = opts.width ?? 0.9;
  const height = width * 0.5625;
  const group = new THREE.Group();
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(width + 0.05, height + 0.05, 0.05), pal.trim);
  bezel.position.set(0, 1.6, 0);
  bezel.castShadow = true;
  group.add(bezel);
  const slot = makeSlot(width, height, 'NO SIGNAL');
  slot.mesh.position.set(0, 1.6, 0.028);
  group.add(slot.mesh);
  const standby = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 5), pal.glow(0xff2b3a));
  standby.position.set(width / 2 - 0.03, 1.6 - height / 2 + 0.02, 0.028);
  group.add(standby);
  if (opts.image) slot.setImage(opts.image);
  return { group, slot };
}

/** Free-standing cardboard-cutout standee with an easel back. */
export function standee(
  pal: Palette,
  opts: { height?: number; image?: THREE.Texture } = {},
): { group: THREE.Group; slot: ImageSlot } {
  const height = opts.height ?? 1.8;
  const width = height * 0.42;
  const group = new THREE.Group();
  const slot = makeSlot(width, height, 'INSERT PERSON');
  slot.mesh.position.set(0, height / 2, 0);
  slot.mesh.castShadow = true;
  group.add(slot.mesh);
  const back = new THREE.Mesh(new THREE.BoxGeometry(width * 0.6, height * 0.55, 0.02), pal.soft);
  back.position.set(0, height * 0.28, -0.18);
  back.rotation.x = 0.35;
  group.add(back);
  if (opts.image) slot.setImage(opts.image);
  return { group, slot };
}

/** Engraved dedication plaque rendering ARBITRARY text lines. */
export function engravedPlaque(
  pal: Palette,
  lines: string[],
  opts: { width?: number } = {},
): THREE.Group {
  const width = opts.width ?? 0.6;
  const height = 0.14 + lines.length * 0.09;
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.025), pal.metal);
  plate.position.set(0, 1.4, 0);
  g.add(plate);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.05, height - 0.05),
    new THREE.MeshStandardMaterial({
      map: textTexture(lines),
      transparent: true,
      roughness: 0.5,
      metalness: 0.4,
    }),
  );
  face.userData.disposeMaterial = true;
  face.position.set(0, 1.4, 0.014);
  g.add(face);
  for (const [sx, sy] of [
    [-width / 2 + 0.04, height / 2 - 0.04],
    [width / 2 - 0.04, height / 2 - 0.04],
    [-width / 2 + 0.04, -height / 2 + 0.04],
    [width / 2 - 0.04, -height / 2 + 0.04],
  ]) {
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.01, 6), pal.trim);
    screw.rotation.x = Math.PI / 2;
    screw.position.set(sx, 1.4 + sy, 0.015);
    g.add(screw);
  }
  return g;
}

/** CEILING: hanging fabric banner with a swappable emblem/print. */
export function hangingBanner(
  pal: Palette,
  opts: { width?: number; drop?: number; image?: THREE.Texture } = {},
): { group: THREE.Group; slot: ImageSlot } {
  const width = opts.width ?? 0.8;
  const drop = opts.drop ?? 1.6;
  const group = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, width + 0.2, 8), pal.metal);
  rod.rotation.z = Math.PI / 2;
  rod.position.y = -0.1;
  group.add(rod);
  const slot = makeSlot(width, drop, 'INSERT BANNER');
  slot.mesh.position.y = -0.12 - drop / 2;
  group.add(slot.mesh);
  // Swallow-tail hem.
  const hem = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.18), pal.soft);
  hem.position.y = -0.12 - drop - 0.09;
  group.add(hem);
  if (opts.image) slot.setImage(opts.image);
  return { group, slot };
}

/** Small tilted desk photo frame — the personal touch on any desk. */
export function deskPhoto(
  pal: Palette,
  opts: { image?: THREE.Texture } = {},
): { group: THREE.Group; slot: ImageSlot } {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.15, 0.015), pal.metal);
  frame.position.set(0, 0.085, 0);
  frame.rotation.x = -0.18;
  group.add(frame);
  const slot = makeSlot(0.15, 0.11, 'PHOTO');
  slot.mesh.position.set(0, 0.087, 0.01);
  slot.mesh.rotation.x = -0.18;
  group.add(slot.mesh);
  const prop = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.01), pal.metal);
  prop.position.set(0, 0.05, -0.045);
  prop.rotation.x = 0.5;
  group.add(prop);
  if (opts.image) slot.setImage(opts.image);
  return { group, slot };
}

/** Museum display case with a swappable exhibit card and a lit interior. */
export function displayCase(
  pal: Palette,
  opts: { image?: THREE.Texture } = {},
): { group: THREE.Group; slot: ImageSlot } {
  const group = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.6), pal.body);
  plinth.position.y = 0.45;
  plinth.castShadow = true;
  group.add(plinth);
  const caseGlass = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), pal.glass);
  caseGlass.position.y = 1.15;
  group.add(caseGlass);
  const capLid = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.04, 0.56), pal.trim);
  capLid.position.y = 1.4;
  group.add(capLid);
  const glowPad = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.015, 0.44), pal.glow(0xdfe9ff));
  glowPad.position.y = 0.91;
  group.add(glowPad);
  // The exhibit card on the plinth face is the custom part.
  const slot = makeSlot(0.34, 0.24, 'EXHIBIT CARD');
  slot.mesh.position.set(0, 0.62, 0.301);
  group.add(slot.mesh);
  if (opts.image) slot.setImage(opts.image);
  return { group, slot };
}
