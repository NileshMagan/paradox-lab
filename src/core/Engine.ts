import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { RENDER } from '@/config/constants';

/**
 * Thin wrapper around the Three.js renderer, camera, and animation loop.
 * Owns nothing game-specific — dimensions and systems register an `update`
 * callback and receive a per-frame delta.
 *
 * Renders through an EffectComposer so an OutlinePass can highlight whatever
 * the player is looking at (set via `setOutlined`); an OutputPass keeps the
 * scene's tone-mapping/colour identical to a direct render.
 */
export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;

  private readonly composer: EffectComposer;
  private readonly renderPass: RenderPass;
  private readonly outlinePass: OutlinePass;
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

    // Post-processing chain: render → outline → tone-map/colour output.
    const size = new THREE.Vector2(container.clientWidth, container.clientHeight);
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    this.outlinePass = new OutlinePass(size, this.scene, this.camera);
    this.outlinePass.edgeStrength = 3.5;
    this.outlinePass.edgeGlow = 0.4;
    this.outlinePass.edgeThickness = 1.2;
    this.outlinePass.pulsePeriod = 2.2;
    this.outlinePass.visibleEdgeColor.set('#bfe6ff');
    this.outlinePass.hiddenEdgeColor.set('#2a4a63');
    this.composer.addPass(this.outlinePass);
    this.composer.addPass(new OutputPass());

    window.addEventListener('resize', this.onResize);
  }

  /** Replace the active scene (e.g. when switching the rendered dimension). */
  setScene(scene: THREE.Scene): void {
    this.scene = scene;
    this.renderPass.scene = scene;
    this.outlinePass.renderScene = scene;
    this.outlinePass.selectedObjects = [];
  }

  /** Outline the object the player is looking at (empty array clears it). */
  setOutlined(objects: THREE.Object3D[]): void {
    this.outlinePass.selectedObjects = objects;
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
    this.composer.render(delta);
  };

  private onResize = (): void => {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  };
}
