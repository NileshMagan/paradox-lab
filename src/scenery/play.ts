import * as THREE from 'three';

/**
 * Play layer for composed rooms — a self-contained interaction runtime so a
 * RoomSpec can be a functional escape room in the /rooms.html viewer.
 * Game logic registers clickable objects (usually straight from
 * `composeRoom().handles`); the viewer routes pointer clicks here.
 *
 * This intentionally does NOT touch the main game's Interactor/puzzleState:
 * those stay server-authoritative per docs/ARCHITECTURE.md. When a composed
 * room graduates into the game, its GameFactory logic ports into that system.
 */

export interface GameCtx {
  /** Make an object clickable. Clicks on any descendant route to onClick. */
  register(id: string, object: THREE.Object3D, onClick: () => void): void;
  /** Transient message (a few seconds). */
  toast(text: string): void;
  /** The persistent current-goal line in the HUD. */
  setObjective(text: string): void;
  /** End the room in victory. */
  win(text: string): void;
}

export interface RoomGame {
  /** Per-frame hook for puzzle-driven animation (lids, doors, beams). */
  update?(delta: number, elapsed: number): void;
}

export type GameFactory = (handles: Record<string, unknown>, ctx: GameCtx) => RoomGame;

/** Pointer → registered-object dispatcher (plus an id-keyed debug path). */
export class ClickRouter {
  private readonly targets = new Map<THREE.Object3D, { id: string; onClick: () => void }>();
  private readonly raycaster = new THREE.Raycaster();

  register(id: string, object: THREE.Object3D, onClick: () => void): void {
    this.targets.set(object, { id, onClick });
  }

  clear(): void {
    this.targets.clear();
  }

  /** Fire a target by id — the E2E/dev bridge (no camera needed). */
  click(id: string): boolean {
    for (const entry of this.targets.values()) {
      if (entry.id === id) {
        entry.onClick();
        return true;
      }
    }
    return false;
  }

  /** Raycast a pointer click into the room; returns the hit id, if any. */
  route(ndc: THREE.Vector2, camera: THREE.Camera, root: THREE.Object3D): string | null {
    this.raycaster.setFromCamera(ndc, camera);
    for (const hit of this.raycaster.intersectObject(root, true)) {
      let node: THREE.Object3D | null = hit.object;
      while (node) {
        const entry = this.targets.get(node);
        if (entry) {
          entry.onClick();
          return entry.id;
        }
        node = node.parent;
      }
    }
    return null;
  }
}

/** Ease `current` toward `target`; returns the new value (frame-rate safe). */
export function approach(current: number, target: number, delta: number, speed = 3): number {
  return current + (target - current) * Math.min(1, delta * speed);
}
