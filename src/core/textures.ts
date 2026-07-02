import * as THREE from 'three';

/**
 * Procedural canvas textures. Everything is generated at runtime so the
 * blockout has real surface detail without shipping image assets. When real
 * art lands these become fallbacks.
 */

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d canvas context unavailable');
  return [canvas, ctx];
}

function toTexture(canvas: HTMLCanvasElement, repeat = 1): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}

/** Cracked, water-stained concrete for Alpha's shell. */
export function concreteTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#474c41';
  ctx.fillRect(0, 0, 512, 512);
  // Blotchy water stains.
  for (let i = 0; i < 40; i++) {
    const r = 20 + Math.random() * 90;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, `rgba(20,28,18,${0.05 + Math.random() * 0.12})`);
    g.addColorStop(1, 'rgba(20,28,18,0)');
    ctx.save();
    ctx.translate(Math.random() * 512, Math.random() * 512);
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }
  // Speckle noise.
  for (let i = 0; i < 4000; i++) {
    const v = Math.random();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,240,0.04)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5);
  }
  // Cracks: dark meandering polylines.
  ctx.strokeStyle = 'rgba(15,18,12,0.55)';
  for (let c = 0; c < 7; c++) {
    ctx.lineWidth = 0.6 + Math.random() * 1.4;
    ctx.beginPath();
    let x = Math.random() * 512;
    let y = Math.random() * 512;
    ctx.moveTo(x, y);
    for (let s = 0; s < 14; s++) {
      x += (Math.random() - 0.5) * 70;
      y += (Math.random() - 0.3) * 60;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return toTexture(canvas, 2);
}

/** Brushed steel for Beta's shell. */
export function steelTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#aeb6bf';
  ctx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 1) {
    const a = 0.02 + Math.random() * 0.05;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(40,48,60,${a})`;
    ctx.fillRect(0, y, 512, 1);
  }
  // Panel seams.
  ctx.strokeStyle = 'rgba(30,36,44,0.5)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo((512 / 4) * i, 0);
    ctx.lineTo((512 / 4) * i, 512);
    ctx.stroke();
  }
  return toTexture(canvas, 1);
}

/**
 * Beta floor: white resin with a glowing cyan octagonal web (matches the
 * reference art). Returns [baseMap, emissiveMap].
 */
export function betaFloorTextures(): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const drawWeb = (ctx: CanvasRenderingContext2D, line: string, glow: boolean): void => {
    const cx = 256;
    const cy = 256;
    ctx.strokeStyle = line;
    ctx.lineWidth = 3;
    if (glow) {
      ctx.shadowColor = line;
      ctx.shadowBlur = 10;
    }
    // Concentric octagons.
    for (const r of [46, 100, 158, 216]) {
      ctx.beginPath();
      for (let k = 0; k <= 8; k++) {
        const a = (k * Math.PI) / 4 + Math.PI / 8;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Radial spokes.
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4 + Math.PI / 8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 46, cy + Math.sin(a) * 46);
      ctx.lineTo(cx + Math.cos(a) * 240, cy + Math.sin(a) * 240);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  };

  const [base, bctx] = makeCanvas(512, 512);
  bctx.fillStyle = '#e7ebef';
  bctx.fillRect(0, 0, 512, 512);
  drawWeb(bctx, 'rgba(30,180,230,0.55)', false);

  const [glow, gctx] = makeCanvas(512, 512);
  gctx.fillStyle = '#000000';
  gctx.fillRect(0, 0, 512, 512);
  drawWeb(gctx, '#20d5ff', true);

  return [toTexture(base), toTexture(glow)];
}

/** Alpha's carved stone zodiac mural (matches the reference art). */
export function muralTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(1024, 1024);
  const cx = 512;
  const cy = 512;
  const g = ctx.createRadialGradient(cx, cy, 100, cx, cy, 512);
  g.addColorStop(0, '#9a9179');
  g.addColorStop(1, '#6e6752');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 1024);
  // Weathering speckle.
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(60,52,38,0.1)' : 'rgba(230,224,200,0.06)';
    ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
  }
  // Carved rings.
  ctx.strokeStyle = '#4c4534';
  for (const [r, w] of [
    [470, 10],
    [420, 4],
    [310, 8],
    [180, 6],
  ] as const) {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Zodiac glyph ring. U+FE0E forces text presentation — without it macOS
  // renders these as full-colour emoji, which ruins the carved-stone look.
  const glyphs = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map(
    (glyph) => glyph + '\ufe0e',
  );
  ctx.fillStyle = '#3f3927';
  ctx.font = '84px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  glyphs.forEach((glyph, i) => {
    const a = (i / glyphs.length) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * 365, cy + Math.sin(a) * 365);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(glyph, 0, 0);
    ctx.restore();
  });
  // Tick marks between rings.
  ctx.strokeStyle = '#4c4534';
  ctx.lineWidth = 3;
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 290, cy + Math.sin(a) * 290);
    ctx.lineTo(cx + Math.cos(a) * 310, cy + Math.sin(a) * 310);
    ctx.stroke();
  }
  // Central Leo glyph, as in the reference.
  ctx.font = '260px serif';
  ctx.fillStyle = '#37311f';
  ctx.fillText('♌\ufe0e', cx, cy + 10);
  // Cracks.
  ctx.strokeStyle = 'rgba(40,34,22,0.6)';
  ctx.lineWidth = 3;
  for (let c = 0; c < 4; c++) {
    ctx.beginPath();
    let x = cx + (Math.random() - 0.5) * 300;
    let y = 30;
    ctx.moveTo(x, y);
    while (y < 1000) {
      x += (Math.random() - 0.5) * 90;
      y += 60 + Math.random() * 80;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const tex = toTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/** Beta's star-map console screen. */
export function starmapTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#030d1c';
  ctx.fillRect(0, 0, 512, 512);
  // Star field.
  for (let i = 0; i < 240; i++) {
    ctx.fillStyle = `rgba(220,235,255,${0.2 + Math.random() * 0.8})`;
    const s = Math.random() > 0.92 ? 2.5 : 1.2;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, s, s);
  }
  // A constellation echoing the mural's Leo.
  const pts: Array<[number, number]> = [
    [120, 340], [180, 300], [240, 310], [300, 260], [340, 190], [300, 130], [240, 150],
  ];
  ctx.strokeStyle = 'rgba(40,210,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();
  for (const [x, y] of pts) {
    ctx.fillStyle = '#7fe7ff';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // HUD chrome.
  ctx.strokeStyle = 'rgba(40,210,255,0.5)';
  ctx.strokeRect(8, 8, 496, 496);
  ctx.fillStyle = '#2fd4ff';
  ctx.font = '22px monospace';
  ctx.fillText('STELLAR MAP // SECTOR 7', 20, 36);
  ctx.font = '16px monospace';
  ctx.fillText('LOCKED — AWAITING FREQ KEY', 20, 490);
  const tex = toTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/** Small utility label plate (e.g. the "R2" door marking). */
export function labelTexture(text: string, color = '#bfe9ff'): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(128, 128);
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = color;
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 68);
  const tex = toTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Beta's animated holographic audio-analyzer screen. Redrawn per-frame with a
 * deterministic waveform (sines over elapsed time). Rendered additively, so
 * dark pixels vanish and bright cyan floats.
 */
export class HoloScreen {
  readonly texture: THREE.CanvasTexture;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(
    private readonly w = 512,
    private readonly h = 288,
  ) {
    [this.canvas, this.ctx] = makeCanvas(w, h);
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
  }

  update(elapsed: number): void {
    const { ctx, w, h } = this;
    ctx.fillStyle = '#02141f';
    ctx.fillRect(0, 0, w, h);
    // Faint grid.
    ctx.strokeStyle = 'rgba(40,180,230,0.18)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Waveform bars.
    const mid = h * 0.52;
    for (let x = 0; x < w; x += 5) {
      const amp =
        (h / 3.4) *
        (0.42 * Math.sin(x * 0.032 + elapsed * 2.1) +
          0.31 * Math.sin(x * 0.071 - elapsed * 3.4) +
          0.27 * Math.sin(x * 0.011 + elapsed * 0.7));
      const bright = 0.55 + 0.45 * Math.sin(x * 0.02 + elapsed * 4);
      ctx.fillStyle = `rgba(46,220,255,${0.35 + 0.5 * bright})`;
      ctx.fillRect(x, mid - Math.abs(amp), 3, Math.abs(amp) * 2 || 1);
    }
    // Sweep line.
    const sweep = (elapsed * 90) % w;
    ctx.fillStyle = 'rgba(180,245,255,0.8)';
    ctx.fillRect(sweep, 12, 2, h - 44);
    // Chrome + text.
    ctx.strokeStyle = 'rgba(46,220,255,0.7)';
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = '#8fecff';
    ctx.font = '16px monospace';
    ctx.fillText('AUDIO ANALYZER v9.4', 14, 24);
    const blink = Math.sin(elapsed * 3.5) > 0;
    ctx.fillStyle = blink ? '#c9f6ff' : 'rgba(201,246,255,0.35)';
    ctx.fillText('FREQ INPUT: [ ---- ]   AWAITING RHYTHM…', 14, h - 14);
    this.texture.needsUpdate = true;
  }
}
