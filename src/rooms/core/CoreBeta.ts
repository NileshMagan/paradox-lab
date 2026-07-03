import * as THREE from 'three';
import { slotLocal } from '@/config/facility';
import { ANCHOR_CANDIDATES, TARGET_ANCHOR_INDEX, TARGET_MIRRORS } from '@/config/puzzles';
import { ensureAudio, playBlip, playFail, playSuccess } from '@/core/audio';
import { ChartScreen, domeFloorTextures, steelTexture } from '@/core/textures';
import { hangingCage, sciFiDoor, securityDrone } from '@/rooms/props';
import type { Interactable, RoomDetail } from '@/rooms/types';
import { session } from '@/systems/puzzle/session';
import { puzzleState } from '@/systems/puzzle/state';
import { DimensionId, RoomId } from '@/types';
import { buildDomeShell } from './domeShell';

/** The mirror numbers the charts call for, as Beta reads them out (1-based). */
const MIRROR_CALLOUT = TARGET_MIRRORS.map((m) => String(m + 1)).join(' & ');

const R = 10;
const PIT_R = 2.6;
const CYAN = 0x20d5ff;

/**
 * Room 3, Dimension Beta — the live Paradox Core.
 * Matches docs/reference/r3-core-beta.png: pristine steel dome, the reactor
 * pit blazing with a cyan energy beam holding the scorched relic cage, the
 * Core Control Terminal with time-dilation charts and 2× countdown, the sleek
 * manual lever, orbiting security drones, amber emergency lamp.
 */
