import type * as THREE from 'three';

/**
 * An interactive hotspot registered by a room dressing. The Interactor
 * raycasts against `object` (recursively), shows `label()` on hover, and
 * calls `onInteract()` on click. When `enabled()` returns false the label
 * still shows (with a lock hint) but clicks are ignored — locked things
 * should be discoverable, not invisible.
 */
export interface Interactable {
  object: THREE.Object3D;
  label: () => string;
  enabled?: () => boolean;
  onInteract: () => void;
}

/**
 * A fully-dressed room built by hand for one dimension (shell + props +
 * scenery), replacing the generic blockout. Built in room-local coordinates;
 * the Dimension base positions it at the room's blueprint centre.
 */
export interface RoomDetail {
  object: THREE.Object3D;
  /** Per-frame hook for this room's animated scenery. */
  update?: (delta: number, elapsed: number) => void;
  /** Interactive hotspots (puzzle props). */
  interactables?: Interactable[];
}
