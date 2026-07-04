import * as S from '@/scenery';
import type { RoomSpec } from '@/scenery/compose';
import { approach, type GameCtx, type RoomGame } from '@/scenery/play';

/**
 * Stage 3 — "The Server Vault". The machine the Bureau built, and the way out.
 * Chain (7 beats): the microfilm projects on the holo table → breakers in the
 * order it names (2·4·1) → the robot arm wakes and fetches the data core →
 * the monitor decodes it into a colour sequence → press the sequence buttons
 * → the pneumatic tube spits the exit chip → the blast exit spins open.
 * Carries in: microfilm.
 */

const W = 10;
const H = 3.6;
const D = 13;
const BREAKER_ORDER = [1, 3, 0]; // levers: second, fourth, first
const BUTTON_ORDER = [0, 2, 1];

export const bureauVaultSpec: RoomSpec = {
  name: 'The Server Vault',
  paletteName: 'neon',
  seed: 'bureau-vault:v1',
  size: { w: W, h: H, d: D },
  shell: { floor: 0x0d1118, walls: 0x141b26, ceiling: 0x0a0e15 },
  lighting: {
    ambient: { color: 0xbfe4ff, intensity: 0.5 },
    points: [
      { x: 0, y: 3, z: 0, color: 0xdfe9ff, intensity: 11 },
      { x: -3.5, y: 2.2, z: -3.5, color: 0x1fd1ff, intensity: 8, distance: 8 },
      { x: 3.5, y: 2.2, z: -3.5, color: 0x1fd1ff, intensity: 8, distance: 8 },
      { x: 0, y: 2.2, z: 5, color: 0xff4a4a, intensity: 6, distance: 7 },
    ],
  },
  pieces: [
    // The machine rows.
    { at: [-W / 2 + 0.7, -1], rotY: Math.PI / 2, build: (rng, pal) => S.serverTotem(rng, pal) },
    { at: [-W / 2 + 0.7, 1.2], rotY: Math.PI / 2, build: (rng, pal) => S.serverTotem(rng, pal) },
    { at: [W / 2 - 0.7, -1], rotY: -Math.PI / 2, build: (rng, pal) => S.serverTotem(rng, pal) },
    { at: [W / 2 - 0.7, 1.2], rotY: -Math.PI / 2, build: (rng, pal) => S.serverTotem(rng, pal) },
    { at: [-W / 2 + 0.6, 3.6], rotY: Math.PI / 2, build: (rng, pal) => S.consoleBank(rng, pal, { stations: 2 }) },
    // Puzzle stations.
    { id: 'holo', at: [0, 2.2], clearRadius: 1.4, build: (rng, pal) => S.holoTable(rng, pal) },
    { id: 'breakers', at: [-2.9, -3.9], rotY: 0.5, clearRadius: 1.3, build: (rng, pal) => S.leverBank(rng, pal, { levers: 4 }) },
    { id: 'arm', at: [2.9, -3.7], rotY: -0.7, clearRadius: 1.5, build: (rng, pal) => S.robotArm(rng, pal) },
    { id: 'monitor', at: [W / 2 - 0.15, -4.3], rotY: -Math.PI / 2, clearRadius: 0.8, build: (_rng, pal) => S.tvScreen(pal) },
    { id: 'buttons', at: [-W / 2 + 0.15, -4.3], rotY: Math.PI / 2, clearRadius: 0.8, build: (rng, pal) => S.sequenceButtons(rng, pal, { count: 3 }) },
    { id: 'tube', at: [1.9, 4.8], rotY: Math.PI, clearRadius: 1.2, build: (rng, pal) => S.pneumaticStation(rng, pal) },
    { id: 'exit', at: [0, -D / 2 + 0.4], clearRadius: 2, build: (rng, pal) => S.vaultDoor(rng, pal) },
    // Security that watches you work.
    { at: [0, D / 2 - 0.2], rotY: Math.PI, build: (rng, pal) => S.sentryTurret(rng, pal) },
    { at: [-1.8, 0.4], clearRadius: 0, build: (rng, pal) => S.hoverDrone(rng, pal, { height: 2.4 }) },
    { at: [-3.9, 4.6], build: (rng, pal) => S.patrolBot(rng, pal, { radius: 0.9 }) },
    { at: [3.7, 2.9], build: (rng, pal) => S.chargeDock(rng, pal) },
    { at: [-2.2, 4.9], build: (rng, pal) => S.droneRack(rng, pal) },
    { at: [3.9, 0.2], build: (rng, pal) => S.gasCylinders(rng, pal, { count: 4 }) },
    // Cold, humming atmosphere.
    { at: [0, 0], clearRadius: 0, build: (rng) => S.fogBank(rng, { width: W - 1, depth: D - 1, color: 0x6a90a8 }) },
    { at: [0, 0], y: 0, clearRadius: 0, build: (rng, pal) => S.glowRope(rng, pal, { length: D - 3 }), rotY: Math.PI / 2 },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('vault:serverhum', { color: 0x1fd1ff }) },
  ],
  scatter: [
    { count: 3, build: (rng, pal) => S.cableCoil(rng, pal) },
    { count: 2, build: (rng, pal) => S.toolScatter(rng, pal) },
  ],
};

