import * as S from '@/scenery';
import type * as THREE from 'three';
import type { RoomSpec } from '@/scenery/compose';
import { approach, type GameCtx, type RoomGame } from '@/scenery/play';

/**
 * Stage 3 — "The Burial Vault". The pharaoh himself, and the way out.
 * Chain (7 beats): the ankh wakes the braziers → the lit wall names the
 * mirror bearings → aim both mirrors → the rune ring wakes → tap the runes
 * in the wall's order → the great sarcophagus opens → crown the guardian
 * statue with the death mask → escape. Carries in: ankh.
 */

const W = 11;
const H = 4.6;
const D = 12;
const MIRROR_TARGET = [2, 5]; // sixths of a turn for mirror A, mirror B
const RUNE_ORDER = [0, 3, 1, 4, 2];

export const tombVaultSpec: RoomSpec = {
  name: 'The Burial Vault',
  paletteName: 'sandstone',
  seed: 'tomb-vault:v1',
  size: { w: W, h: H, d: D },
  shell: { floor: 0x8a6f45, walls: 0xa8875a, ceiling: 0x63482a },
  lighting: {
    ambient: { color: 0xffd9a0, intensity: 0.38 },
    points: [
      { x: 0, y: 3.4, z: -3, color: 0xffb063, intensity: 15 },
      { x: -3.8, y: 2.2, z: 2.5, color: 0xff8a3a, intensity: 9 },
      { x: 3.8, y: 2.2, z: 2.5, color: 0xff8a3a, intensity: 9 },
      { x: 0, y: 1.4, z: 1.5, color: 0xff5a2b, intensity: 7, distance: 8 },
    ],
  },
  pieces: [
    // The pharaoh's great sarcophagus, raised at the far end.
    { id: 'sarcophagus', at: [0, -3.8], rotY: 0, clearRadius: 2, build: (rng, pal) => S.sarcophagus(rng, pal) },
    { at: [0, -3.8], clearRadius: 0, build: (_rng, pal) => S.platformDais(pal, { radius: 2.1, tiers: 3 }) },
    { id: 'guardian', at: [0, -D / 2 + 0.7], clearRadius: 1.2, build: (rng, pal) => S.robedStatue(rng, pal, { height: 2.5 }) },
    // The mirror rig and the rune ring.
    { id: 'mirrorA', at: [-3.4, 0.6], build: (rng, pal) => S.pivotMirror(rng, pal) },
    { id: 'mirrorB', at: [3.4, 0.6], build: (rng, pal) => S.pivotMirror(rng, pal) },
    { id: 'runes', at: [0, 0.4], clearRadius: 1.7, build: (rng, pal) => S.runeFloor(rng, pal) },
    { id: 'bearingPanel', at: [W / 2 - 0.15, -2], rotY: -Math.PI / 2, build: (rng, pal) => S.hieroglyphPanel(rng, pal) },
    // Braziers the ankh wakes.
    { id: 'brazierL', at: [-2.4, -4.8], build: (rng, pal) => S.campfire(rng, pal) },
    { id: 'brazierR', at: [2.4, -4.8], build: (rng, pal) => S.campfire(rng, pal) },
    // Grave goods and menace.
    { at: [-4.2, -2.6], rotY: 0.9, build: (rng, pal) => S.canopicJars(rng, pal) },
    { at: [4.2, -2.6], rotY: -0.9, build: (rng, pal) => S.pharaohBust(rng, pal) },
    { at: [-4.1, 3.6], build: (rng, pal) => S.crateStack(rng, pal, { tiers: 2 }) },
    { at: [4.1, 3.9], build: (rng, pal) => S.skeletonRemains(rng, pal) },
    { at: [-1.9, 4.6], build: (_rng, pal) => S.ankhStand(pal) },
    { at: [1.9, 4.6], build: (rng, pal) => S.sphinxStatue(rng, pal) },
    { at: [0, 3.2], build: (rng, pal) => S.fissureGlow(rng, pal, { length: 2.6, color: 0xff7733 }) },
    { at: [-3.9, -4.9], build: (rng, pal) => S.sandDrift(rng, pal, { width: 1.8 }) },
    // Atmosphere: heavier, closer to the dead.
    { at: [0, 0], clearRadius: 0, build: (rng) => S.groundMist(rng, { width: W - 1.5, depth: D - 1.5, color: 0xd9c9a0 }) },
    { at: [0, 0], clearRadius: 0, build: (rng) => S.dustMotes(rng, { width: W - 1, height: H, depth: D - 1, count: 200 }) },
    { at: [1.5, 2.2], clearRadius: 0, build: (rng, pal) => S.ghostWisp(rng, pal, { height: 1.3 }) },
    { at: [0, -3.8], clearRadius: 0, build: () => S.soundMarker('tomb:heartbeat', { color: 0xff5a2b }) },
  ],
  scatter: [
    { count: 3, build: (rng, pal) => S.boulderField(rng, pal, { radius: 0.6, count: 4 }) },
    { count: 2, build: (rng, pal) => S.gravelPatch(rng, pal, { radius: 0.5 }) },
  ],
};

