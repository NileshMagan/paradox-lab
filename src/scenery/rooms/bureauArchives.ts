import * as S from '@/scenery';
import type * as THREE from 'three';
import type { RoomSpec } from '@/scenery/compose';
import { approach, type GameCtx, type RoomGame } from '@/scenery/play';

/**
 * Stage 2 — "The Archives". Below the vault: the records that shouldn't exist.
 * Chain (7 beats): the open drawer names patient "X-RAY 7" → the x-ray viewer
 * shows seven bright ribs → the reel tape whispers the patch ("two into
 * five") → patch the switchboard → power returns → set the combination dial
 * to 7 → the safe yields the MICROFILM → the freight door reads your keycard.
 * Carries in: keycard. Carries out: microfilm.
 */

const W = 9;
const H = 3.2;
const D = 12;
const DIAL_TARGET = 7;

export const bureauArchivesSpec: RoomSpec = {
  name: 'The Archives',
  paletteName: 'noir',
  seed: 'bureau-archives:v1',
  size: { w: W, h: H, d: D },
  shell: { floor: 0x15181d, walls: 0x232830, ceiling: 0x101318 },
  lighting: {
    ambient: { color: 0xbfd4e8, intensity: 0.42 },
    points: [
      { x: 0, y: 2.7, z: 3, color: 0xdfe9ff, intensity: 9 },
      { x: 0, y: 2.7, z: -3, color: 0xdfe9ff, intensity: 9 },
      { x: -3.2, y: 2, z: -4.5, color: 0xffd9a0, intensity: 7, distance: 6 },
      { x: 3.4, y: 1.8, z: 4.2, color: 0x9fd8ff, intensity: 6, distance: 6 },
    ],
  },
  pieces: [
    // Rows of records — the room IS the filing system.
    { at: [-W / 2 + 0.55, -1.2], rotY: Math.PI / 2, build: (rng, pal) => S.archiveShelf(rng, pal) },
    { at: [-W / 2 + 0.55, 1.4], rotY: Math.PI / 2, build: (rng, pal) => S.archiveShelf(rng, pal) },
    { at: [W / 2 - 0.5, 2.8], rotY: -Math.PI / 2, build: (rng, pal) => S.archiveShelf(rng, pal) },
    { id: 'files', at: [W / 2 - 0.5, 0.6], rotY: -Math.PI / 2, build: (rng, pal) => S.filingCabinet(rng, pal) },
    { at: [W / 2 - 0.5, -0.6], rotY: -Math.PI / 2, build: (rng, pal) => S.filingCabinet(rng, pal) },
    // The medical corner.
    { id: 'xray', at: [-W / 2 + 0.15, -4.2], rotY: Math.PI / 2, clearRadius: 0.8, build: (rng, pal) => S.xrayViewer(rng, pal) },
    { at: [-2.6, -4.6], rotY: 0.9, build: (rng, pal) => S.gurney(rng, pal) },
    { at: [-W / 2 + 0.6, -2.9], rotY: Math.PI / 2, build: (rng, pal) => S.medCabinet(rng, pal) },
    // Signals corner: the reels and the board they feed.
    { id: 'reels', at: [3.4, 4.4], rotY: -1.1, clearRadius: 1.4, build: (rng, pal) => S.listeningPost(rng, pal) },
    { id: 'patch', at: [0.8, D / 2 - 0.15], rotY: Math.PI, clearRadius: 0.8, build: (rng, pal) => S.patchBoard(rng, pal) },
    { id: 'fuses', at: [-1.4, D / 2 - 0.15], rotY: Math.PI, clearRadius: 0.8, build: (rng, pal) => S.wireFusePanel(rng, pal) },
    // The prize.
    { id: 'dial', at: [0.6, -D / 2 + 0.15], clearRadius: 0.8, build: (rng, pal) => S.combinationDial(rng, pal) },
    { id: 'safe', at: [-0.9, -D / 2 + 0.55], rotY: 0.15, clearRadius: 1.2, build: (rng, pal) => S.safeBox(rng, pal) },
    { id: 'exit', at: [2.6, -D / 2 + 0.4], rotY: 0, clearRadius: 1.2, build: (rng, pal) => S.keycardGate(rng, pal) },
    // Dressing.
    { at: [-3.2, 4.5], build: (rng, pal) => S.tailorDummy(rng, pal) },
    { at: [0.2, 2.2], build: (rng, pal) => S.mapTable(rng, pal) },
    { at: [1.7, -2.4], build: (rng, pal) => S.cratePyramid(rng, pal) },
    { at: [0, 4.8], y: H, clearRadius: 0, build: (rng, pal) => S.lightFixture(rng, pal, { drop: 1, color: 0xffd9a0 }) },
    { at: [0, -2.2], y: H, clearRadius: 0, build: (rng, pal) => S.lightFixture(rng, pal, { drop: 1, color: 0xffd9a0 }) },
    { at: [0, 0], clearRadius: 0, build: (rng) => S.groundMist(rng, { width: W - 1, depth: D - 1, color: 0x6a7480 }) },
    { at: [1.2, 1], clearRadius: 0, build: (rng, pal) => S.ratScurrier(rng, pal, { radius: 1.1 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('archives:hum', { color: 0x9fd8ff }) },
  ],
  scatter: [
    { count: 4, minSpacing: 1.3, build: (rng, pal) => S.paperScatter(rng, pal, { radius: 0.5, count: 8 }) },
    { count: 2, build: (rng, pal) => S.bookRow(rng, pal, { length: 0.7 }) },
    { count: 2, build: (rng, pal) => S.cableCoil(rng, pal) },
  ],
};

export function bureauArchivesGame(
  handles: Record<string, unknown>,
  ctx: GameCtx,
  carry: Record<string, unknown>,
): RoomGame {
  const files = handles.files as THREE.Group;
  const xray = handles.xray as ReturnType<typeof S.xrayViewer>;
  const reels = handles.reels as ReturnType<typeof S.listeningPost>;
  const patch = handles.patch as ReturnType<typeof S.patchBoard>;
  const fuses = handles.fuses as ReturnType<typeof S.wireFusePanel>;
  const dial = handles.dial as ReturnType<typeof S.combinationDial>;
  const safe = handles.safe as ReturnType<typeof S.safeBox>;
  const exit = handles.exit as ReturnType<typeof S.keycardGate>;

  let readFiles = false;
  let readXray = false;
  let heardTape = false;
  let patched = false;
  let powered = false;
  let dialClicks = 0;
  let safeOpen = false;
  let hasFilm = false;
  let out = false;
  let safeSwing = 0;
  let gateLift = 0;
  const dialRest = dial.dial.rotation.z;
  xray.panelMaterial.emissiveIntensity = 0.15; // dead until power returns

  ctx.setObjective('The archives are half-dark and the exit reads NO POWER.');

  ctx.register('files', files, () => {
    readFiles = true;
    ctx.toast('The open drawer holds one folder: "PATIENT X-RAY 7 — see radiology."');
    if (!readXray) ctx.setObjective('Find radiology. Something is filed under 7.');
  });
  ctx.register('fuses', fuses.group, () => {
    ctx.toast(patched ? 'The fuse box hums, healthy.' : 'Half the wires are CUT. The switchboard next to it is the bypass.');
  });
  ctx.register('reels', reels.group, () => {
    heardTape = true;
    ctx.toast('The tape crackles: "…patch line TWO into line FIVE and the basement wakes…"');
    ctx.setObjective('Patch the switchboard: two into five.');
  });
  ctx.register('patch', patch.group, () => {
    if (patched) return;
    if (!heardTape) {
      ctx.toast('Fifteen sockets, two loose plugs. Patch them blind and you fry something.');
      return;
    }
    patched = true;
    powered = true;
    ctx.toast('Two into five. Relays clatter — the lights breathe back on.');
    ctx.setObjective(readFiles ? 'Radiology has power now. File 7.' : 'Power is back. Search the records.');
  });
  ctx.register('xray', xray.group, () => {
    if (!powered) {
      ctx.toast('The lightbox is dead glass without power.');
      return;
    }
    readXray = true;
    ctx.toast('The film glows: SEVEN ribs painted bright. The combination is 7.');
    ctx.setObjective('Set the wall dial to 7.');
  });
  ctx.register('dial', dial.group, () => {
    if (safeOpen) return;
    if (!readXray) {
      ctx.toast('A numbered dial. Spinning it at random feels like a trap.');
      return;
    }
    dialClicks = (dialClicks + 1) % 10;
    dial.dial.rotation.z = dialRest - (dialClicks * Math.PI * 2) / 10;
    ctx.toast(`The dial clicks to ${dialClicks}.`);
    if (dialClicks === DIAL_TARGET) {
      safeOpen = true;
      ctx.toast('A thunk inside the wall — the floor safe unlocks.');
      ctx.setObjective('Open the floor safe.');
    }
  });
  ctx.register('safe', safe.group, () => {
    if (!safeOpen) {
      ctx.toast('The safe door doesn’t move a hair.');
      return;
    }
    if (hasFilm) return;
    hasFilm = true;
    carry.microfilm = true;
    ctx.toast('Inside: a single MICROFILM canister. This is what they killed for.');
    ctx.setObjective('Take the freight gate down to the server vault.');
  });
  ctx.register('exit', exit.group, () => {
    if (!hasFilm) {
      ctx.toast('The gate reader blinks: CARGO MANIFEST INCOMPLETE.');
      return;
    }
    if (!carry.keycard) {
      ctx.toast('The reader wants the black keycard.');
      return;
    }
    if (out) return;
    out = true;
    ctx.win('The freight gate accepts the card and grinds up. Down you go.');
  });

  return {
    update: (delta, elapsed) => {
      xray.panelMaterial.emissiveIntensity = powered
        ? approach(xray.panelMaterial.emissiveIntensity, 1.1, delta, 2)
        : 0.15;
      reels.reels.forEach((reel) => void (reel.rotation.y += delta * (heardTape ? 1.6 : 0.2)));
      if (safeOpen && hasFilm && safeSwing < 1) {
        safeSwing = approach(safeSwing, 1, delta, 1.4);
        safe.door.rotation.y = safeSwing * 1.5;
      }
      if (out && gateLift < 1) {
        gateLift = approach(gateLift, 1, delta, 1.4);
        exit.barrier.rotation.z = (gateLift * Math.PI) / 2.2;
      }
      void elapsed;
    },
  };
}
