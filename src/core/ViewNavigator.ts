import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FACILITY } from '@/config/facility';

const ADMIN_LIGHT = 'admin-inspection-light';

/**
 * Dev/admin camera navigation. Two modes:
 *
 * - **Room focus** — orbit inside one room; [Q]/[E] step through the facility
 *   in blueprint order. The orbit camera has no collision (it's a dev tool,
 *   not the gameplay camera), so you *can* pull through a wall — the real
 *   first-person controller with collision comes with the interaction system.
 * - **Overview (admin)** — bird's-eye dollhouse of the whole facility with all
 *   ceilings hidden, so every room's interior is visible at once.
 */
export class ViewNavigator {
  private roomIndex = 0;
  private overview = false;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly controls: OrbitControls,
    private readonly activeScene: () => THREE.Scene,
  ) {}

  get label(): string {
    if (this.overview) return 'ADMIN OVERVIEW — whole facility';
    const room = FACILITY[this.roomIndex];
    return `Room ${this.roomIndex + 1}/${FACILITY.length}: ${room.id}`;
  }

  focusRoom(index: number): void {
    this.overview = false;
    this.roomIndex = ((index % FACILITY.length) + FACILITY.length) % FACILITY.length;
    const { center, size } = FACILITY[this.roomIndex];
    this.controls.target.set(center.x, center.y + Math.min(1.4, size.y * 0.35), center.z);
    // Mostly on-axis: a big lateral offset in narrow rooms (the corridor)
    // shoves the camera into wall-mounted scenery.
    this.camera.position.set(
      center.x + size.x * 0.15,
      center.y + size.y * 0.48,
      center.z + size.z * 0.26 + 1.4,
    );
    // Let the camera roam a bit past the walls, but keep orbit centred here.
    this.controls.maxDistance = Math.max(size.x, size.z) * 0.95;
    this.controls.maxPolarAngle = Math.PI * 0.55; // don't dive under the floor
    this.applyMode();
  }

  stepRoom(step: 1 | -1): void {
    this.focusRoom(this.roomIndex + step);
  }

  toggleOverview(): void {
    if (this.overview) {
      this.focusRoom(this.roomIndex);
      return;
    }
    this.overview = true;
    // Frame the whole facility (it runs from z≈+4 down to z≈-42).
    this.controls.target.set(0, 0, -19);
    this.camera.position.set(20, 30, 8);
    this.controls.maxDistance = 90;
    this.controls.maxPolarAngle = Math.PI * 0.49; // stay above the ground plane
    this.applyMode();
  }

  /** Re-apply mode side effects — call after the rendered scene is swapped. */
  refresh(): void {
    this.applyMode();
  }

  /**
   * Overview side effects: hide ceilings (dollhouse), kill fog (it swallows
   * the facility at bird's-eye distance) and add a flat inspection light so
   * even Alpha's dead-power rooms are legible. All reversed in room mode.
   */
  private applyMode(): void {
    const scene = this.activeScene();
    scene.traverse((obj) => {
      if (obj.name === 'ceiling') obj.visible = !this.overview;
    });
    if (this.overview) {
      // Stash the scene's own fog once, then run fogless while inspecting.
      if (scene.fog) scene.userData.gameFog = scene.fog;
      scene.fog = null;
      let light = scene.getObjectByName(ADMIN_LIGHT);
      if (!light) {
        light = new THREE.HemisphereLight(0xcfd8e6, 0x40382e, 2.2);
        light.name = ADMIN_LIGHT;
        scene.add(light);
      }
      light.visible = true;
    } else {
      if (scene.userData.gameFog) scene.fog = scene.userData.gameFog as THREE.FogExp2;
      const light = scene.getObjectByName(ADMIN_LIGHT);
      if (light) light.visible = false;
    }
    this.controls.update();
    window.dispatchEvent(new CustomEvent('view:change', { detail: this.label }));
  }
}
