import * as THREE from 'three';
import type { SharedMats } from '@/scenery/assets/shared';

/**
 * Role-based material palettes — the scaling axis of the library.
 *
 * A builder written against `Palette` roles (body/trim/metal/soft/glass/glow)
 * works in EVERY theme: N builders × M palettes × unlimited seeds is the
 * multiplier that makes "many themed rooms" cheap. A new room theme is a new
 * palette spec (a dozen colours), not a new asset set.
 *
 * `Palette` extends `SharedMats`, so every palette also drives the
 * shared-silhouette builders directly.
 */
export interface Palette extends SharedMats {
  name: string;
  body: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  /** Bare metal — pipes, brackets, mechanisms. */
  metal: THREE.MeshStandardMaterial;
  /** Worn/soft surfaces — fabric, paper, mattresses, tarps. */
  soft: THREE.MeshStandardMaterial;
  /** Transparent panes. */
  glass: THREE.MeshStandardMaterial;
  /** The theme's signature accent colour (drive glows/indicators with it). */
  accent: number;
  /** Emissive accent material, cached per colour. */
  glow(color?: number): THREE.MeshStandardMaterial;
  dispose(): void;
}

export interface PaletteSpec {
  name: string;
  body: number;
  trim: number;
  metal: number;
  soft: number;
  glass: number;
  glassOpacity?: number;
  accent: number;
  /** 0 = mirror-clean, 1 = completely matte. Default 0.8 (worn). */
  roughness?: number;
  /** How metallic body/trim read. Default 0.15. */
  metalness?: number;
}

export function createPalette(spec: PaletteSpec): Palette {
  const roughness = spec.roughness ?? 0.8;
  const metalness = spec.metalness ?? 0.15;
  const glows = new Map<number, THREE.MeshStandardMaterial>();
  const palette: Palette = {
    name: spec.name,
    body: new THREE.MeshStandardMaterial({ color: spec.body, roughness, metalness }),
    trim: new THREE.MeshStandardMaterial({
      color: spec.trim,
      roughness: Math.min(1, roughness + 0.1),
      metalness,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: spec.metal,
      roughness: Math.max(0.2, roughness - 0.3),
      metalness: 0.75,
    }),
    soft: new THREE.MeshStandardMaterial({ color: spec.soft, roughness: 1, metalness: 0 }),
    glass: new THREE.MeshStandardMaterial({
      color: spec.glass,
      transparent: true,
      opacity: spec.glassOpacity ?? 0.28,
      roughness: 0.15,
      metalness: 0.1,
      side: THREE.DoubleSide,
    }),
    accent: spec.accent,
    glow(color?: number): THREE.MeshStandardMaterial {
      const key = color ?? spec.accent;
      let mat = glows.get(key);
      if (!mat) {
        mat = new THREE.MeshStandardMaterial({
          color: 0x0a0f12,
          roughness: 0.4,
          emissive: new THREE.Color(key),
          emissiveIntensity: 1.5,
        });
        glows.set(key, mat);
      }
      return mat;
    },
    dispose(): void {
      for (const mat of [palette.body, palette.trim, palette.metal, palette.soft, palette.glass]) {
        mat.dispose();
      }
      for (const mat of glows.values()) mat.dispose();
      glows.clear();
    },
  };
  return palette;
}

/**
 * The stock themes. Specs are cheap data — add a room theme here and every
 * builder in the library immediately renders in it.
 */
