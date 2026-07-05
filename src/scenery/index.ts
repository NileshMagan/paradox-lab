/**
 * Scenery toolkit — deterministic, reusable set dressing.
 *
 * Usage inside a room builder:
 *
 *   const rng = new Rng('grid-alpha:v1');          // any stable seed string
 *   const kit = createAlphaKit();
 *   const spots = scatter({ seed: 'grid:floor', area: insetArea(6, 18), count: 5,
 *                           avoid: [{ ...slotLocal(RoomId.Grid, 'grid.field'), radius: 1.5 }] });
 *   for (const p of spots) {
 *     const pile = rubblePile(rng.fork(`pile:${p.x},${p.z}`), kit);
 *     applyPlacement(pile, p);
 *     root.add(pile);
 *   }
 *
 * Same seed ⇒ same scenery, every load, every client. See src/scenery/README.md.
 */
export { Rng } from './rng';
export {
  createAlphaKit,
  createBetaKit,
  disposeSceneryObject,
  type AlphaKit,
  type BetaKit,
} from './kits';
export {
  scatter,
  alongWall,
  ring,
  insetArea,
  applyPlacement,
  type Placement,
  type KeepOut,
  type Area,
} from './dress';
export {
  createPalette,
  createStandardPalettes,
  PALETTE_SPECS,
  type Palette,
  type PaletteSpec,
} from './palettes';
export * from './assets/alpha';
export * from './assets/beta';
export * from './assets/shared';
export * from './assets/architecture';
export * from './assets/furniture';
export * from './assets/machines';
export * from './assets/clutter';
export * from './assets/wallArt';
export * from './assets/puzzleInputs';
export * from './assets/puzzleObjects';
export * from './assets/laboratory';
export * from './assets/medical';
export * from './assets/industrial';
export * from './assets/storage';
export * from './assets/lighting';
export * from './assets/hightech';
export * from './assets/egyptian';
export * from './assets/temple';
export * from './assets/bar';
export * from './assets/city';
export * from './assets/winter';
export * from './assets/spy';
export * from './assets/gothic';
export * from './assets/manor';
export * from './assets/contraptions';
export * from './assets/logicProps';
export * from './assets/readable';
export {
  createPuzzle,
  openings,
  pipeConnected,
  traceLaser,
  type Fact,
  type MirrorState,
  type PipeKind,
  type PuzzleMachine,
} from './puzzleLogic';
export * from './assets/custom';
export * from './assets/vista';
export * from './assets/weather';
export * from './assets/vehicles';
export * from './assets/figures';
export * from './assets/water';
export * from './assets/nautical';
export * from './assets/western';
export * from './assets/steampunk';
export * from './assets/terrain';
export * from './assets/jungle';
export * from './assets/characters';
export * from './assets/sound';
