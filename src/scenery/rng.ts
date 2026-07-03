/**
 * Deterministic seeded RNG for scenery generation.
 *
 * Scenery builders must draw ALL randomness from an `Rng` — never
 * `Math.random()` — so one seed always produces the identical world. This
 * matters twice over: the planned server-authoritative multiplayer needs two
 * clients of the same dimension to agree on every strand of ivy, and
 * deterministic scenes make visual output reproducible (walkthrough video,
 * screenshot diffing, bug reports with a seed attached).
 */

/** xmur3 string hash → well-mixed 32-bit seed. */
function hashString(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export class Rng {
  /** The constructor seed, kept so `fork` is independent of draw order. */
  private readonly seed: number;
  private state: number;

  constructor(seed: number | string) {
    this.seed = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
    // mulberry32 degenerates from a zero state; nudge with a golden-ratio odd.
    if (this.seed === 0) this.seed = 0x9e3779b9;
    this.state = this.seed;
  }

  /** Next float in [0, 1) — mulberry32. */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform float in [min, max). */
  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** Uniform integer in [0, maxExclusive). */
  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  /** Uniform choice from a non-empty list. */
  pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)];
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Symmetric noise in (-amount, amount). */
  jitter(amount: number): number {
    return (this.next() * 2 - 1) * amount;
  }

  /** Uniform angle in [0, 2π). */
  angle(): number {
    return this.next() * Math.PI * 2;
  }

  /**
   * Derive an independent labelled stream from the ORIGINAL seed (not the
   * current state), so adding or removing draws in one feature never shifts
   * the sequence another feature sees. Same seed + same label ⇒ same stream.
   */
  fork(label: string): Rng {
    return new Rng((hashString(label) ^ Math.imul(this.seed, 0x85ebca6b)) >>> 0);
  }
}
