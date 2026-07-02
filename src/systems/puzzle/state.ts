/**
 * Puzzle dependency graph + solved-state store.
 *
 * IMPORTANT: this module-level singleton is the LOCAL STAND-IN for the
 * server-authoritative store described in docs/ARCHITECTURE.md. When the
 * networking layer lands, `solve()` becomes "send intent to server" and the
 * `solved` event becomes "server broadcast a state delta" — the rooms
 * consuming this API should not need to change.
 */

export type PuzzleId =
  | 'sync.frequency'
  | 'sync.starmap'
  | 'grid.chemical'
  | 'grid.bloom'
  | 'grid.server'
  | 'core.anchor'
  | 'core.mirrors'
  | 'core.lever';

/** The dependency graph from docs/DESIGN.md §7. */
export const PUZZLE_REQUIRES: Record<PuzzleId, PuzzleId[]> = {
  'sync.frequency': [],
  'sync.starmap': ['sync.frequency'],
  'grid.chemical': ['sync.starmap'],
  'grid.bloom': ['grid.chemical'],
  'grid.server': ['grid.bloom'],
  'core.anchor': ['grid.server'],
  'core.mirrors': ['core.anchor'],
  'core.lever': ['core.mirrors'],
};

export class PuzzleGraph extends EventTarget {
  private readonly solved = new Set<PuzzleId>();

  isSolved(id: PuzzleId): boolean {
    return this.solved.has(id);
  }

  /** A puzzle is available once everything it requires is solved. */
  isAvailable(id: PuzzleId): boolean {
    return PUZZLE_REQUIRES[id].every((req) => this.solved.has(req));
  }

  /** Mark solved (idempotent). Emits `solved` with the id as detail. */
  solve(id: PuzzleId): void {
    if (this.solved.has(id) || !this.isAvailable(id)) return;
    this.solved.add(id);
    this.dispatchEvent(new CustomEvent<PuzzleId>('solved', { detail: id }));
  }

  onSolved(handler: (id: PuzzleId) => void): void {
    this.addEventListener('solved', (e) => handler((e as CustomEvent<PuzzleId>).detail));
  }
}

/** The shared session store (see module doc — will move server-side). */
export const puzzleState = new PuzzleGraph();
