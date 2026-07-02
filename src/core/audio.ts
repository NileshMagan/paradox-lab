/**
 * Minimal WebAudio synth for puzzle feedback — no assets, just oscillators.
 * The context can only start after a user gesture, so everything routes
 * through `ensureAudio()` and silently no-ops until then.
 */

let ctx: AudioContext | null = null;

export function ensureAudio(): void {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
}

function tone(
  freq: number,
  duration: number,
  opts: { endFreq?: number; type?: OscillatorType; gain?: number; delay?: number } = {},
): void {
  if (!ctx || ctx.state !== 'running') return;
  const t0 = ctx.currentTime + (opts.delay ?? 0);
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.endFreq) osc.frequency.exponentialRampToValueAtTime(opts.endFreq, t0 + duration);
  amp.gain.setValueAtTime(opts.gain ?? 0.15, t0);
  amp.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** A water drop landing in a metal bucket. */
export function playDrip(): void {
  tone(760, 0.14, { endFreq: 240, gain: 0.12 });
  tone(1500, 0.05, { endFreq: 900, gain: 0.04 });
}

/** UI tap/click feedback. */
export function playBlip(freq = 880): void {
  tone(freq, 0.07, { type: 'square', gain: 0.05 });
}

/** Puzzle-solved fanfare: a rising fifth. */
export function playSuccess(): void {
  tone(523, 0.15, { gain: 0.12 });
  tone(784, 0.3, { gain: 0.12, delay: 0.14 });
}

/** Pattern rejected. */
export function playFail(): void {
  tone(220, 0.25, { endFreq: 110, type: 'sawtooth', gain: 0.07 });
}
