import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';

/**
 * Readable inscription board — actual, legible text in the world, kept SEPARATE
 * from the decorative glyph props. A stage's worded clues render here (a carved
 * tablet, a pinned note, or a glowing screen depending on `tone`) so players
 * read the room instead of getting the text only in a pop-up. `setText` updates
 * it at runtime, so it can mirror the current objective / clue.
 *
 * Wall-mounted: origin at the board's base-centre, face toward +Z.
 */

export type InscriptionTone = 'stone' | 'paper' | 'screen';

interface ToneStyle {
  bg: string;
  bg2: string;
  ink: string;
  title: string;
  frame: number;
  font: string;
  titleFont: string;
  emissive: number;
  emissiveIntensity: number;
}

function toneStyle(tone: InscriptionTone, accent: number): ToneStyle {
  const hex = `#${accent.toString(16).padStart(6, '0')}`;
  switch (tone) {
    case 'paper':
      return {
        bg: '#e6d8b4', bg2: '#d2be93', ink: '#33261a', title: '#6b4a2a', frame: 0x5a4326,
        font: '500 30px "Inter", Georgia, serif', titleFont: '700 22px "Inter", sans-serif',
        emissive: 0xffffff, emissiveIntensity: 0.35,
      };
    case 'screen':
      return {
        bg: '#060b10', bg2: '#0a1420', ink: hex, title: '#8aa0b8', frame: 0x1a2634,
        font: '500 30px ui-monospace, monospace', titleFont: '700 20px ui-monospace, monospace',
        emissive: 0xffffff, emissiveIntensity: 0.9,
      };
    case 'stone':
    default:
      return {
        bg: '#2a2018', bg2: '#1c150e', ink: '#e8d6ac', title: '#c9a24a', frame: 0x6b4f26,
        font: '600 30px "Fraunces", Georgia, serif', titleFont: '700 20px "Inter", sans-serif',
        emissive: 0xffffff, emissiveIntensity: 0.55,
      };
  }
}

/** Wrap `text` to fit `maxWidth` px using the canvas context's current font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const trial = line ? `${line} ${word}` : word;
      if (ctx.measureText(trial).width > maxWidth && line) {
        out.push(line);
        line = word;
      } else {
        line = trial;
      }
    }
    out.push(line);
  }
  return out;
}

export function inscription(
  pal: Palette,
  opts: { tone?: InscriptionTone; title?: string; text?: string; width?: number; height?: number } = {},
): { group: THREE.Group; setText: (text: string, title?: string) => void } {
  const tone = opts.tone ?? 'stone';
  const style = toneStyle(tone, pal.accent);
  const W = opts.width ?? 1.5;
  const H = opts.height ?? 0.95;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = Math.round((512 * H) / W);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const group = new THREE.Group();
  const backing = new THREE.Mesh(new THREE.BoxGeometry(W + 0.08, H + 0.08, 0.05), new THREE.MeshStandardMaterial({ color: style.frame, roughness: 0.8 }));
  backing.position.set(0, H / 2, -0.01);
  backing.castShadow = true;
  backing.userData.disposeMaterial = true;
  group.add(backing);

  const faceMat = new THREE.MeshStandardMaterial({
    map: texture,
    emissive: new THREE.Color(style.emissive),
    emissiveMap: texture,
    emissiveIntensity: style.emissiveIntensity,
    roughness: 0.9,
  });
  faceMat.userData = { disposeMaterial: true };
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W, H), faceMat);
  face.position.set(0, H / 2, 0.026);
  face.userData.disposeMaterial = true;
  group.add(face);

  let title = opts.title ?? '';

  function render(text: string): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, style.bg);
    grad.addColorStop(1, style.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // inner border
    ctx.strokeStyle = style.title;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 4;
    ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
    ctx.globalAlpha = 1;

    const pad = 34;
    let y = 40;
    if (title) {
      ctx.fillStyle = style.title;
      ctx.font = style.titleFont;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(title.toUpperCase(), pad, y);
      y += 40;
    }
    ctx.fillStyle = style.ink;
    ctx.font = style.font;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const lines = wrap(ctx, text, canvas.width - pad * 2);
    const lineH = 40;
    for (const line of lines) {
      if (y > canvas.height - pad) break;
      ctx.fillText(line, pad, y);
      y += lineH;
    }
    texture.needsUpdate = true;
  }

  render(opts.text ?? '…');

  return {
    group,
    setText: (text: string, newTitle?: string) => {
      if (newTitle !== undefined) title = newTitle;
      render(text);
    },
  };
}
