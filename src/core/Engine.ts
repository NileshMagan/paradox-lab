import * as THREE from 'three';
import { RENDER } from '@/config/constants';

/**
 * Thin wrapper around the Three.js renderer, camera, and animation loop.
 * Owns nothing game-specific — dimensions and systems register an `update`
 * callback and receive a per-frame delta.
 */
export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;

  private readonly clock = new THREE.Clock();
  private readonly updateCallbacks = new Set<(delta: number, elapsed: number) => void>();
  private running = false;

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDER.maxPixelRatio));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      RENDER.fov,
      container.clientWidth / container.clientHeight,
      RENDER.near,
      RENDER.far,
    );

    this.scene = new THREE.Scene();

    window.addEventListener('resize', this.onResize);
  }

  /** Replace the active scene (e.g. when switching the rendered dimension). */
  setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  /** Register a per-frame callback. Returns an unsubscribe function. */
  onUpdate(cb: (delta: number, elapsed: number) => void): () => void {
    this.updateCallbacks.add(cb);
    return () => this.updateCallbacks.delete(cb);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    this.renderer.setAnimationLoop(this.tick);
  }

  stop(): void {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private tick = (): void => {
    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();
    for (const cb of this.updateCallbacks) cb(delta, elapsed);
    this.renderer.render(this.scene, this.camera);
  };

  private onResize = (): void => {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };
}