export function tombVaultGame(
  handles: Record<string, unknown>,
  ctx: GameCtx,
  carry: Record<string, unknown>,
): RoomGame {
  const sarcophagus = handles.sarcophagus as ReturnType<typeof S.sarcophagus>;
  const mirrorA = handles.mirrorA as ReturnType<typeof S.pivotMirror>;
  const mirrorB = handles.mirrorB as ReturnType<typeof S.pivotMirror>;
  const runes = handles.runes as ReturnType<typeof S.runeFloor>;
  const panel = handles.bearingPanel as THREE.Group;
  const guardian = handles.guardian as THREE.Group;
  const braziers = [handles.brazierL, handles.brazierR] as Array<ReturnType<typeof S.campfire>>;

  let lit = false;
  let readBearings = false;
  const mirrorClicks = [0, 0];
  const mirrorRest = [mirrorA.yoke.rotation.y, mirrorB.yoke.rotation.y];
  let aligned = false;
  let runeProgress = 0;
  let runesDone = false;
  let hasMask = false;
  let crowned = false;
  let lidOpen = 0;

  ctx.setObjective(
    carry.ankh ? 'The vault is pitch dark. The ankh wants fire.' : 'The vault is pitch dark.',
  );
  ctx.setHint(
    'Nothing works in the dark — light the braziers with the ankh first. The east wall then gives the mirror turns (west ×2, east ×5) and the rune order to tap: 1-4-2-5-3.',
  );

  braziers.forEach((brazier, i) => {
    brazier.flameMaterials.forEach((m) => (m.emissiveIntensity = 0.1)); // cold until the ankh
    ctx.register(`brazier:${i}`, brazier.group, () => {
      if (!carry.ankh) {
        ctx.toast('Cold coals. Nothing to light them with.');
        return;
      }
      if (lit) return;
      lit = true;
      ctx.toast('The ankh kisses the coals and BOTH braziers roar alight.');
      ctx.setObjective('Firelight crawls up the east wall — read what it shows.');
    });
  });

  ctx.register('bearingPanel', panel, () => {
    if (!lit) {
      ctx.toast('A carved wall, unreadable in the dark.');
      return;
    }
    readBearings = true;
    ctx.toast('"Turn the WEST eye twice; the EAST eye five times; the floor will remember 1-4-2-5-3."');
    ctx.setObjective('Aim the two mirrors: west ×2, east ×5.');
  });

  const mirrors = [mirrorA, mirrorB];
  mirrors.forEach((mirror, i) => {
    ctx.register(`mirror:${i}`, mirror.group, () => {
      if (aligned) return;
      if (!readBearings) {
        ctx.toast('The mirror turns freely — but toward what?');
        return;
      }
      mirrorClicks[i] = (mirrorClicks[i] + 1) % 6;
      mirror.yoke.rotation.y = mirrorRest[i] + (mirrorClicks[i] * Math.PI) / 3;
      ctx.toast(`${i === 0 ? 'West' : 'East'} mirror: ${mirrorClicks[i]} turn${mirrorClicks[i] === 1 ? '' : 's'}.`);
      if (mirrorClicks[0] === MIRROR_TARGET[0] && mirrorClicks[1] === MIRROR_TARGET[1]) {
        aligned = true;
        ctx.toast('Firelight lances across the floor — the rune ring glows faint.');
        ctx.setObjective('Tap the runes in the wall’s order: 1-4-2-5-3.');
      }
    });
  });

  // One click target for the whole ring: each tap flares the next rune in
  // the wall's order — the deduction lives in the panel + mirror gating.
  ctx.register('runes', runes.group, () => {
    if (!aligned || runesDone) {
      if (!aligned) ctx.toast('Dead stone circles. No light reaches them.');
      return;
    }
    runeProgress++;
    ctx.toast(`Rune ${RUNE_ORDER[runeProgress - 1] + 1} flares (${runeProgress}/5).`);
    if (runeProgress >= 5) {
      runesDone = true;
      ctx.toast('All five runes burn. The great lid shudders…');
      ctx.setObjective('The sarcophagus is open. Face what wears the mask.');
    }
  });

  ctx.register('sarcophagus', sarcophagus.group, () => {
    if (!runesDone) {
      ctx.toast('The lid weighs more than your whole team.');
      return;
    }
    if (hasMask) return;
    hasMask = true;
    ctx.toast('Inside: no king. Only the golden DEATH MASK, waiting.');
    ctx.setObjective('The hooded guardian by the door has no face. Give it one.');
  });

  ctx.register('guardian', guardian, () => {
    if (!hasMask) {
      ctx.toast('The hooded statue waits, faceless.');
      return;
    }
    if (crowned) return;
    crowned = true;
    ctx.win('The mask settles onto the void. The guardian bows — and the wall behind it opens to daylight.');
  });

  return {
    update: (delta, elapsed) => {
      const flame = lit ? 1 : 0.05;
      braziers.forEach((brazier) => {
        brazier.flameMaterials.forEach((m, i) => {
          m.emissiveIntensity = (2 - i * 0.4 + Math.sin(elapsed * 9 + i * 2.3) * 0.5) * flame;
        });
      });
      runes.runeMaterials.forEach((m, i) => {
        m.emissiveIntensity = i < runeProgress ? 2.2 : aligned ? 0.5 : 0.15;
      });
      if (runesDone && lidOpen < 1) {
        lidOpen = approach(lidOpen, 1, delta, 1);
        sarcophagus.lid.position.x = 0.12 + lidOpen * 0.6;
        sarcophagus.lid.rotation.y = lidOpen * 0.22;
      }
    },
  };
}
