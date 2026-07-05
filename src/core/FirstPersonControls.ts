import * as THREE from 'three';

/**
 * First-person controls: the camera IS the player's head. Drag (mouse or finger)
 * looks around; arrow keys / WASD — or an external "forward" flag for touch —
 * walk on the floor plane. Movement is clamped to an axis-aligned box so you can
 * never leave the room (which is also why the exterior is no longer visible).
 * There is no orbit and no zoom.
 *
 * A tap (pointer down+up with negligible movement) is reported via `onTap` as
 * normalized device coords, so the host can raycast it for prop interaction —
 * drags are looks, taps are clicks.
 */

export interface FPBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  eyeY: number;
}

export class FirstPersonControls {
  /** When false, ignores all input (used while paused / between stages). */
  enabled = true;
  /** Fired on a tap with the tap's NDC — host raycasts for interaction. */
  onTap: (ndc: THREE.Vector2) => void = () => {};
  /** Set by an on-screen button for touch devices. */
  moveForward = false;

  private yaw = 0;
  private pitch = 0;
  private bounds: FPBounds = { minX: -4, maxX: 4, minZ: -4, maxZ: 4, eyeY: 1.6 };
  private readonly keys = new Set<string>();
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private moved = 0;
  private readonly speed = 2.7;
  private readonly look = 0.0032;
  private readonly euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly ndc = new THREE.Vector2();

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly dom: HTMLElement,
  ) {
    dom.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
  }

  /** Set the walkable box + eye height; re-clamps the camera into it. */
  setBounds(bounds: FPBounds): void {
    this.bounds = bounds;
    this.camera.position.y = bounds.eyeY;
    this.clamp();
  }

  /** Drop the player at a spot facing `yaw` (radians; 0 looks toward −Z). */
  place(x: number, z: number, yaw: number): void {
    this.camera.position.set(x, this.bounds.eyeY, z);
    this.yaw = yaw;
    this.pitch = 0;
    this.apply();
  }

  private readonly onDown = (e: PointerEvent): void => {
    if (!this.enabled) return;
    this.dragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.moved = 0;
  };

  private readonly onMove = (e: PointerEvent): void => {
    if (!this.dragging || !this.enabled) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.moved += Math.abs(dx) + Math.abs(dy);
    this.yaw -= dx * this.look;
    this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch - dy * this.look));
    this.apply();
  };

  private readonly onUp = (e: PointerEvent): void => {
    const wasTap = this.dragging && this.enabled && this.moved < 6;
    this.dragging = false;
    if (!wasTap) return;
    this.ndc.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1,
    );
    this.onTap(this.ndc);
  };

  private readonly onKey = (e: KeyboardEvent): void => {
    const k = e.key.toLowerCase();
    if (k.startsWith('arrow')) e.preventDefault(); // don't scroll the page
    this.keys.add(k);
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key.toLowerCase());
  };

  private apply(): void {
    this.euler.set(this.pitch, this.yaw, 0);
    this.camera.quaternion.setFromEuler(this.euler);
  }

  private clamp(): void {
    const b = this.bounds;
    const p = this.camera.position;
    p.x = Math.max(b.minX, Math.min(b.maxX, p.x));
    p.z = Math.max(b.minZ, Math.min(b.maxZ, p.z));
    p.y = b.eyeY;
  }

  update(delta: number): void {
    if (!this.enabled) return; // frozen (paused / overview) — leave the camera be
    const k = this.keys;
    let f = 0;
    let s = 0;
    if (k.has('arrowup') || k.has('w')) f += 1;
    if (k.has('arrowdown') || k.has('s')) f -= 1;
    if (k.has('arrowleft') || k.has('a')) s -= 1;
    if (k.has('arrowright') || k.has('d')) s += 1;
    if (this.moveForward) f += 1;
    if (f !== 0 || s !== 0) {
      const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      const move = new THREE.Vector3().addScaledVector(fwd, f).addScaledVector(right, s);
      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(this.speed * delta);
        this.camera.position.add(move);
        this.clamp();
      }
    }
    this.apply();
  }

  dispose(): void {
    this.dom.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
