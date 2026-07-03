import * as S from '@/scenery';
import type { RoomSpec } from '@/scenery/compose';

/**
 * "The Pharaoh's Antechamber" — an Egyptian tomb escape room composed
 * entirely from the library. Puzzle chain the handles support:
 *   hieroglyph panels (seeded code) → rotary rings alignment → sarcophagus
 *   lid opens → key relics → pressure plate + glyph pillar → exit.
 * Wire via `composeRoom(...).handles`: 'rings', 'pillar', 'sarcophagus',
 * 'plate', 'relics'.
 */

const W = 10;
const H = 4.2;
const D = 14;

export const egyptianTomb: RoomSpec = {
  name: 'The Pharaoh’s Antechamber',
  paletteName: 'sandstone',
  seed: 'tomb:v1',
  size: { w: W, h: H, d: D },
  shell: { floor: 0xa8895a, walls: 0xc2a068, ceiling: 0x8a6b3a },
  lighting: {
    ambient: { color: 0xffe2b0, intensity: 0.55 },
    points: [
      // Torch pools along both walls + a shaft of daylight at the entrance.
      { x: -W / 2 + 0.8, y: 2.6, z: -3.5, color: 0xffb063, intensity: 14 },
      { x: W / 2 - 0.8, y: 2.6, z: -3.5, color: 0xffb063, intensity: 14 },
      { x: -W / 2 + 0.8, y: 2.6, z: 3.5, color: 0xffb063, intensity: 14 },
      { x: W / 2 - 0.8, y: 2.6, z: 3.5, color: 0xffb063, intensity: 14 },
      { x: 0, y: 3.4, z: -5.2, color: 0xffe9c0, intensity: 20, distance: 16 },
    ],
  },
  pieces: [
    // ── The centrepiece: sarcophagus on a dais, guarded by sphinxes ────────
    { id: 'sarcophagus', at: [0, -3], clearRadius: 1.8, build: (rng, pal) => S.sarcophagus(rng, pal) },
    { at: [0, -3], clearRadius: 0, build: (_rng, pal) => S.platformDais(pal, { radius: 1.9, tiers: 2 }) },
    { at: [-2.2, -1.6], rotY: 0.5, build: (rng, pal) => S.sphinxStatue(rng, pal) },
    { at: [2.2, -1.6], rotY: -0.5, build: (rng, pal) => S.sphinxStatue(rng, pal) },
    // ── Puzzle stations ────────────────────────────────────────────────────
    { id: 'rings', at: [0, -D / 2 + 0.35], build: (rng, pal) => S.rotaryRings(rng, pal) },
    { id: 'pillar', at: [-3.4, -4.6], build: (rng, pal) => S.glyphPillar(rng, pal) },
    { id: 'plate', at: [0, 0.4], clearRadius: 1.3, build: (rng, pal) => S.pressurePlate(rng, pal) },
    { id: 'relics', at: [3.5, -4.6], build: (rng, pal) => S.keyRelics(rng, pal) },
    { id: 'chest', at: [3.6, -1.2], rotY: -0.9, build: (rng, pal) => S.lockedChest(rng, pal) },
    // ── Hieroglyph code panels (the seeded clue carriers) ──────────────────
    { at: [-W / 2 + 0.15, -2], rotY: Math.PI / 2, build: (rng, pal) => S.hieroglyphPanel(rng, pal) },
    { at: [W / 2 - 0.15, -2], rotY: -Math.PI / 2, build: (rng, pal) => S.hieroglyphPanel(rng, pal) },
    { at: [-2.6, -D / 2 + 0.15], build: (rng, pal) => S.muralPanel(rng, pal, { width: 1.6, height: 1.5 }) },
    { at: [2.6, -D / 2 + 0.15], build: (rng, pal) => S.scarabRelief(rng, pal) },
    // ── Monumental dressing ────────────────────────────────────────────────
    { at: [-3.2, 5.2], build: (rng, pal) => S.obelisk(rng, pal, { height: 2.4 }) },
    { at: [3.2, 5.2], build: (rng, pal) => S.obelisk(rng, pal, { height: 2.4 }) },
    { at: [-3.9, 1.8], rotY: 0.9, build: (rng, pal) => S.pharaohBust(rng, pal) },
    { at: [3.9, 1.8], rotY: -0.9, build: (rng, pal) => S.pharaohBust(rng, pal) },
    { at: [-3.6, -2.8], rotY: Math.PI / 2, build: (rng, pal) => S.canopicJars(rng, pal) },
    { at: [0, 3.2], build: (rng, pal) => S.stepAltar(rng, pal) },
    { at: [-1.6, 4.6], build: (_rng, pal) => S.ankhStand(pal) },
    { at: [2.8, 3.8], rotY: 0.4, build: (rng, pal) => S.robedStatue(rng, pal, { height: 2.1 }) },
    // ── Wall torches (sconces carry the flame look; lights above do the work)
    { at: [-W / 2 + 0.2, -3.5], rotY: Math.PI / 2, build: (rng, pal) => S.wallSconce(rng, pal) },
    { at: [W / 2 - 0.2, -3.5], rotY: -Math.PI / 2, build: (rng, pal) => S.wallSconce(rng, pal) },
    { at: [-W / 2 + 0.2, 3.5], rotY: Math.PI / 2, build: (rng, pal) => S.wallSconce(rng, pal) },
    { at: [W / 2 - 0.2, 3.5], rotY: -Math.PI / 2, build: (rng, pal) => S.wallSconce(rng, pal) },
    { at: [-2.5, 2.2], build: (rng, pal) => S.candleCluster(rng, pal) },
    // ── Decay: the desert is reclaiming the room ──────────────────────────
    { at: [-3.8, 5.8], build: (rng, pal) => S.sandDrift(rng, pal, { width: 2.2 }) },
    { at: [3.8, -5.8], build: (rng, pal) => S.sandDrift(rng, pal, { width: 2 }) },
    { at: [1.8, 1.4], build: (rng, pal) => S.boulderField(rng, pal, { radius: 0.7, count: 6 }) },
    { at: [-1.5, 5.6], rotY: 0.7, build: (_rng, pal) => S.pillar(pal, { height: H - 0.4, radius: 0.24 }) },
    // ── Atmosphere ────────────────────────────────────────────────────────
    { at: [0, 0], clearRadius: 0, build: (rng) => S.dustMotes(rng, { width: W - 1, height: H, depth: D - 1, count: 240 }) },
    { at: [0, 4.8], clearRadius: 0, build: (rng) => S.godRays(rng, { color: 0xffe2a8, height: H }) },
    { at: [1.2, -2.2], clearRadius: 0, build: (rng, pal) => S.ratScurrier(rng, pal, { radius: 1.4 }) },
    { at: [0, 5.9], clearRadius: 0, build: () => S.soundMarker('tomb:wind') },
    { at: [0, -3], y: 0, clearRadius: 0, build: () => S.soundMarker('tomb:heartbeat', { color: 0xff5a2b }) },
  ],
  scatter: [
    { count: 4, build: (rng, pal) => S.gravelPatch(rng, pal, { radius: 0.6 }) },
    { count: 3, minSpacing: 1.6, build: (rng, pal) => S.smallCrates(rng, pal, { count: 3 }) },
    { count: 3, build: (rng, pal) => S.bottleCluster(rng, pal, { count: 4 }) },
  ],
};
