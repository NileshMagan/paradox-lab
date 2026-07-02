import type * as THREE from 'three';

/**
 * A fully-dressed room built by hand for one dimension (shell + props +
 * scenery), replacing the generic blockout. Built in room-local coordinates;
 * the Dimension base positions it at the room's blueprint centre.
 */
export interface RoomDetail {
  object: THREE.Object3D;
  /** Per-frame hook for this room's animated scenery. */
  update?: (delta: number, elapsed: number) => void;
}
