import * as THREE from 'three';
import { concreteTexture, steelTexture } from '@/core/textures';

/**
 * Shared material kits, one per dimension look. Builders take their materials
 * from a kit instead of instantiating their own so a whole room's scenery
 * compiles to a handful of shader programs, and so GPU teardown has a single
 * owner: dispose the kit, not each prop.
 *
 * Builders that genuinely need a private material (per-instance emissive
 * animation, one-off canvas texture) flag it with
 * `mesh.userData.disposeMaterial = true`; `disposeSceneryObject` picks those
 * up alongside the geometry.
 */

/** Alpha — the Overgrown Past. Concrete, rust, damp organics. */
export interface AlphaKit {
  concrete: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  dirt: THREE.MeshStandardMaterial;
  rust: THREE.MeshStandardMaterial;
  rustDark: THREE.MeshStandardMaterial;
  bark: THREE.MeshStandardMaterial;
  ivy: THREE.MeshStandardMaterial;
  moss: THREE.MeshStandardMaterial;
  /** Double-sided — for leaf/frond quads seen from any angle. */
  leaf: THREE.MeshStandardMaterial;
  water: THREE.MeshStandardMaterial;
  /** Emissive pod/bloom material, cached per colour. */
  pod(color: number): THREE.MeshStandardMaterial;
  dispose(): void;
}

/** Beta — the Neon Future. Brushed steel, matte black, holo glow. */
export interface BetaKit {
  steel: THREE.MeshStandardMaterial;
  black: THREE.MeshStandardMaterial;
  shell: THREE.MeshStandardMaterial;
  cable: THREE.MeshStandardMaterial;
  led: THREE.MeshBasicMaterial;
  /** Dark-based emissive tech surface, cached per colour. */
  glow(color: number): THREE.MeshStandardMaterial;
  /** Unlit additive hologram material, cached per colour. */
  holo(color: number): THREE.MeshBasicMaterial;
  dispose(): void;
}

function disposeAll(materials: Iterable<THREE.Material>): void {
  for (const mat of materials) {
    if ('map' in mat) (mat as THREE.MeshStandardMaterial).map?.dispose();
    mat.dispose();
  }
}

export function createAlphaKit(): AlphaKit {
  const pods = new Map<number, THREE.MeshStandardMaterial>();
  const kit: AlphaKit = {
    concrete: new THREE.MeshStandardMaterial({ map: concreteTexture(), roughness: 0.96, metalness: 0.02 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x6b675e, roughness: 1 }),
    dirt: new THREE.MeshStandardMaterial({ color: 0x77755f, roughness: 1 }),
    rust: new THREE.MeshStandardMaterial({ color: 0x7a4a26, roughness: 0.85, metalness: 0.45 }),
    rustDark: new THREE.MeshStandardMaterial({ color: 0x53331c, roughness: 0.9, metalness: 0.4 }),
    bark: new THREE.MeshStandardMaterial({ color: 0x3a2d20, roughness: 0.95 }),
    ivy: new THREE.MeshStandardMaterial({ color: 0x2a4a26, roughness: 0.95 }),
    moss: new THREE.MeshStandardMaterial({ color: 0x3f5a2e, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x35502a, roughness: 0.9, side: THREE.DoubleSide }),
    water: new THREE.MeshStandardMaterial({ color: 0x2a3d38, roughness: 0.08, metalness: 0.25 }),
    pod(color: number): THREE.MeshStandardMaterial {
      let mat = pods.get(color);
      if (!mat) {
        mat = new THREE.MeshStandardMaterial({
          color: 0x0c1f16,
          roughness: 0.7,
          emissive: new THREE.Color(color),
          emissiveIntensity: 1.6,
        });
        pods.set(color, mat);
      }
      return mat;
    },
    dispose(): void {
      disposeAll([
        kit.concrete, kit.stone, kit.dirt, kit.rust, kit.rustDark,
        kit.bark, kit.ivy, kit.moss, kit.leaf, kit.water,
        ...pods.values(),
      ]);
      pods.clear();
    },
  };
  return kit;
}

export function createBetaKit(): BetaKit {
  const glows = new Map<number, THREE.MeshStandardMaterial>();
  const holos = new Map<number, THREE.MeshBasicMaterial>();
  const kit: BetaKit = {
    steel: new THREE.MeshStandardMaterial({ map: steelTexture(), roughness: 0.35, metalness: 0.85 }),
    black: new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.4, metalness: 0.7 }),
    shell: new THREE.MeshStandardMaterial({ color: 0xc7d0da, roughness: 0.5, metalness: 0.35 }),
    cable: new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.6, metalness: 0.2 }),
    led: new THREE.MeshBasicMaterial({ color: 0xf4f9ff }),
    glow(color: number): THREE.MeshStandardMaterial {
      let mat = glows.get(color);
      if (!mat) {
        mat = new THREE.MeshStandardMaterial({
          color: 0x061018,
          roughness: 0.4,
          emissive: new THREE.Color(color),
          emissiveIntensity: 1.4,
        });
        glows.set(color, mat);
      }
      return mat;
    },
    holo(color: number): THREE.MeshBasicMaterial {
      let mat = holos.get(color);
      if (!mat) {
        mat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        holos.set(color, mat);
      }
      return mat;
    },
    dispose(): void {
      disposeAll([
        kit.steel, kit.black, kit.shell, kit.cable, kit.led,
        ...glows.values(), ...holos.values(),
      ]);
      glows.clear();
      holos.clear();
    },
  };
  return kit;
}

/**
 * Free the GPU resources of a scenery subtree: every geometry, plus any
 * material a builder flagged as instance-owned. Kit materials are left alone —
 * they outlive individual props and are freed by `kit.dispose()`.
 */
export function disposeSceneryObject(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Line) {
      (obj.geometry as THREE.BufferGeometry).dispose();
      if (obj.userData.disposeMaterial === true) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        disposeAll(mats as THREE.Material[]);
      }
    }
  });
}
