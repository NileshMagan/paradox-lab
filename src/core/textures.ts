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

/**
 * Beta's star-map console screen. Locked: encrypted noise. Unlocked: the Leo
 * constellation and the coordinates Beta must read out to Alpha.
 */
export function starmapTexture(unlocked = false): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#030d1c';
  ctx.fillRect(0, 0, 512, 512);
  // Star field.
  for (let i = 0; i < 240; i++) {
    ctx.fillStyle = `rgba(220,235,255,${0.2 + Math.random() * 0.8})`;
    const s = Math.random() > 0.92 ? 2.5 : 1.2;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, s, s);
  }
  if (unlocked) {
    // The constellation echoing the mural — Leo.
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
    ctx.fillStyle = '#ffd27f';
    ctx.font = '44px serif';
    ctx.fillText('♌︎', 395, 110);
    ctx.font = '26px monospace';
    ctx.fillText('SECTOR: LEO', 300, 420);
    ctx.fillStyle = '#8fecff';
    ctx.font = '18px monospace';
    ctx.fillText('→ RELAY TO ALPHA: ALIGN THE LION', 60, 460);
  } else {
    // Encrypted garbage rows.
    ctx.fillStyle = 'rgba(47,212,255,0.5)';
    ctx.font = '16px monospace';
    for (let row = 0; row < 12; row++) {
      let line = '';
      for (let c = 0; c < 26; c++) line += Math.floor(Math.random() * 16).toString(16);
      ctx.fillText(line, 40, 110 + row * 28);
    }
    ctx.fillStyle = '#ff5468';
    ctx.font = '24px monospace';
    ctx.fillText('⚠ ENCRYPTED', 170, 470);
  }
  // HUD chrome.
  ctx.strokeStyle = 'rgba(40,210,255,0.5)';
  ctx.strokeRect(8, 8, 496, 496);
  ctx.fillStyle = '#2fd4ff';
  ctx.font = '22px monospace';
  ctx.fillText('STELLAR MAP // SECTOR 7', 20, 36);
  ctx.font = '16px monospace';
  ctx.fillText(unlocked ? 'DECRYPTED ✓' : 'LOCKED — AWAITING FREQ KEY', 20, 66);
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

  /** Bottom status line — the rhythm puzzle drives these. */
  status = 'FREQ INPUT: [ ---- ]';
  subStatus = 'AWAITING RHYTHM…';
  /** Recorded taps, drawn as tick squares while the analyzer is armed. */
  ticks = 0;

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
    ctx.fillText(`${this.status}   ${this.subStatus}`, 14, h - 14);
    // Tap ticks while recording.
    for (let i = 0; i < this.ticks; i++) {
      ctx.fillStyle = '#7cf9c9';
      ctx.fillRect(w - 30 - i * 22, h - 28, 14, 14);
    }
    this.texture.needsUpdate = true;
  }
}

/**
 * Beta corridor floor: white resin with glowing fibre-optic streams running
 * lengthwise under the surface. Returns [baseMap, emissiveMap].
 */