export function bureauVaultGame(
  handles: Record<string, unknown>,
  ctx: GameCtx,
  carry: Record<string, unknown>,
): RoomGame {
  const holo = handles.holo as ReturnType<typeof S.holoTable>;
  const breakers = handles.breakers as ReturnType<typeof S.leverBank>;
  const arm = handles.arm as ReturnType<typeof S.robotArm>;
  const monitor = handles.monitor as ReturnType<typeof S.tvScreen>;
  const buttons = handles.buttons as ReturnType<typeof S.sequenceButtons>;
  const tube = handles.tube as ReturnType<typeof S.pneumaticStation>;
  const exit = handles.exit as ReturnType<typeof S.vaultDoor>;

  let projected = false;
  let pulled: number[] = [];
  let breakersDone = false;
  let coreFetched = false;
  let decoded = false;
  let pressed: number[] = [];
  let buttonsDone = false;
  let hasChip = false;
  let spins = 0;
  let escaped = false;
  let armSwing = 0;
  let doorSwing = 0;
  let wheelTarget = exit.wheel.rotation.z;

  ctx.setObjective('The exit is a blast door. The room is asleep — mostly.');
  ctx.setHint(
    'Feed the microfilm to the holo table for the breaker order (2 · 4 · 1). Throw them, wake the robot arm for the data core, decode it on the monitor to get the button sequence, then spin the wheel to blow the blast door.',
  );

  ctx.register('holo', holo.group, () => {
    if (projected) return;
    if (!carry.microfilm) {
      ctx.toast('The holo table idles, waiting for input media.');
      return;
    }
    projected = true;
    ctx.toast('The microfilm projects: "BREAKERS: SECOND, FOURTH, FIRST. Then wake the arm."');
    ctx.setObjective('Pull the breakers in order: 2 · 4 · 1.');
  });

  breakers.levers.forEach((lever, i) => {
    ctx.register(`lever:${i}`, lever, () => {
      if (breakersDone) return;
      if (!projected) {
        ctx.toast('Four dead levers. Order unknown — and probably alarmed.');
        return;
      }
      pulled.push(i);
      lever.rotation.x = -0.5;
      ctx.toast(`Breaker ${i + 1} thrown (${pulled.length}/3).`);
      if (pulled.length === 3) {
        if (pulled.every((p, k) => p === BREAKER_ORDER[k])) {
          breakersDone = true;
          ctx.toast('Power surges down the racks. The robot arm twitches awake.');
          ctx.setObjective('Wake the arm — let it fetch the data core.');
        } else {
          pulled = [];
          breakers.levers.forEach((l) => (l.rotation.x = 0.5));
          ctx.toast('Breakers slam back — wrong order. Start over.');
        }
      }
    });
  });

  ctx.register('arm', arm.group, () => {
    if (!breakersDone) {
      ctx.toast('The arm hangs limp, unpowered.');
      return;
    }
    if (coreFetched) return;
    coreFetched = true;
    ctx.toast('The arm swings deep into the racks and returns with a DATA CORE.');
    ctx.setObjective('Feed the core to the wall monitor.');
  });

  ctx.register('monitor', monitor.group, () => {
    if (!coreFetched) {
      ctx.toast('NO SIGNAL.');
      return;
    }
    if (decoded) return;
    decoded = true;
    monitor.slot.setImage(S.textTexture(['1 · 3 · 2'], { background: '#0d3320', color: '#8affc2' }));
    ctx.toast('The core decodes: press the panel buttons FIRST, THIRD, SECOND.');
    ctx.setObjective('Press the sequence buttons: 1 · 3 · 2.');
  });

  buttons.buttons.forEach((button, i) => {
    ctx.register(`button:${i}`, button, () => {
      if (buttonsDone) return;
      if (!decoded) {
        ctx.toast('Three fat buttons. No labels. No thanks.');
        return;
      }
      pressed.push(i);
      buttons.lampMaterials[i].emissiveIntensity = 2.6;
      ctx.toast(`Button ${i + 1} (${pressed.length}/3).`);
      if (pressed.length === 3) {
        if (pressed.every((p, k) => p === BUTTON_ORDER[k])) {
          buttonsDone = true;
          ctx.toast('A capsule THUNKS through the pneumatic tube.');
          ctx.setObjective('Collect the capsule from the tube station.');
        } else {
          pressed = [];
          buttons.lampMaterials.forEach((m) => (m.emissiveIntensity = 0.35));
          ctx.toast('The panel buzzes red. Sequence reset.');
        }
      }
    });
  });

  ctx.register('tube', tube, () => {
    if (!buttonsDone) {
      ctx.toast('The tube is empty — for now.');
      return;
    }
    if (hasChip) return;
    hasChip = true;
    ctx.toast('The capsule holds a golden EXIT CHIP: "BLAST DOOR OVERRIDE".');
    ctx.setObjective('Spin the blast door wheel — three turns.');
  });

  ctx.register('exit', exit.wheel, () => {
    if (!hasChip) {
      ctx.toast('The wheel is locked out by the security system.');
      return;
    }
    if (escaped) return;
    spins++;
    wheelTarget += Math.PI * 2;
    ctx.toast(`Turn ${spins} of 3…`);
    if (spins >= 3) {
      escaped = true;
      ctx.win('The blast door swings into cold night air. The Bureau’s machine hums on behind you — minus one microfilm.');
    }
  });

  return {
    update: (delta, elapsed) => {
      holo.holoMaterial.opacity = 0.22 + (projected ? Math.sin(elapsed * 2) * 0.06 + 0.08 : 0);
      if (coreFetched && armSwing < 1) {
        armSwing = approach(armSwing, 1, delta, 0.9);
        arm.joints[0].rotation.y += delta * 1.2 * (1 - armSwing);
        arm.joints[1].rotation.x = -0.5 + Math.sin(armSwing * Math.PI) * 0.5;
        arm.joints[2].rotation.x = 0.7 + Math.sin(armSwing * Math.PI) * 0.4;
      }
      exit.wheel.rotation.z = approach(exit.wheel.rotation.z, wheelTarget, delta, 2.5);
      if (escaped && doorSwing < 1) {
        doorSwing = approach(doorSwing, 1, delta, 0.8);
        exit.door.rotation.y = doorSwing * 1.4;
      }
    },
  };
}
