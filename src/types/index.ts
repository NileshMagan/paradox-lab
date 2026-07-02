/**
 * Shared domain types for The Quantum Split.
 *
 * The core design invariant: both dimensions share ONE physical footprint.
 * Types here describe that footprint abstractly, so a room's layout can be
 * authored once and rendered twice (Alpha / Beta) with different visuals.
 */

/** The two parallel dimensions the lab splits into. */
export enum DimensionId {
  /** The Overgrown Past — brutalist bunker reclaimed by nature. */
  Alpha = 'alpha',
  /** The Neon Future — sterile cyberpunk facility run by a hostile AI. */
  Beta = 'beta',
}

/** The three sequentially connected spaces of the facility. */
export enum RoomId {
  /** Small octagonal airlock. */
  SyncChamber = 'sync-chamber',
  /** Long rectangular testing corridor (Greenhouse / Server Grid). */
  Grid = 'grid',
  /** Cavernous dome with a central reactor pit. */
  ParadoxCore = 'paradox-core',
}

/** A position in the shared footprint (metres, right-handed, Y up). */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Coarse geometric archetype of a prop slot. Both dimensions render the SAME
 * archetype at the SAME spot (so the footprint stays mirrored) but with their
 * own materials — e.g. a `wall-panel` is a carved stone mural in Alpha and a
 * holographic screen in Beta.
 */
export type PropKind =
  | 'wall-panel' // flat surface on a wall: stone mural / holo screen
  | 'terminal' // angled interactive console: gears+dials / data terminal
  | 'floor-unit' // free-standing cabinet: soil bench / chemical analyzer
  | 'field' // a volume spanning the space: vine wall / laser grid
  | 'pit-core' // the reactor structure in the central pit
  | 'lever' // the manual escape lever
  | 'debris'; // generic rubble / docked drone / rusted machinery

/**
 * An abstract prop slot in the shared footprint. Each dimension supplies its
 * own visual for the same slot — e.g. a rusted iron wheel (Alpha) vs. an
 * obsidian glass panel (Beta) occupying the exact same coordinates.
 */
export interface PropSlot {
  id: string;
  kind: PropKind;
  position: Vec3;
  /** Optional yaw rotation in radians. */
  rotationY?: number;
  /** Whether the player can interact with the prop in this slot. */
  interactive: boolean;
  /** Human label + the puzzle it belongs to (for docs/debug/HUD). */
  label: string;
  /** Puzzle id this slot participates in, if any. See docs/DESIGN.md §Puzzles. */
  puzzle?: string;
}

/** Blueprint for a room: authored once, shared by both dimensions. */
export interface RoomBlueprint {
  id: RoomId;
  /** Interior footprint size in metres (x = width, y = height, z = depth). */
  size: Vec3;
  /** World-space centre of the room. */
  center: Vec3;
  props: PropSlot[];
}