export function streamFloorTextures(): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const drawStreams = (ctx: CanvasRenderingContext2D, glow: boolean): void => {
    for (let i = 0; i < 14; i++) {
      const x = 20 + Math.random() * 472;
      const hue = Math.random() > 0.25 ? '32,213,255' : '120,255,214';
      ctx.strokeStyle = `rgba(${hue},${glow ? 0.9 : 0.4})`;
      ctx.lineWidth = 1.5 + Math.random() * 2.5;
      if (glow) {
        ctx.shadowColor = `rgb(${hue})`;
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.moveTo(x, 0);
      // Streams jink sideways occasionally, like routed fibre.
      let cx2 = x;
      for (let y = 0; y <= 512; y += 64) {
        if (Math.random() > 0.7) cx2 += (Math.random() - 0.5) * 40;
        ctx.lineTo(cx2, y);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  };
  const [base, bctx] = makeCanvas(512, 512);
  bctx.fillStyle = '#e7ebef';
  bctx.fillRect(0, 0, 512, 512);
  drawStreams(bctx, false);
  const [glow, gctx] = makeCanvas(512, 512);
  gctx.fillStyle = '#000000';
  gctx.fillRect(0, 0, 512, 512);
  drawStreams(gctx, true);
  const t1 = toTexture(base);
  const t2 = toTexture(glow);
  t1.repeat.set(1, 3);
  t2.repeat.set(1, 3);
  return [t1, t2];
}

/**
 * Beta dome floor: white resin with concentric glow rings + radial spokes
 * converging on the reactor pit. Returns [baseMap, emissiveMap].
 */
export function domeFloorTextures(): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const draw = (ctx: CanvasRenderingContext2D, glow: boolean): void => {
    const line = glow ? '#20d5ff' : 'rgba(30,180,230,0.45)';
    ctx.strokeStyle = line;
    ctx.lineWidth = 3;
    if (glow) {
      ctx.shadowColor = line;
      ctx.shadowBlur = 12;
    }
    for (const r of [120, 210, 300, 400, 480]) {
      ctx.beginPath();
      ctx.arc(512, 512, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(512 + Math.cos(a) * 120, 512 + Math.sin(a) * 120);
      ctx.lineTo(512 + Math.cos(a) * 500, 512 + Math.sin(a) * 500);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  };
  const [base, bctx] = makeCanvas(1024, 1024);
  bctx.fillStyle = '#e7ebef';
  bctx.fillRect(0, 0, 1024, 1024);
  draw(bctx, false);
  const [glow, gctx] = makeCanvas(1024, 1024);
  gctx.fillStyle = '#000000';
  gctx.fillRect(0, 0, 1024, 1024);
  draw(gctx, true);
  const t1 = toTexture(base);
  const t2 = toTexture(glow);
  t1.wrapS = t1.wrapT = THREE.ClampToEdgeWrapping;
  t2.wrapS = t2.wrapT = THREE.ClampToEdgeWrapping;
  return [t1, t2];
}

/** Alpha's faded whiteboard, covered in frantic time-dilation scribbles. */
export function whiteboardTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 384);
  ctx.fillStyle = '#e6e2d6';
  ctx.fillRect(0, 0, 512, 384);
  // Age stains.
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(140,120,80,${0.03 + Math.random() * 0.08})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 384, 15 + Math.random() * 50, 0, Math.PI * 2);
    ctx.fill();
  }
  // Frantic scribble strokes.
  ctx.strokeStyle = 'rgba(60,55,90,0.35)';
  for (let s = 0; s < 12; s++) {
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    let x = Math.random() * 460 + 20;
    let y = Math.random() * 340 + 20;
    ctx.moveTo(x, y);
    for (let i = 0; i < 6; i++) {
      x += (Math.random() - 0.5) * 90;
      y += (Math.random() - 0.4) * 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // The legible fragments players actually need.
  const lines: Array<[string, number, number, string]> = [
    ['Δt′ = γ·Δt', 30, 60, 'rgba(45,45,80,0.8)'],
    ['γ = 1/√(1−v²/c²)', 40, 120, 'rgba(45,45,80,0.75)'],
    ['ψ(t) ⇒ ψ(t ± τ)', 250, 90, 'rgba(45,45,80,0.6)'],
    ['ANCHOR ≡ 42.7', 60, 210, 'rgba(120,40,40,0.85)'],
    ['MIRRORS 2 & 5 !!', 260, 250, 'rgba(120,40,40,0.7)'],
    ['DO NOT DESYNC', 120, 330, 'rgba(120,40,40,0.8)'],
  ];
  for (const [text, x, y, color] of lines) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 0.12);
    ctx.fillStyle = color;
    ctx.font = 'italic 30px serif';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  const tex = toTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/** Beta's chemical-analyzer kiosk screen (Grid room, puzzle grid.chemical). */
export function chemScreenTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 384);
  ctx.fillStyle = '#041018';
  ctx.fillRect(0, 0, 512, 384);
  ctx.strokeStyle = 'rgba(40,210,255,0.6)';
  ctx.strokeRect(8, 8, 496, 368);
  ctx.fillStyle = '#2fd4ff';
  ctx.font = '26px monospace';
  ctx.fillText('CHEMICAL ANALYZER', 20, 44);
  // pH colour scale — the bridge to Alpha's soil test strips.
  const grad = ctx.createLinearGradient(30, 0, 482, 0);
  grad.addColorStop(0, '#e33');
  grad.addColorStop(0.35, '#ec2');
  grad.addColorStop(0.6, '#2c5');
  grad.addColorStop(1, '#63c');
  ctx.fillStyle = grad;
  ctx.fillRect(30, 80, 452, 40);
  ctx.fillStyle = '#cfeeff';
  ctx.font = '18px monospace';
  for (let i = 0; i <= 14; i += 2) ctx.fillText(String(i), 30 + (i / 14) * 440, 145);
  ctx.font = '22px monospace';
  ctx.fillText('BASE CODE: [ ?? ?? ?? ]', 30, 210);
  ctx.fillText('AWAITING FIELD SAMPLE…', 30, 250);
  ctx.fillStyle = 'rgba(47,212,255,0.55)';
  ctx.font = '16px monospace';
  ctx.fillText('input via voice-link from Dimension Alpha', 30, 340);
  const tex = toTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/** Server-rack face: rows of tiny status LEDs. Used as map + emissiveMap. */
