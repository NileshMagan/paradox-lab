import {
  BLOOM_SAFE_PATH,
  LEVER_SYNC_WINDOW,
  MIRROR_COUNT,
  TARGET_MIRRORS,
  VALVE_COUNT,
  type LaserColor,
} from '@/config/puzzles';
import { puzzleState } from '@/systems/puzzle/state';
import { DimensionId } from '@/types';

/**
 * Live cross-dimension puzzle channel: the mutable mid-puzzle state that one
 * dimension writes and the other reads every frame (laser colour → flora
 * bloom, valves → hack, lever timing). Rooms poll this in their `update`
 * rather than subscribing, matching how they already poll `puzzleState`.
 *
 * IMPORTANT: like `puzzleState`, this module-level singleton is the LOCAL
 * STAND-IN for the server-authoritative store (docs/ARCHITECTURE.md). When
 * networking lands, these setters become "send intent to server" and the
 * fields become replicated state — the rooms consuming this API stay as-is.
 */
class CrossDimensionSession {
  // ── grid.bloom ────────────────────────────────────────────────────────────
  /** The colour Beta's laser grid currently emits. Alpha's flora mirrors it. */
  laserColor: LaserColor = 'crimson';
  /** Maze zones Beta has crossed (0..BLOOM_SAFE_PATH.length). */
  bloomZone = 0;

  /** Does the emitted colour open the blooms for the zone Beta is entering? */
  laserMatchesSafePath(): boolean {
    return this.bloomZone < BLOOM_SAFE_PATH.length && this.laserColor === BLOOM_SAFE_PATH[this.bloomZone];
  }

  /** Alpha waves Beta through the current zone. True if Beta advanced. */
  advanceBloomZone(): boolean {
    if (!this.laserMatchesSafePath()) return false;
    this.bloomZone += 1;
    if (this.bloomZone === BLOOM_SAFE_PATH.length) puzzleState.solve('grid.bloom');
    return true;
  }

  // ── grid.server ───────────────────────────────────────────────────────────
  /** Coolant valves Alpha has opened. Beta's hack needs all of them. */
  valvesOpen = 0;

  openValve(): boolean {
    if (this.valvesOpen >= VALVE_COUNT) return false;
    this.valvesOpen += 1;
    return true;
  }

  get allValvesOpen(): boolean {
    return this.valvesOpen >= VALVE_COUNT;
  }

  // ── core.mirrors ──────────────────────────────────────────────────────────
  /** Which of Alpha's heavy mirrors are rotated to face the reactor. */
  readonly alignedMirrors = new Set<number>();

  toggleMirror(index: number): void {
    if (this.alignedMirrors.has(index)) this.alignedMirrors.delete(index);
    else this.alignedMirrors.add(index);
    // Exactly the target set — a wrong extra mirror scatters the beam.
    const correct =
      this.alignedMirrors.size === TARGET_MIRRORS.length &&
      TARGET_MIRRORS.every((m) => this.alignedMirrors.has(m));
    if (correct) puzzleState.solve('core.mirrors');
  }

  mirrorAligned(index: number): boolean {
    return this.alignedMirrors.has(index);
  }

  /** Beta's terminal reads this back so Beta can guide Alpha over voice. */
  describeMirrors(): string {
    if (this.alignedMirrors.size === 0) return 'none';
    return [...this.alignedMirrors]
      .sort((a, b) => a - b)
      .map((m) => String(m + 1))
      .join(', ');
  }

  // ── core.lever ────────────────────────────────────────────────────────────
  /** When each dimension pulled its lever (seconds, performance clock). */
  private readonly leverPulls: Record<DimensionId, number | null> = {
    [DimensionId.Alpha]: null,
    [DimensionId.Beta]: null,
  };

  pullLever(dim: DimensionId, now: number): void {
    this.leverPulls[dim] = now;
    const other = dim === DimensionId.Alpha ? DimensionId.Beta : DimensionId.Alpha;
    const otherPull = this.leverPulls[other];
    if (otherPull !== null && now - otherPull <= LEVER_SYNC_WINDOW) {
      puzzleState.solve('core.lever');
    }
  }

  leverPulled(dim: DimensionId): boolean {
    return this.leverPulls[dim] !== null;
  }

  /**
   * A lone pull past the sync window springs back (the escape must be
   * simultaneous). Returns the dimension that lost its pull, for feedback.
   */
  expireLonePull(now: number): DimensionId | null {
    if (puzzleState.isSolved('core.lever')) return null;
    for (const dim of [DimensionId.Alpha, DimensionId.Beta]) {
      const pull = this.leverPulls[dim];
      if (pull !== null && now - pull > LEVER_SYNC_WINDOW) {
        this.leverPulls[dim] = null;
        return dim;
      }
    }
    return null;
  }
}

// MIRROR_COUNT is validated here so a bad config fails loudly at boot.
if (TARGET_MIRRORS.some((m) => m < 0 || m >= MIRROR_COUNT)) {
  throw new Error('TARGET_MIRRORS out of range for MIRROR_COUNT');
}

/** The shared live session (see class doc — will move server-side). */
export const session = new CrossDimensionSession();
