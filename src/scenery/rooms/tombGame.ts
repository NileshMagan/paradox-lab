import type * as THREE from 'three';
import type * as S from '@/scenery';
import { approach, type GameCtx, type RoomGame } from '@/scenery/play';

/**
 * "The Pharaoh's Antechamber" — playable chain (8 beats):
 *  1. Read BOTH hieroglyph panels → each gives half the ring alignment.
 *  2. Set the three rotary rings (3/5/2 turns) → the sarcophagus lid grinds open.
 *  3. Take the bronze gear from the relic tray revealed inside.
 *  4. The gear unlocks the banded chest → a scarab seal.
 *  5. Read the altar → the pillar litany (band order 2/4/1).
 *  6. Set the glyph pillar's three bands.
 *  7. Place the scarab on the pressure plate → the plate sinks.
 *  8. The exit rings blaze — escaped.
 */

const RING_TARGET = [3, 5, 2]; // clicks per ring (outer, middle, inner)
const BAND_TARGET = [2, 4, 1]; // clicks per pillar band (bottom, middle, top)

export function tombGame(handles: Record<string, unknown>, ctx: GameCtx): RoomGame {
  const rings = handles.rings as ReturnType<typeof S.rotaryRings>;
  const pillar = handles.pillar as ReturnType<typeof S.glyphPillar>;
  const plate = handles.plate as ReturnType<typeof S.pressurePlate>;
  const relics = handles.relics as ReturnType<typeof S.keyRelics>;
  const chest = handles.chest as ReturnType<typeof S.lockedChest>;
  const sarcophagus = handles.sarcophagus as ReturnType<typeof S.sarcophagus>;
  const panelL = handles.panelL as THREE.Group;
  const panelR = handles.panelR as THREE.Group;
  const altar = handles.altar as THREE.Group;

  let readL = false;
  let readR = false;
  let ringsSolved = false;
  let hasGear = false;
  let chestOpen = false;
  let hasScarab = false;
  let pillarSolved = false;
  let placed = false;
  const ringClicks = [0, 0, 0];
  const bandClicks = [0, 0, 0];
  // Ring/band rest rotations so click counts map to absolute targets.
  const ringRest = rings.rings.map((r) => r.rotation.z);
  const bandRest = pillar.bands.map((b) => b.rotation.y);
  let lidOpen = 0;
  let chestLid = 0;
  let plateSink = 0;

  ctx.setObjective('The seal is shut. The walls remember the way — read them.');

  ctx.register('panelL', panelL, () => {
    readL = true;
    ctx.toast('West wall: "The SUN turns THRICE, the EYE five times…"');
    if (readR) ctx.setObjective('Both halves known: 3 · 5 · 2. Turn the rings by the seal door.');
  });
  ctx.register('panelR', panelR, () => {
    readR = true;
    ctx.toast('East wall: "…and the PYRAMID twice, and the dead will stir."');
    if (readL) ctx.setObjective('Both halves known: 3 · 5 · 2. Turn the rings by the seal door.');
  });

  rings.rings.forEach((ring, i) => {
    ctx.register(`ring:${i}`, ring, () => {
      if (ringsSolved) return;
      ringClicks[i] = (ringClicks[i] + 1) % 8;
      ring.rotation.z = ringRest[i] + (ringClicks[i] * Math.PI) / 4;
      ctx.toast(`${['Outer', 'Middle', 'Inner'][i]} ring: ${ringClicks[i]} turn${ringClicks[i] === 1 ? '' : 's'}.`);
      if (ringClicks.every((c, k) => c === RING_TARGET[k])) {
        ringsSolved = true;
        ctx.toast('Stone grinds against stone — the sarcophagus lid slides…');
        ctx.setObjective('The sarcophagus is open. Take what the pharaoh guarded.');
      }
    });
  });

  ctx.register('relics', relics.group, () => {
    if (!ringsSolved) {
      ctx.toast('The relic tray is fused shut while the seal holds.');
      return;
    }
    if (hasGear) return;
    hasGear = true;
    ctx.toast('You take the bronze gear. Its teeth match the chest’s hasp.');
    ctx.setObjective('Open the banded chest by the east sphinx.');
  });

  ctx.register('chest', chest.group, () => {
    if (!hasGear) {
      ctx.toast('The hasp needs a toothed key — a gear, by the shape of it.');
      return;
    }
    if (chestOpen) return;
    chestOpen = true;
    hasScarab = true;
    ctx.toast('The gear turns the hasp. Inside: a golden SCARAB seal.');
    ctx.setObjective('The altar carvings mention a litany. Read the altar.');
  });

  ctx.register('altar', altar, () => {
    ctx.toast('Altar: "TWO for the earth, FOUR for the sky, ONE for the king."');
    if (hasScarab && !pillarSolved) ctx.setObjective('Set the glyph pillar’s bands: 2 · 4 · 1.');
  });

  pillar.bands.forEach((band, i) => {
    ctx.register(`band:${i}`, band, () => {
      if (pillarSolved) return;
      bandClicks[i] = (bandClicks[i] + 1) % 6;
      band.rotation.y = bandRest[i] + (bandClicks[i] * Math.PI) / 3;
      ctx.toast(`${['Bottom', 'Middle', 'Top'][i]} band: position ${bandClicks[i]}.`);
      if (bandClicks.every((c, k) => c === BAND_TARGET[k])) {
        pillarSolved = true;
        ctx.toast('The pillar hums. The floor plate before the dais wakes.');
        ctx.setObjective('Place the scarab on the pressure plate.');
      }
    });
  });

  ctx.register('plate', plate.group, () => {
    if (!pillarSolved || !hasScarab) {
      ctx.toast(pillarSolved ? 'The plate wants an offering.' : 'The plate is dead stone — for now.');
      return;
    }
    if (placed) return;
    placed = true;
    ctx.win('The scarab sinks. Light floods the doorway — you walk out of the pharaoh’s shadow.');
  });

  return {
    update: (delta) => {
      if (ringsSolved && lidOpen < 1) {
        lidOpen = approach(lidOpen, 1, delta, 1.2);
        sarcophagus.lid.position.x = 0.12 + lidOpen * 0.55;
        sarcophagus.lid.rotation.y = lidOpen * 0.18;
      }
      if (chestOpen && chestLid < 1) {
        chestLid = approach(chestLid, 1, delta, 1.6);
        chest.lid.rotation.x = -chestLid * 1.6;
      }
      if (placed && plateSink < 1) {
        plateSink = approach(plateSink, 1, delta, 2);
        plate.plate.position.y = 0.075 - plateSink * 0.05;
      }
    },
  };
}
