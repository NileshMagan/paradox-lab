import { DimensionId } from '@/types';

/** Renderer / loop tuning. */
export const RENDER = {
  /** Cap devicePixelRatio to keep fill-rate sane on high-DPI displays. */
  maxPixelRatio: 2,
  fov: 70,
  near: 0.1,
  far: 500,
} as const;

/**
 * Per-dimension art direction, pulled straight from the design doc so the
 * palette lives in one place. Renderers read from here rather than hard-coding
 * colours, which keeps Alpha and Beta visually consistent as the scene grows.
 */
export const DIMENSION_THEME: Record<
  DimensionId,
  {
    label: string;
    /** Scene background / fog colour. */
    background: number;
    fogDensity: number;
    /** Key light colour + intensity. */
    keyLight: { color: number; intensity: number };
    /** Accent glow (bioluminescence for Alpha, holo/emergency for Beta). */
    accent: number;
  }
> = {
  [DimensionId.Alpha]: {
    label: 'The Overgrown Past',
    background: 0x0a0d08,
    fogDensity: 0.035,
    keyLight: { color: 0xffd27f, intensity: 1.4 }, // hazy golden sun shaft
    accent: 0xff3fb0, // toxic magenta bioluminescence
  },
  [DimensionId.Beta]: {
    label: 'The Neon Future',
    background: 0x02040a,
    fogDensity: 0.02,
    keyLight: { color: 0xf2f8ff, intensity: 2.2 }, // stark LED panels
    accent: 0x1fd1ff, // electric-blue holographics
  },
};
