import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Egyptian tomb — hero pieces for a pharaonic theme (pairs with the
 * 'sandstone' palette, but any palette works). Origins on the floor; the
 * hieroglyph panel is a wall prop facing +Z.
 */

/** Tapered obelisk on a stepped plinth, capped with a glowing pyramidion. */
export function obelisk(rng: Rng, pal: Palette, opts: { height?: number } = {}): THREE.Group {
  const height = opts.height ?? 2.6;
  const g = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const s = 0.7 - i * 0.15;
    const step = new THREE.Mesh(new THREE.BoxGeometry(s, 0.12, s), pal.trim);
    step.position.y = 0.06 + i * 0.12;
    g.add(step);
  }
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, height, 4), pal.body);
  shaft.position.y = 0.24 + height / 2;
  shaft.rotation.y = Math.PI / 4;
  shaft.castShadow = true;
  g.add(shaft);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.22, 4), pal.glow());
  tip.position.y = 0.24 + height + 0.1;
  tip.rotation.y = Math.PI / 4 + rng.jitter(0.02);
  g.add(tip);
  return g;
}

/** Stone sarcophagus. `lid` slides along z / lifts; found slightly shifted. */
export function sarcophagus(rng: Rng, pal: Palette): { group: THREE.Group; lid: THREE.Group } {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.7, 2.1), pal.body);
  base.position.y = 0.35;
  base.castShadow = true;
  group.add(base);
  // Foot moulding.
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.14, 2.2), pal.trim);
  skirt.position.y = 0.07;
  group.add(skirt);
  const lid = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.18, 2.12), pal.trim);
  lid.add(slab);
  // Effigy: head + crossed-arms ridge, deliberately blocky.
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), pal.metal);
  head.position.set(0, 0.16, 0.75);
  head.scale.set(1, 0.8, 1.15);
  lid.add(head);
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.8), pal.metal);
  chest.position.set(0, 0.12, 0.15);
  lid.add(chest);
  lid.position.set(rng.chance(0.5) ? 0.12 : 0, 0.79, rng.jitter(0.1)); // shoved ajar
  lid.rotation.y = rng.jitter(0.04);
  group.add(lid);
  return { group, lid };
}

/**
 * Wall panel of procedural hieroglyph rows — a natural code-carrier: the same
 * seed always draws the same glyph sequence.
 */
export function hieroglyphPanel(
  rng: Rng,
  pal: Palette,
  opts: { width?: number; height?: number } = {},
): THREE.Group {
  const width = opts.width ?? 1.5;
  const height = opts.height ?? 1.8;
  const g = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, height + 0.1, 0.09), pal.body);
  slab.position.set(0, 0.9 + height / 2 - 0.5, 0);
  slab.position.y = 0.5 + (height + 0.1) / 2;
  slab.castShadow = true;
  g.add(slab);
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.strokeStyle = 'rgba(58, 40, 18, 0.9)';
    ctx.fillStyle = 'rgba(58, 40, 18, 0.9)';
    ctx.lineWidth = 2.5;
    // Column rules, then a seeded glyph per cell from a small alphabet.
    for (let c = 0; c <= 4; c++) {
      ctx.beginPath();
      ctx.moveTo(8 + c * 36, 8);
      ctx.lineTo(8 + c * 36, 184);
      ctx.stroke();
    }
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 6; r++) {
        const x = 26 + c * 36;
        const y = 22 + r * 28;
        const glyph = rng.int(5);
        ctx.beginPath();
        if (glyph === 0) ctx.arc(x, y, 8, 0, Math.PI * 2); // sun disc
        else if (glyph === 1) {
          ctx.moveTo(x - 8, y + 8);
          ctx.lineTo(x, y - 8);
          ctx.lineTo(x + 8, y + 8);
          ctx.closePath(); // pyramid
        } else if (glyph === 2) {
          ctx.moveTo(x - 9, y);
          ctx.quadraticCurveTo(x, y - 12, x + 9, y);
          ctx.quadraticCurveTo(x, y + 12, x - 9, y); // eye
        } else if (glyph === 3) ctx.rect(x - 8, y - 3, 16, 6); // water bar
        else {
          ctx.moveTo(x, y - 9);
          ctx.lineTo(x, y + 9);
          ctx.moveTo(x - 7, y - 2);
          ctx.lineTo(x + 7, y - 2); // ankh-ish cross
          ctx.arc(x, y - 6, 3.5, 0, Math.PI * 2);
        }
        if (glyph === 1 || glyph === 3) ctx.fill();
        else ctx.stroke();
      }
    }
  }
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.1, height - 0.1),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, roughness: 0.95 }),
  );
  art.userData.disposeMaterial = true;
  art.position.set(0, slab.position.y, 0.047);
  g.add(art);
  return g;
}

/** Four canopic jars with distinct animal-headed lids on a stone shelf. */
export function canopicJars(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.35), pal.trim);
  shelf.position.y = 0.04;
  g.add(shelf);
  for (let i = 0; i < 4; i++) {
    const x = -0.4 + i * 0.27;
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.24, 10), pal.body);
    jar.position.set(x, 0.2, 0);
    g.add(jar);
    // Lid heads: sphere (human), cone (jackal), flattened sphere (baboon), beaked (falcon).
    let head: THREE.Mesh;
    if (i === 0) head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), pal.metal);
    else if (i === 1) head = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 8), pal.metal);
    else if (i === 2) {
      head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), pal.metal);
      head.scale.y = 0.6;
    } else {
      head = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.1, 6), pal.metal);
      head.rotation.x = 0.9;
    }
    head.position.set(x, 0.36 + rng.jitter(0.005), 0);
    g.add(head);
  }
  return g;
}

