import type * as S from '@/scenery';
import type * as THREE from 'three';
import { approach, type GameCtx, type RoomGame } from '@/scenery/play';

/**
 * "Bureau 13" — playable chain (8 beats):
 *  1. Evidence board → the case points at the wall clock.
 *  2. The clock died at 4:35 → the alarm code.
 *  3. Keypad: enter 4-3-5 → the laser corridor powers down, beam by beam.
 *  4. The safe was behind the lasers all along → a keycard inside.
 *  5. The keycard lifts the security gate.
 *  6. The briefcase beyond the gate holds the vault combination note (7 o'clock).
 *  7. Spin the vault wheel three times.
 *  8. The vault swings — escaped.
 */

const CODE = '435';

export function bureauGame(
  handles: Record<string, unknown>,
  ctx: GameCtx,
  carry: Record<string, unknown>,
): RoomGame {
  const keypad = handles.keypad as ReturnType<typeof S.keypad>;
  const tripwires = handles.tripwires as ReturnType<typeof S.laserTripwires>;
  const vault = handles.vault as ReturnType<typeof S.vaultDoor>;
  const safe = handles.safe as ReturnType<typeof S.safeBox>;
  const gate = handles.gate as ReturnType<typeof S.keycardGate>;
  const clock = handles.clock as ReturnType<typeof S.wallClock>;
  const briefcase = handles.briefcase as ReturnType<typeof S.briefcase>;
  const board = handles.board as THREE.Group;

  let sawBoard = false;
  let sawClock = false;
  let buffer = '';
  let disarmed = false;
  let safeOpen = false;
  let hasKeycard = false;
  let gateOpen = false;
  let sawNote = false;
  let wheelSpins = 0;
  let escaped = false;
  let disarmProgress = 0;
  let safeSwing = 0;
  let gateLift = 0;
  let doorSwing = 0;
  let wheelTarget = vault.wheel.rotation.z;

  ctx.setObjective('The vault won’t open while the lasers are hot. Work the case.');

  ctx.register('board', board, () => {
    sawBoard = true;
    ctx.toast('The red string all leads to one photo: the office clock. "TIME OF DEATH?"');
    if (!sawClock) ctx.setObjective('Check the wall clock by the door.');
  });

  ctx.register('clock', clock.group, () => {
    sawClock = true;
    ctx.toast(sawBoard ? 'The clock died at 4:35. That’s the code.' : 'A dead clock. 4:35. Odd.');
    ctx.setObjective('Enter the code on the keypad (west wall, by the lasers).');
  });

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
  keypad.keys.forEach((key, i) => {
    ctx.register(`key:${digits[i]}`, key, () => {
      if (disarmed) return;
      buffer = (buffer + digits[i]).slice(-3);
      ctx.toast(`KEYPAD: ${buffer.padStart(3, '·')}`);
      keypad.screenMaterial.emissiveIntensity = 2.4;
      if (buffer === CODE) {
        disarmed = true;
        ctx.toast('ACCESS GRANTED — laser grid powering down.');
        ctx.setObjective('The corridor is clearing. What were the lasers protecting?');
      } else if (buffer.length === 3 && !CODE.startsWith(buffer)) {
        keypad.screenMaterial.emissive.setHex(0xff2b3a);
      }
    });
  });

  ctx.register('safe', safe.group, () => {
    if (!disarmed) {
      ctx.toast('The safe sits behind live lasers. Not worth your fingers.');
      return;
    }
    if (safeOpen) return;
    safeOpen = true;
    hasKeycard = true;
    ctx.toast('The safe was never locked — inside, a black KEYCARD.');
    ctx.setObjective('Swipe the keycard at the security gate.');
  });

  ctx.register('gate', gate.group, () => {
    if (!hasKeycard) {
      ctx.toast('The reader blinks red. It wants a keycard.');
      return;
    }
    if (gateOpen) return;
    gateOpen = true;
    ctx.toast('The barrier lifts.');
    ctx.setObjective('The courier’s briefcase is past the gate. Open it.');
  });

  ctx.register('briefcase', briefcase.group, () => {
    if (!gateOpen) {
      ctx.toast('The briefcase is cuffed to the rail beyond the gate.');
      return;
    }
    sawNote = true;
    ctx.toast('A note in the foam: "Three full turns. No more, no less."');
    ctx.setObjective('Spin the vault wheel — three full turns.');
  });

  ctx.register('vault', vault.wheel, () => {
    if (!disarmed) {
      ctx.toast('The wheel is ice cold. The lasers say no.');
      return;
    }
    if (!sawNote) {
      ctx.toast('The wheel gives a little. How many turns? Guessing could jam it.');
      return;
    }
    if (escaped) return;
    wheelSpins++;
    wheelTarget += Math.PI * 2;
    ctx.toast(`Turn ${wheelSpins} of 3…`);
    if (wheelSpins >= 3) {
      escaped = true;
      carry.keycard = true; // the black keycard stays on you
      ctx.win('The bolts thud back and the vault swings wide. The archives are below.');
    }
  });

  return {
    update: (delta, elapsed) => {
      keypad.screenMaterial.emissiveIntensity = approach(keypad.screenMaterial.emissiveIntensity, 1, delta, 1.5);
      if (disarmed && disarmProgress < 1) {
        disarmProgress = approach(disarmProgress, 1.01, delta, 0.8);
        tripwires.beams.forEach((beam, i) => {
          beam.visible = disarmProgress < (i + 1) / tripwires.beams.length ? true : false;
        });
        tripwires.beamMaterial.emissiveIntensity = 2.4 * (1 - disarmProgress);
      }
      if (safeOpen && safeSwing < 1) {
        safeSwing = approach(safeSwing, 1, delta, 1.4);
        safe.door.rotation.y = safeSwing * 1.5;
      }
      if (gateOpen && gateLift < 1) {
        gateLift = approach(gateLift, 1, delta, 1.4);
        gate.barrier.rotation.z = (gateLift * Math.PI) / 2.2;
      }
      vault.wheel.rotation.z = approach(vault.wheel.rotation.z, wheelTarget, delta, 2.5);
      if (escaped && doorSwing < 1) {
        doorSwing = approach(doorSwing, 1, delta, 0.8);
        vault.door.rotation.y = doorSwing * 1.4;
        vault.bolts.forEach((bolt) => bolt.scale.setScalar(1 - doorSwing * 0.5 + 0.5));
      }
      void elapsed;
    },
  };
}
