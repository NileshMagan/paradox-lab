/**
 * Puzzle-logic layer — the piece the asset audit flagged as the real ceiling on
 * intricacy. Instead of each puzzle being an isolated set-to-target with ad-hoc
 * booleans, a stage declares FACTS (state props write) and GATES (things that
 * fire when a condition over the facts becomes true). That makes props
 * interdependent — "the vault opens when decoded AND power AND !alarm" — without
 * tangled flag-juggling in every game factory.
 *
 * It's deliberately tiny and game-agnostic: no THREE, no rendering. A factory
 * builds one, has props call `set(...)`, declares `when(...)` gates, and calls
 * `tick()` from its update loop (so time-based conditions re-evaluate too).
 *
 * Also here: pipe-connectivity helpers for the pipeGrid mechanism (below), kept
 * beside the engine because "is the flow connected?" is pure logic.
 */

export type Fact = boolean | number | string;

export interface PuzzleMachine {
  /** Write a fact (defaults to `true`). Re-evaluates gates immediately. */
  set(key: string, value?: Fact): void;
  get(key: string): Fact | undefined;
  /** Truthy test: true unless the fact is unset, false, 0, or ''. */
  is(key: string): boolean;
  /** How many of the given keys are truthy — handy for "N of M" gates. */
  countTrue(...keys: string[]): number;
  /** Register a one-shot gate; fires `action` the first time `cond` holds. */
  when(cond: () => boolean, action: () => void): void;
  /** Re-evaluate gates (call each frame for time-based conditions). */
  tick(): void;
}

export function createPuzzle(): PuzzleMachine {
  const facts = new Map<string, Fact>();
  const gates: Array<{ cond: () => boolean; action: () => void; fired: boolean }> = [];

  const evaluate = (): void => {
    // Loop until stable: a gate's action may set facts that trip another gate.
    let changed = true;
    let guard = 0;
    while (changed && guard++ < 64) {
      changed = false;
      for (const gate of gates) {
        if (!gate.fired && gate.cond()) {
          gate.fired = true;
          gate.action();
          changed = true;
        }
      }
    }
  };

  const machine: PuzzleMachine = {
    set(key, value = true) {
      facts.set(key, value);
      evaluate();
    },
    get(key) {
      return facts.get(key);
    },
    is(key) {
      const v = facts.get(key);
      return Boolean(v);
    },
    countTrue(...keys) {
      return keys.reduce((n, k) => n + (machine.is(k) ? 1 : 0), 0);
    },
    when(cond, action) {
      gates.push({ cond, action, fired: false });
      evaluate();
    },
    tick() {
      evaluate();
    },
  };
  return machine;
}

// ── Pipe connectivity (for the pipeGrid mechanism) ───────────────────────────

/** Pipe tile shapes. Openings are on the four sides [N, E, S, W]. */
export type PipeKind = 'straight' | 'elbow' | 'tee' | 'cross' | 'end';

/** Base openings at orientation 0, indexed [N, E, S, W]. */
const BASE_OPENINGS: Record<PipeKind, boolean[]> = {
  end: [true, false, false, false],
  straight: [true, false, true, false],
  elbow: [true, true, false, false],
  tee: [true, true, true, false],
  cross: [true, true, true, true],
};

/** Openings of a tile after `orient` clockwise quarter-turns (0..3). */
export function openings(kind: PipeKind, orient: number): boolean[] {
  const base = BASE_OPENINGS[kind];
  const o = ((orient % 4) + 4) % 4;
  // A clockwise turn moves N→E→S→W, so side d now shows what side (d-o) had.
  return [0, 1, 2, 3].map((d) => base[(d - o + 4) % 4]);
}

const DELTA: Array<[number, number, number]> = [
  [-1, 0, 2], // N → neighbour above, whose opposite side is S(2)
  [0, 1, 3], // E → right, opposite W(3)
  [1, 0, 0], // S → below, opposite N(0)
  [0, -1, 1], // W → left, opposite E(1)
];

/**
 * Is `dst` reachable from `src` through mutually-open pipe tiles? Two adjacent
 * tiles connect when each has an opening facing the other.
 */
export function pipeConnected(
  kinds: PipeKind[][],
  orient: number[][],
  src: [number, number],
  dst: [number, number],
): boolean {
  const rows = kinds.length;
  const cols = kinds[0]?.length ?? 0;
  const seen = new Set<string>();
  const stack: Array<[number, number]> = [src];
  seen.add(src.join(','));
  while (stack.length) {
    const [r, c] = stack.pop() as [number, number];
    if (r === dst[0] && c === dst[1]) return true;
    const here = openings(kinds[r][c], orient[r][c]);
    for (let d = 0; d < 4; d++) {
      if (!here[d]) continue;
      const [dr, dc, opp] = DELTA[d];
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
      const key = `${nr},${nc}`;
      if (seen.has(key)) continue;
      const there = openings(kinds[nr][nc], orient[nr][nc]);
      if (there[opp]) {
        seen.add(key);
        stack.push([nr, nc]);
      }
    }
  }
  return false;
}

// ── Laser reflection (for the laserGrid mechanism) ───────────────────────────

/** Mirror state per cell: 0 = "/", 1 = "\", null = empty. */
export type MirrorState = 0 | 1 | null;

/**
 * Trace a beam through a mirror grid and report the cell/direction it exits.
 * A "/" mirror maps E↔N and W↔S; a "\" mirror maps E↔S and W↔N. Directions are
 * [dRow, dCol]. Returns the last in-grid cell and the direction it left in.
 */
export function traceLaser(
  rows: number,
  cols: number,
  mirrors: MirrorState[][],
  start: { r: number; c: number; dir: [number, number] },
): { r: number; c: number; dir: [number, number] } {
  let { r, c } = start;
  let [dr, dc] = start.dir;
  for (let step = 0; step < rows * cols * 4 + 4; step++) {
    const m = mirrors[r]?.[c];
    if (m === 0) [dr, dc] = [-dc, -dr]; // "/"
    else if (m === 1) [dr, dc] = [dc, dr]; // "\"
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) return { r, c, dir: [dr, dc] };
    r = nr;
    c = nc;
  }
  return { r: -1, c: -1, dir: [0, 0] };
}

