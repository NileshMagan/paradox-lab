import * as THREE from 'three';
import type { Interactable } from '@/rooms/types';

/**
 * Mouse-pointer raycast interaction. Hover highlights an Interactable (cursor
 * + HUD label via `onHoverChange`); a click — pointer down/up without a drag,
 * so OrbitControls still owns camera drags — fires `onInteract()`.
 */
export class Interactor {
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private hasPointer = false;
  private targets: Interactable[] = [];
  private down: { x: number; y: number; time: number } | null = null;

  hovered: Interactable | null = null;
  onHoverChange: (hovered: Interactable | null) => void = () => {};

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly dom: HTMLElement,
  ) {
    dom.addEventListener('pointermove', (e) => {
      const rect = dom.getBoundingClientRect();
      this.pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      this.hasPointer = true;
    });
    dom.addEventListener('pointerdown', (e) => {
      this.down = { x: e.clientX, y: e.clientY, time: performance.now() };
    });
    dom.addEventListener('pointerup', (e) => {
      if (!this.down) return;
      const moved = Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y);
      const held = performance.now() - this.down.time;
      this.down = null;
      if (moved > 6 || held > 500) return; // that was a camera drag
      if (this.hovered && (this.hovered.enabled?.() ?? true)) this.hovered.onInteract();
    });
  }

  /** Swap the active hotspot set (e.g. on dimension change). */
  setTargets(targets: Interactable[]): void {
    this.targets = targets;
    this.setHovered(null);
  }

  /** Per-frame: raycast the pointer against all targets, keep the nearest. */
  update(): void {
    if (!this.hasPointer || this.targets.length === 0) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    let best: Interactable | null = null;
    let bestDist = Infinity;
    for (const target of this.targets) {
      const hit = this.raycaster.intersectObject(target.object, true)[0];
      if (hit && hit.distance < bestDist) {
        bestDist = hit.distance;
        best = target;
      }
    }
    if (best !== this.hovered) this.setHovered(best);
  }

  private setHovered(target: Interactable | null): void {
    this.hovered = target;
    this.dom.style.cursor = target ? 'pointer' : 'default';
    this.onHoverChange(target);
  }
}