export function buildCoreBeta(): RoomDetail {
  const root = new THREE.Group();
  root.name = 'core-beta';

  // ── Shell ────────────────────────────────────────────────────────────────
  const steel = new THREE.MeshStandardMaterial({
    map: steelTexture(),
    roughness: 0.35,
    metalness: 0.85,
    side: THREE.DoubleSide,
  });
  const [floorMap, floorGlow] = domeFloorTextures();
  const resin = new THREE.MeshStandardMaterial({
    map: floorMap,
    emissiveMap: floorGlow,
    emissive: 0xffffff,
    emissiveIntensity: 0.5,
    roughness: 0.12,
    metalness: 0.3,
  });
  const pitGlowMat = new THREE.MeshStandardMaterial({
    color: 0x061018,
    roughness: 0.4,
    emissive: CYAN,
    emissiveIntensity: 1.1,
  });
  root.add(
    buildDomeShell({
      radius: R,
      pitRadius: PIT_R,
      wallMaterial: steel,
      domeMaterial: steel,
      floorMaterial: resin,
      pitMaterial: pitGlowMat,
    }),
  );

  // ── Lighting: LED ring + clinical fill ───────────────────────────────────
  const led = new THREE.MeshBasicMaterial({ color: 0xf4f9ff });
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.5), led);
    const pr = 6.4;
    panel.position.set(Math.cos(a) * pr, 7.1, Math.sin(a) * pr);
    panel.lookAt(0, 9.5, 0);
    panel.name = 'ceiling'; // hides with the dome cap in the admin overview
    root.add(panel);
  }
  root.add(new THREE.AmbientLight(0xdfe9ff, 0.55));
  const fill = new THREE.PointLight(0xf4f9ff, 90, 30, 1.8);
  fill.position.set(0, 7.5, 0);
  root.add(fill);

  // ── The reactor: energy beam + relic cage (the cross-dimension echo) ─────
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.4, 8.5, 20, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x9fe9ff,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  beam.position.y = 2.5;
  root.add(beam);
  const beamCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.42, 8.5, 12, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xe8fbff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  beamCore.position.y = 2.5;
  root.add(beamCore);
  const scorched = new THREE.MeshStandardMaterial({ color: 0x171310, roughness: 0.9 });
  const { group: cage, crystal } = hangingCage(scorched, 0x9fe9ff, 2.2);
  cage.position.set(0, 5.2, 0);
  root.add(cage);
  const reactorLight = new THREE.PointLight(CYAN, 60, 18, 1.8);
  reactorLight.position.set(0, 2.5, 0);
  root.add(reactorLight);
  // Containment collars around the pit rim.
  const black = new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.4, metalness: 0.7 });
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.7), black);
    clamp.position.set(Math.cos(a) * (PIT_R + 0.45), 0.25, Math.sin(a) * (PIT_R + 0.45));
    clamp.lookAt(0, 0.25, 0);
    root.add(clamp);
  }

  // ── Dilation charts (puzzle: core.anchor) ────────────────────────────────
  const chartsPos = slotLocal(RoomId.ParadoxCore, 'core.equations');
  const charts = new ChartScreen();
  const chartsPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 2),
    new THREE.MeshBasicMaterial({
      map: charts.texture,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  chartsPlane.position.set(chartsPos.x, chartsPos.y + 0.4, chartsPos.z);
  chartsPlane.lookAt(0, chartsPos.y + 0.4, 0);
  root.add(chartsPlane);
  const chartsLight = new THREE.PointLight(CYAN, 8, 6, 2);
  chartsLight.position.set(chartsPos.x * 0.8, chartsPos.y + 0.5, chartsPos.z * 0.8);
  root.add(chartsLight);

  // ── Core Control Terminal (puzzle: core.mirrors) ─────────────────────────
  const termPos = slotLocal(RoomId.ParadoxCore, 'core.mirrors');
  const deskTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 0.08, 24, 1, false, -0.7, 2.4),
    new THREE.MeshStandardMaterial({
      color: 0x0b0f16,
      roughness: 0.15,
      metalness: 0.8,
      emissive: CYAN,
      emissiveIntensity: 0.3,
    }),
  );
  deskTop.position.set(termPos.x, 0.95, termPos.z);
  deskTop.lookAt(0, 0.95, 0);
  deskTop.rotateY(Math.PI); // console opening faces the operator, back to pit
  const deskBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.95, 0.8), black);
  deskBase.position.set(termPos.x, 0.47, termPos.z);
  const termScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1),
    // Front-faced only: double-sided holo text reads mirrored from behind.
    new THREE.MeshBasicMaterial({
      map: charts.texture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  termScreen.position.set(termPos.x, 1.75, termPos.z);
  termScreen.lookAt(0, 1.4, 0);
  termScreen.rotateY(Math.PI);
  root.add(deskTop, deskBase, termScreen);

  // ── Sleek manual lever (puzzle: core.lever) ──────────────────────────────
  const leverPos = slotLocal(RoomId.ParadoxCore, 'core.lever');
  const lever = new THREE.Group();
  const kiosk = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.15, 0.4), black);
  kiosk.position.y = 0.57;
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.75, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.3, metalness: 0.9 }),
  );
  arm.position.set(0, 1.4, 0.12);
  arm.rotation.x = 0.5;
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.22, 10),
    new THREE.MeshStandardMaterial({
      color: 0x0b3a20,
      roughness: 0.4,
      emissive: 0x39f0a0,
      emissiveIntensity: 0.7,
    }),
  );
  grip.rotation.z = Math.PI / 2;
  grip.position.set(0, 1.73, 0.3);
  const statusLights: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 6),
      new THREE.MeshBasicMaterial({ color: i === 0 ? 0x39f0a0 : 0x223 }),
    );
    dot.position.set(-0.15 + i * 0.15, 0.95, 0.21);
    statusLights.push(dot);
    lever.add(dot);
  }
  lever.add(kiosk, arm, grip);
  lever.position.set(leverPos.x, 0, leverPos.z);
  lever.lookAt(0, 0, 0);
  root.add(lever);

  // ── Drones, beacon, door ─────────────────────────────────────────────────
  const drones = [0, Math.PI].map((phase) => {
    const { group, scan } = securityDrone(black);
    root.add(group);
    return { group, scan, phase };
  });
  const beaconLamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffa427 }),
  );
  beaconLamp.position.set(7.4, 4.2, -4.2);
  root.add(beaconLamp);
  const beacon = new THREE.PointLight(0xffa427, 12, 12, 1.8);
  beacon.position.copy(beaconLamp.position);
  root.add(beacon);
  const door = sciFiDoor(steel, black, 'R2');
  door.group.position.set(0, 1.55, 9.5);
  door.group.rotation.y = Math.PI;
  root.add(door.group);

  // ── Animation ────────────────────────────────────────────────────────────
  const beamMat = beam.material as THREE.MeshBasicMaterial;
  const say = (text: string): void => {
    window.dispatchEvent(new CustomEvent('game:toast', { detail: text }));
  };
  let doorProgress = 0;
  const doorBar = door.lockBar.material as THREE.MeshBasicMaterial;
  const update = (delta: number, elapsed: number): void => {
    charts.update(elapsed);
    // Chart directive tracks the core puzzle chain.
    if (puzzleState.isSolved('core.mirrors')) charts.directive = 'MIRRORS LOCKED — PULL BOTH LEVERS ON A COUNT';
    else if (puzzleState.isSolved('core.anchor')) charts.directive = `ALIGN MIRRORS ${MIRROR_CALLOUT} (ALPHA SIDE)`;
    // Lever arm mirrors the shared pull state; a lone pull springs back.
    const pulled = session.leverPulled(DimensionId.Beta);
    arm.rotation.x += ((pulled ? -0.6 : 0.5) - arm.rotation.x) * Math.min(1, delta * 8);
    const expired = session.expireLonePull(performance.now() / 1000);
    if (expired) {
      playFail();
      say('The lever snaps back — «DESYNC». Pull at the SAME moment as Alpha!');
    }
    (statusLights[2].material as THREE.MeshBasicMaterial).color.setHex(
      puzzleState.isSolved('core.mirrors') ? 0x39f0a0 : 0x223,
    );
    // R2 door releases with the server hack.
    if (puzzleState.isSolved('grid.server')) {
      door.lockBar.visible = true;
      doorBar.color.setHex(0x39f0a0);
      if (doorProgress < 1) {
        doorProgress = Math.min(1, doorProgress + delta / 2);
        door.leaf.position.y = doorProgress * 2.4;
      }
    }
    // Reactor breathes: beam, pit glow and cage crystal pulse together.
    const pulse = 0.5 + Math.sin(elapsed * 2.6) * 0.5;
    beamMat.opacity = 0.16 + pulse * 0.12;
    reactorLight.intensity = 45 + pulse * 30;
    pitGlowMat.emissiveIntensity = 0.9 + pulse * 0.5;
    (crystal.material as THREE.MeshStandardMaterial).emissiveIntensity = 2 + pulse * 1.6;
    cage.rotation.y = elapsed * 0.25; // held spinning in the beam
    // Drones orbit the reactor, scanning inward.
    for (const drone of drones) {
      const a = elapsed * 0.4 + drone.phase;
      drone.group.position.set(Math.cos(a) * 6, 6.2, Math.sin(a) * 6);
      drone.scan.target.position.set(-Math.cos(a) * 3, -5, -Math.sin(a) * 3);
    }
    // Emergency beacon throbs; lever status blinks on lockdown cadence.
    beacon.intensity = 8 + Math.sin(elapsed * 4.4) * 6;
    if (!puzzleState.isSolved('grid.server')) {
      door.lockBar.visible = Math.sin(elapsed * 5) > -0.4;
    }
    (statusLights[1].material as THREE.MeshBasicMaterial).color.setHex(
      Math.sin(elapsed * 3) > 0 ? 0xffa427 : 0x223322,
    );
  };

  // ── Interactables ────────────────────────────────────────────────────────
  let anchorIndex = -1;
  const interactables: Interactable[] = [
    {
      object: chartsPlane,
      label: () => {
        if (!puzzleState.isAvailable('core.anchor'))
          return 'Dilation charts — «DATA SEALED UNTIL SECTOR BREACH»';
        if (puzzleState.isSolved('core.anchor'))
          return `Dilation charts — ANCHOR ${ANCHOR_CANDIDATES[TARGET_ANCHOR_INDEX]} locked. They also flag mirrors ${MIRROR_CALLOUT} — tell Alpha.`;
        return anchorIndex < 0
          ? 'Dilation charts — click to cycle anchor candidates. Cross-check Alpha’s whiteboard.'
          : `Dilation charts — candidate ${ANCHOR_CANDIDATES[anchorIndex]}. Click to cycle; Alpha’s whiteboard has the constant.`;
      },
      enabled: () => puzzleState.isAvailable('core.anchor') && !puzzleState.isSolved('core.anchor'),
      onInteract: () => {
        ensureAudio();
        anchorIndex = (anchorIndex + 1) % ANCHOR_CANDIDATES.length;
        charts.anchorCandidate = ANCHOR_CANDIDATES[anchorIndex];
        playBlip(560);
        if (anchorIndex === TARGET_ANCHOR_INDEX) {
          // Brief beat so the player sees the candidate land before the lock.
          setTimeout(() => {
            charts.anchorAccepted = true;
            puzzleState.solve('core.anchor');
            playSuccess();
          }, 500);
        }
      },
    },
    {
      object: termScreen,
      label: () => {
        if (!puzzleState.isAvailable('core.mirrors'))
          return 'Core Control Terminal — «ANCHOR CONSTANT REQUIRED»';
        if (puzzleState.isSolved('core.mirrors')) return 'Core Control Terminal — energy channelled. Ready for the merge.';
        return `Core Control Terminal — mirror telemetry: Alpha has ${session.describeMirrors()} aligned. The charts call for ${MIRROR_CALLOUT}.`;
      },
      enabled: () => puzzleState.isAvailable('core.mirrors'),
      onInteract: () => {
        ensureAudio();
        playBlip(620);
        say(
          puzzleState.isSolved('core.mirrors')
            ? 'Telemetry: beam channelled across the pit. Both levers are live.'
            : `Telemetry: mirrors aligned on Alpha’s side → ${session.describeMirrors()}. Call for ${MIRROR_CALLOUT}.`,
        );
      },
    },
    {
      object: lever,
      label: () => {
        if (puzzleState.isSolved('core.lever')) return 'The lever is down. The timelines are merging…';
        if (!puzzleState.isAvailable('core.lever'))
          return 'Manual lever — «INTERLOCK ENGAGED». The mirrors must channel first.';
        return session.leverPulled(DimensionId.Beta)
          ? 'LEVER PULLED — Alpha must pull NOW!'
          : 'Manual Lever — count Alpha down over voice: “3, 2, 1, PULL!”';
      },
      enabled: () =>
        puzzleState.isAvailable('core.lever') &&
        !puzzleState.isSolved('core.lever') &&
        !session.leverPulled(DimensionId.Beta),
      onInteract: () => {
        ensureAudio();
        playBlip(220);
        session.pullLever(DimensionId.Beta, performance.now() / 1000);
      },
    },
    {
      object: door.group,
      label: () =>
        puzzleState.isSolved('grid.server')
          ? 'Door R2 — lockdown lifted.'
          : 'Door R2 — LOCKDOWN. Sealed from the Grid side.',
      onInteract: () => {},
    },
  ];

  return { object: root, update, interactables };
}
