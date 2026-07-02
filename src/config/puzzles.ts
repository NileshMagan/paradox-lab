/**
 * Tuning constants for the Sync Chamber puzzle loop (docs/DESIGN.md §4).
 * Alpha's drip physically plays this rhythm; Beta must tap it back.
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