export const PALETTE_SPECS: readonly PaletteSpec[] = [
  {
    name: 'overgrown',
    body: 0x4a5240,
    trim: 0x53331c,
    metal: 0x7a4a26,
    soft: 0x6b6350,
    glass: 0xcfd8b8,
    accent: 0x2ee6d6,
    roughness: 0.95,
  },
  {
    name: 'neon',
    body: 0x11151c,
    trim: 0x2a3340,
    metal: 0x8a94a2,
    soft: 0x232a33,
    glass: 0x9fd8ff,
    glassOpacity: 0.22,
    accent: 0x1fd1ff,
    roughness: 0.45,
    metalness: 0.4,
  },
  {
    name: 'rustbelt',
    body: 0x5e4a35,
    trim: 0x2f2a24,
    metal: 0x6e6a63,
    soft: 0x54432e,
    glass: 0xb8b09a,
    accent: 0xffb347,
    roughness: 0.85,
  },
  {
    name: 'sterile',
    body: 0xd8dde2,
    trim: 0x9aa4ad,
    metal: 0xb8c0c8,
    soft: 0xc2cbd2,
    glass: 0xe8f4ff,
    glassOpacity: 0.18,
    accent: 0x2bff88,
    roughness: 0.35,
    metalness: 0.25,
  },
  {
    name: 'scorched',
    body: 0x241d18,
    trim: 0x171310,
    metal: 0x3a332c,
    soft: 0x2e2620,
    glass: 0x4a423a,
    glassOpacity: 0.4,
    accent: 0xff5a2b,
    roughness: 0.98,
  },
  {
    name: 'abyssal',
    body: 0x16303a,
    trim: 0x0d1f28,
    metal: 0x2e5561,
    soft: 0x1d3a42,
    glass: 0x6fd8d0,
    accent: 0x39f0a0,
    roughness: 0.6,
    metalness: 0.3,
  },
  // ── Theme-room palettes ────────────────────────────────────────────────────
  {
    name: 'sandstone', // Egyptian tomb: sun-baked stone + gold
    body: 0xc9a86a,
    trim: 0x8a6b3a,
    metal: 0xd4af37,
    soft: 0xb59a72,
    glass: 0xe8d9b0,
    accent: 0xffc84a,
    roughness: 0.92,
  },
  {
    name: 'temple', // South-Asian temple: terracotta, gold leaf, silk
    body: 0x9a4a2e,
    trim: 0xd4af37,
    metal: 0xb87333,
    soft: 0xc94f7c,
    glass: 0xffd9a0,
    accent: 0xff9633,
    roughness: 0.8,
  },
  {
    name: 'speakeasy', // bar: walnut, brass, burgundy leather
    body: 0x3a2a1e,
    trim: 0x8a5a2b,
    metal: 0xc9992e,
    soft: 0x5e1f24,
    glass: 0xd9c9a0,
    accent: 0xffb347,
    roughness: 0.55,
    metalness: 0.25,
  },
  {
    name: 'noir', // dark detective: near-black greys, one pale accent
    body: 0x1a1c20,
    trim: 0x0e0f12,
    metal: 0x5a5f66,
    soft: 0x2e3138,
    glass: 0x8a94a2,
    glassOpacity: 0.2,
    accent: 0xdfe9ff,
    roughness: 0.5,
    metalness: 0.3,
  },
  {
    name: 'arctic', // snow: ice whites, glacial blues
    body: 0xdce8f0,
    trim: 0x9fc4d8,
    metal: 0x7a95a5,
    soft: 0xeef4f8,
    glass: 0xbfe4f5,
    accent: 0x66d9ff,
    roughness: 0.35,
  },
  {
    name: 'streets', // city block: concrete, asphalt, taxi yellow
    body: 0x6a6d72,
    trim: 0x3a3d42,
    metal: 0x8a8d92,
    soft: 0x54575c,
    glass: 0x9fc4e0,
    accent: 0xffd23f,
    roughness: 0.85,
  },
  {
    name: 'agency', // spy thriller: slate, gunmetal, laser red
    body: 0x24303a,
    trim: 0x11181f,
    metal: 0x8a94a2,
    soft: 0x37444f,
    glass: 0x9fd8ff,
    glassOpacity: 0.2,
    accent: 0xff2b3a,
    roughness: 0.45,
    metalness: 0.35,
  },
  {
    name: 'gothic', // crypt: violet-dark stone, cold purple glow
    body: 0x2a2430,
    trim: 0x171219,
    metal: 0x4a4152,
    soft: 0x3a2333,
    glass: 0x6a5a7a,
    accent: 0x8a4aff,
    roughness: 0.9,
  },
  {
    name: 'saloon', // wild west: raw timber, dust, iron
    body: 0x8a5a33,
    trim: 0x5a3a20,
    metal: 0x6e6a63,
    soft: 0xa87b4a,
    glass: 0xd9c9a0,
    accent: 0xff7733,
    roughness: 0.9,
  },
  {
    name: 'brass', // steampunk: oiled wood, brass, verdigris accent
    body: 0x6a4a2e,
    trim: 0x3a2d20,
    metal: 0xc9992e,
    soft: 0x5e4a35,
    glass: 0xd9e2c9,
    accent: 0x66ffd9,
    roughness: 0.5,
    metalness: 0.45,
  },
];

/** Instantiate every stock palette (caller owns disposal). */
export function createStandardPalettes(): Palette[] {
  return PALETTE_SPECS.map(createPalette);
}
