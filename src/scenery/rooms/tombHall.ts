import * as S from '@/scenery';
import type * as THREE from 'three';
import type { RoomSpec } from '@/scenery/compose';
import { approach, type GameCtx, type RoomGame } from '@/scenery/play';

/**
 * Stage 2 — "The Hall of Judgement". The heart is weighed against truth.
 * Chain (7 beats): judgement panel → canopic jars name the weight → lift the
 * right weight → balance the scale → the chimes wake → strike the three
 * tones in order → the ankh key rises from the altar. Carries in: scarab.
 * Carries out: ankh.
 */

const W = 10;
const H = 4.2;
const D = 12;
const CORRECT_WEIGHT = 2; // index: the third son's weight
const CHIME_ORDER = [4, 0, 2]; // deep, high, middle

export const tombHallSpec: RoomSpec = {
  name: 'The Hall of Judgement',
  paletteName: 'sandstone',
  seed: 'tomb-hall:v1',
  size: { w: W, h: H, d: D },
  shell: { floor: 0x9c7f52, walls: 0xbd9a62, ceiling: 0x7a5f36 },
  lighting: {
    ambient: { color: 0xffdca0, intensity: 0.5 },
    points: [
      { x: 0, y: 3.2, z: 0, color: 0xffc063, intensity: 16 },
      { x: -3.5, y: 2.4, z: -3.5, color: 0xff9a4a, intensity: 10 },
      { x: 3.5, y: 2.4, z: -3.5, color: 0xff9a4a, intensity: 10 },
      { x: 0, y: 2.6, z: 4.5, color: 0xffe9c0, intensity: 10 },
    ],
  },
  pieces: [
    // The scales of judgement, centre stage on a dais.
    { id: 'scale', at: [0, -2.5], clearRadius: 1.6, build: (rng, pal) => S.balanceScale(rng, pal) },
    { at: [0, -2.5], clearRadius: 0, build: (_rng, pal) => S.platformDais(pal, { radius: 1.6, tiers: 2 }) },
    { id: 'weights', at: [-2.6, -0.8], build: (rng, pal) => S.weightSet(rng, pal) },
    { id: 'jars', at: [3.2, -3.6], rotY: -0.7, build: (rng, pal) => S.canopicJars(rng, pal) },
    { id: 'chimes', at: [2.9, 1.6], rotY: -0.6, build: (rng, pal) => S.chimeRack(rng, pal) },
    { id: 'altar', at: [0, -D / 2 + 1.1], clearRadius: 1.4, build: (rng, pal) => S.stepAltar(rng, pal) },
    { id: 'judgePanel', at: [-W / 2 + 0.15, 0.5], rotY: Math.PI / 2, build: (rng, pal) => S.hieroglyphPanel(rng, pal) },
    // The jury: statues watching the weighing.
    { at: [-3.6, -4.4], rotY: 0.8, build: (rng, pal) => S.robedStatue(rng, pal, { height: 2.3 }) },
    { at: [-3.9, 2.6], rotY: 1.1, build: (rng, pal) => S.gargoyle(rng, pal) },
    { at: [3.9, 3.4], rotY: -1.2, build: (rng, pal) => S.sphinxStatue(rng, pal) },
    { at: [-1.8, 4.4], build: (rng, pal) => S.obelisk(rng, pal, { height: 2.2 }) },
    { at: [1.8, 4.4], build: (rng, pal) => S.obelisk(rng, pal, { height: 2.2 }) },
    { at: [2.6, -D / 2 + 0.15], build: (rng, pal) => S.scarabRelief(rng, pal) },
    { at: [-2.6, -D / 2 + 0.15], build: (rng, pal) => S.muralPanel(rng, pal, { width: 1.4, height: 1.3 }) },
    // Fire and decay.
    { id: 'brazier', at: [-2.2, -4.6], build: (rng, pal) => S.campfire(rng, pal) },
    { at: [W / 2 - 0.2, 0.5], rotY: -Math.PI / 2, build: (rng, pal) => S.wallSconce(rng, pal) },
    { at: [-W / 2 + 0.2, -3.5], rotY: Math.PI / 2, build: (rng, pal) => S.wallSconce(rng, pal) },
    { at: [3.6, 0.2], build: (rng, pal) => S.sandDrift(rng, pal, { width: 1.6 }) },
    { at: [0, 0], clearRadius: 0, build: (rng) => S.dustMotes(rng, { width: W - 1, height: H, depth: D - 1, count: 200 }) },
    { at: [0, 2], clearRadius: 0, build: (rng) => S.godRays(rng, { color: 0xffd9a0, height: H }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('tomb:chant') },
  ],
  scatter: [
    { count: 3, build: (rng, pal) => S.gravelPatch(rng, pal, { radius: 0.55 }) },
    { count: 2, build: (rng, pal) => S.bottleCluster(rng, pal, { count: 3 }) },
  ],
};

export function tombHallGame(
  handles: Record<string, unknown>,
  ctx: GameCtx,
  carry: Record<string, unknown>,
): RoomGame {
  const scale = handles.scale as ReturnType<typeof S.balanceScale>;
  const weights = handles.weights as ReturnType<typeof S.weightSet>;
  const jars = handles.jars as THREE.Group;
  const chimes = handles.chimes as ReturnType<typeof S.chimeRack>;
  const altar = handles.altar as THREE.Group;
  const panel = handles.judgePanel as THREE.Group;
  const brazier = handles.brazier as ReturnType<typeof S.campfire>;

  let readPanel = false;
  let readJars = false;
  let held = -1;
  let balanced = false;
  let struck: number[] = [];
  let chimesDone = false;
  let hasAnkh = false;
  let beamSettle = 0;

  ctx.setObjective(
    carry.scarab
      ? 'The scarab hums in your hand. The scales demand a weighing.'
      : 'The scales demand a weighing.',
  );
  ctx.setHint(
    'The judgement panel and the man-headed canopic jar both point to the THIRD weight as the true one. Balance that on the scale, then strike the chimes in the tone order the beam names: deep, high, middle.',
  );

  ctx.register('judgePanel', panel, () => {
    readPanel = true;
    ctx.toast('"The heart of the THIRD SON weighs true. All others lie."');
    if (!readJars) ctx.setObjective('The canopic jars know the sons. Ask them.');
  });
  ctx.register('jars', jars, () => {
    readJars = true;
    ctx.toast('Falcon, jackal, MAN, baboon — the man-headed jar is third-born.');
    ctx.setObjective(readPanel ? 'Lift the third weight and set it on the scale.' : 'Something numbers these jars. Find it.');
  });
  weights.weights.forEach((weight, i) => {
    ctx.register(`weight:${i}`, weight, () => {
      held = i;
      ctx.toast(`You lift the ${['first', 'second', 'third', 'fourth', 'fifth'][i]} weight.`);
    });
  });
  ctx.register('scale', scale.group, () => {
    if (balanced) return;
    if (held < 0) {
      ctx.toast('The empty pan waits. Bring a weight.');
      return;
    }
    if (held === CORRECT_WEIGHT) {
      balanced = true;
      ctx.toast('The beam settles level. Somewhere above, bells shiver awake.');
      ctx.setObjective('Strike the chimes: the DEEP tone, the HIGH tone, then the MIDDLE.');
    } else {
      ctx.toast('The beam slams down — a lying heart. Take it back.');
      held = -1;
    }
  });
  chimes.chimes.forEach((chime, i) => {
    ctx.register(`chime:${i}`, chime, () => {
      if (!balanced || chimesDone) {
        if (!balanced) ctx.toast('The chimes hang dead until the weighing is done.');
        return;
      }
      struck.push(i);
      ctx.toast(`A tone rings out (${struck.length}/3)…`);
      if (struck.length === 3) {
        if (struck.every((s, k) => s === CHIME_ORDER[k])) {
          chimesDone = true;
          ctx.toast('The triad resolves. The altar splits — an ANKH rises.');
          ctx.setObjective('Take the ankh from the altar.');
        } else {
          struck = [];
          ctx.toast('The tones clash and die. Begin the triad again.');
        }
      }
    });
  });
  ctx.register('altar', altar, () => {
    if (!chimesDone) {
      ctx.toast('The altar is sealed stone.');
      return;
    }
    if (hasAnkh) return;
    hasAnkh = true;
    carry.ankh = true;
    ctx.win('The ankh is cold iron in your palm. The burial vault door unbars itself.');
  });

  return {
    update: (delta, elapsed) => {
      // The beam visibly reacts to the verdict.
      const target = balanced ? 0 : scale.beam.rotation.z;
      if (balanced && beamSettle < 1) {
        beamSettle = approach(beamSettle, 1, delta, 1.5);
        scale.beam.rotation.z = approach(scale.beam.rotation.z, target, delta, 1.5);
        scale.panLeft.rotation.z = -scale.beam.rotation.z;
        scale.panRight.rotation.z = -scale.beam.rotation.z;
      }
      brazier.flameMaterials.forEach((m, i) => {
        m.emissiveIntensity = 2 - i * 0.4 + Math.sin(elapsed * 9 + i * 2.3) * 0.5;
      });
    },
  };
}