/** Pharaoh bust on a pedestal: nemes headdress flares, blocky face. */
export function pharaohBust(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1, 0.45), pal.trim);
  pedestal.position.y = 0.5;
  pedestal.castShadow = true;
  g.add(pedestal);
  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.28), pal.body);
  shoulders.position.y = 1.09;
  g.add(shoulders);
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.2), pal.body);
  face.position.y = 1.32;
  g.add(face);
  // Nemes: two flaring side panels + brow band + glowing uraeus stub.
  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.24), pal.metal);
    panel.position.set(side * 0.17, 1.26, 0);
    panel.rotation.z = side * -0.18;
    g.add(panel);
  }
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.22), pal.metal);
  band.position.y = 1.46;
  g.add(band);
  const uraeus = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 6), pal.glow());
  uraeus.position.set(0, 1.5, 0.1);
  uraeus.rotation.x = rng.jitter(0.05);
  g.add(uraeus);
  return g;
}

/** Low stepped altar — a pedestal for relics and offerings. */
export function stepAltar(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const s = 1.2 - i * 0.3;
    const step = new THREE.Mesh(new THREE.BoxGeometry(s, 0.18, s * 0.75), i === 2 ? pal.trim : pal.body);
    step.position.y = 0.09 + i * 0.18;
    step.rotation.y = rng.jitter(0.01);
    step.castShadow = true;
    g.add(step);
  }
  // Offering bowl with an ember glow.
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.07, 0.08, 12), pal.metal);
  bowl.position.y = 0.62;
  g.add(bowl);
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), pal.glow(0xff7733));
  ember.position.y = 0.64;
  ember.scale.y = 0.5;
  g.add(ember);
  return g;
}

/** Free-standing ankh on a pole — reads instantly at any distance. */
export function ankhStand(pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.08, 10), pal.trim);
  base.position.y = 0.04;
  g.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.2, 8), pal.metal);
  pole.position.y = 0.68;
  g.add(pole);
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.04), pal.metal);
  cross.position.y = 1.34;
  g.add(cross);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.028, 8, 14), pal.metal);
  loop.position.y = 1.52;
  g.add(loop);
  return g;
}

/** Couchant sphinx statue: lion body, headdressed face, forelegs. */
export function sphinxStatue(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.16, 1.5), pal.trim);
  plinth.position.y = 0.08;
  g.add(plinth);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.34, 1.05), pal.body);
  body.position.set(0, 0.33, -0.12);
  body.castShadow = true;
  g.add(body);
  // Haunch bulge.
  const haunch = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), pal.body);
  haunch.position.set(0, 0.36, -0.5);
  haunch.scale.set(0.9, 0.9, 1.1);
  g.add(haunch);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.6), pal.body);
    leg.position.set(side * 0.14, 0.23, 0.42);
    g.add(leg);
  }
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.2), pal.body);
  chest.position.set(0, 0.5, 0.28);
  g.add(chest);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.16), pal.body);
  head.position.set(0, 0.74, 0.3);
  head.rotation.y = rng.jitter(0.04);
  g.add(head);
  for (const side of [-1, 1]) {
    const nemes = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.18), pal.metal);
    nemes.position.set(side * 0.14, 0.7, 0.28);
    nemes.rotation.z = side * -0.2;
    g.add(nemes);
  }
  return g;
}

/** Wind-blown sand drift against a wall or corner. */
export function sandDrift(rng: Rng, pal: Palette, opts: { width?: number } = {}): THREE.Group {
  const width = opts.width ?? 1.8;
  const g = new THREE.Group();
  const lumps = 4 + rng.int(3);
  for (let i = 0; i < lumps; i++) {
    const r = rng.range(0.25, 0.5) * (width / 1.8);
    const lump = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 7), pal.soft);
    lump.position.set(rng.jitter(width / 2), r * 0.2, rng.jitter(0.25));
    lump.scale.set(1.6, 0.35, 1);
    lump.receiveShadow = true;
    g.add(lump);
  }
  return g;
}

/** Raised scarab relief roundel for walls. */
export function scarabRelief(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 20), pal.body);
  disc.rotation.x = Math.PI / 2;
  disc.position.set(0, 1.5, 0.02);
  g.add(disc);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), pal.metal);
  shell.position.set(0, 1.47, 0.06);
  shell.scale.set(1, 1.2, 0.5);
  g.add(shell);
  const headBead = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), pal.metal);
  headBead.position.set(0, 1.63, 0.06);
  headBead.scale.z = 0.5;
  g.add(headBead);
  for (const side of [-1, 1]) {
    // Swept wings.
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.02), pal.glow());
    wing.position.set(side * 0.17, 1.52, 0.055);
    wing.rotation.z = side * (0.45 + rng.jitter(0.05));
    g.add(wing);
  }
  return g;
}