export function rackTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 512);
  ctx.fillStyle = '#0a0d12';
  ctx.fillRect(0, 0, 256, 512);
  // Unit seams.
  ctx.strokeStyle = 'rgba(90,100,115,0.5)';
  for (let y = 0; y < 512; y += 42) {
    ctx.strokeRect(8, y + 4, 240, 36);
  }
  // Status LEDs.
  for (let y = 14; y < 512; y += 42) {
    for (let x = 20; x < 180; x += 12) {
      const roll = Math.random();
      ctx.fillStyle =
        roll > 0.92 ? '#ff4444' : roll > 0.55 ? '#2fd4ff' : roll > 0.25 ? '#39f0a0' : '#123';
      ctx.fillRect(x, y + Math.floor(Math.random() * 3) * 6, 5, 3);
    }
  }
  return toTexture(canvas);
}

/**
 * Beta's Paradox Core dilation display: two diverging timeline curves and a
 * countdown running at 2× (the time-dilation gimmick). Redrawn per-frame.
 */
export class ChartScreen {
  readonly texture: THREE.CanvasTexture;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(
    private readonly w = 512,
    private readonly h = 320,
  ) {
    [this.canvas, this.ctx] = makeCanvas(w, h);
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
  }

  update(elapsed: number): void {
    const { ctx, w, h } = this;
    ctx.fillStyle = '#02141f';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(40,180,230,0.2)';
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
    // Two timelines drifting apart — Alpha slow, Beta fast.
    const mid = h * 0.55;
    for (const [speed, color] of [
      [1, '#39f0a0'],
      [2, '#ff5468'],
    ] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const t = x * 0.02 + elapsed * speed;
        const y = mid - Math.sin(t) * 26 - x * 0.06 * (speed - 1);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Countdown at 2× — Beta's clock runs fast.
    const remaining = Math.max(0, 600 - elapsed * 2);
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(Math.floor(remaining % 60)).padStart(2, '0');
    const d = String(Math.floor((remaining % 1) * 10));
    ctx.fillStyle = remaining < 60 && Math.sin(elapsed * 8) > 0 ? '#ff5468' : '#ffb85c';
    ctx.font = 'bold 44px monospace';
    ctx.fillText(`CORE BREACH T-${m}:${s}.${d}`, 18, 52);
    ctx.fillStyle = '#8fecff';
    ctx.font = '18px monospace';
    ctx.fillText('TEMPORAL DILATION ×2.00 — ALIGN MIRRORS (ALPHA SIDE)', 18, h - 16);
    this.texture.needsUpdate = true;
  }
}
