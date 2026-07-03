/**
 * Tuning constants for every puzzle in the facility (docs/DESIGN.md §4–6).
 * Content and difficulty live here, not in the rooms, so both dimensions
 * always agree on the answers.
 */

/** Gaps between drips in seconds: short, short, long, short. */
export const DRIP_PATTERN = [0.6, 0.6, 1.2, 0.6] as const;

/** Loop length — the pattern repeats every this many seconds. */
export const DRIP_LOOP = DRIP_PATTERN.reduce((a, b) => a + b, 0);

/** Relative tolerance when matching tapped intervals against the pattern. */
export const RHYTHM_TOLERANCE = 0.3;

/** The zodiac ring, in mural order. */
export const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'] as const;

/** The star map points at Leo — the glyph Alpha must align. */
export const TARGET_GLYPH_INDEX = 4; // ♌

// ── Room 2 — grid.chemical ─────────────────────────────────────────────────

/**
 * What Alpha's soil strips reveal, one line per test. The clues all point at
 * one compound; Alpha reads these out, Beta picks it on the analyzer.
 */
export const SOIL_READINGS = [
  'Strip 1 turns DEEP RED — pH 1. Violently acidic.',
  'Strip 2 blackens and smokes — it is eating the paper.',
  'The sample reeks of SULPHUR. Yellow crust on the tray.',
] as const;

/** Compound candidates Beta cycles through on the Chemical Analyzer. */
export const CHEM_COMPOUNDS = ['NaOH', 'H₂O', 'NaCl', 'H₂SO₄', 'NH₃', 'C₂H₅OH'] as const;

/** The strong sulphuric acid the soil readings describe. */
export const TARGET_COMPOUND_INDEX = 3; // H₂SO₄

// ── Room 2 — grid.bloom ────────────────────────────────────────────────────

/** Laser emission colours Beta can shift the grid between. */
export type LaserColor = 'crimson' | 'blue';

/**
 * The safe path through the laser maze, one entry per zone (entry → exit).
 * Alpha's flora blooms open where the CURRENT zone's safe colour is emitted;
 * Alpha waves Beta through zone by zone.
 */
export const BLOOM_SAFE_PATH: readonly LaserColor[] = ['blue', 'crimson', 'blue'];

// ── Room 2 — grid.server ───────────────────────────────────────────────────

/** Rusted coolant valves Alpha must open before Beta's hack can run. */
export const VALVE_COUNT = 3;

/** How long Beta's server hack takes once it starts (seconds). */
export const HACK_DURATION = 3;

// ── Room 3 — core.anchor ───────────────────────────────────────────────────

/** Anchor-constant candidates Beta cycles on the dilation charts. */
export const ANCHOR_CANDIDATES = ['41.9', '42.3', '42.7', '43.1', '43.5'] as const;

/** The constant scrawled on Alpha's whiteboard: ANCHOR ≡ 42.7. */
export const TARGET_ANCHOR_INDEX = 2;

// ── Room 3 — core.mirrors ──────────────────────────────────────────────────

/** Heavy mirror units on the rusted track in Alpha. */
export const MIRROR_COUNT = 5;

/** Which mirrors channel the energy (0-indexed): "MIRRORS 2 & 5 !!". */
export const TARGET_MIRRORS: readonly number[] = [1, 4];

// ── Room 3 — core.lever ────────────────────────────────────────────────────

/**
 * Both levers must be pulled within this window (seconds) to merge the
 * timelines. Generous for single-client dev (you have to switch dimensions
 * by keyboard); tighten once each player has their own client.
 */
export const LEVER_SYNC_WINDOW = 6;
