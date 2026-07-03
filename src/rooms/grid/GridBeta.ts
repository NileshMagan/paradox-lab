import * as THREE from 'three';
import { slotLocal } from '@/config/facility';
import {
  BLOOM_SAFE_PATH,
  CHEM_COMPOUNDS,
  HACK_DURATION,
  TARGET_COMPOUND_INDEX,
  VALVE_COUNT,
} from '@/config/puzzles';
import { ensureAudio, playBlip, playSuccess } from '@/core/audio';
import { chemScreenTexture, HoloScreen, rackTexture, steelTexture, streamFloorTextures } from '@/core/textures';
import { sciFiDoor, securityDrone } from '@/rooms/props';
import type { Interactable, RoomDetail } from '@/rooms/types';
import { session } from '@/systems/puzzle/session';
import { puzzleState } from '@/systems/puzzle/state';
import { RoomId } from '@/types';
import { buildCorridorShell } from './corridorShell';

const W = 6;
const H = 4;
const D = 18;
const CYAN = 0x20d5ff;
const RED = 0xff2b3a;

/**
 * Room 2, Dimension Beta — "The Server Grid".
 * Matches docs/reference/r2-grid-beta.png: pristine steel corridor blocked by
 * a crimson/blue laser-grid maze, server racks with blinking LEDs, chemical
 * analyzer kiosk, ceiling-track security drones, fibre-optic floor streams.
 */
export function buildGridBeta(): RoomDetail {
  const root = new THREE.Group();
  root.name = 'grid-beta';

  // ── Shell ────────────────────────────────────────────────────────────────
  const steel = new THREE.MeshStandardMaterial({
    map: steelTexture(),
    roughness: 0.35,
    metalness: 0.85,
  });
  const [floorMap, floorGlow] = streamFloorTextures();
  const resin = new THREE.MeshStandardMaterial({
    map: floorMap,
    emissiveMap: floorGlow,
    emissive: 0xffffff,
    emissiveIntensity: 0.5,
    roughness: 0.12,
    metalness: 0.3,
  });
  root.add(
    buildCorridorShell({
      width: W,
      height: H,
      depth: D,
      wallMaterial: steel,
      floorMaterial: resin,
      roof: { style: 'flat', material: steel },
    }),
  );

  // ── Lighting: LED strips down the ceiling + cool fill ────────────────────
  const led = new THREE.MeshBasicMaterial({ color: 0xf4f9ff });
  for (let i = 0; i < 6; i++) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.5), led);
    panel.position.set(0, H - 0.06, -7.5 + i * 3);
    panel.name = 'ceiling'; // LED panels hide with the ceiling in the overview
    root.add(panel);
  }
  for (const z of [-5, 0, 5]) {
    const fill = new THREE.PointLight(0xf4f9ff, 22, 12, 1.8);
    fill.position.set(0, H - 0.5, z);
    root.add(fill);
  }
  const trimMat = new THREE.MeshBasicMaterial({ color: CYAN });
  for (const side of [-1, 1]) {
    for (const y of [0.5, 3.4]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, D - 0.4), trimMat);
      strip.position.set(side * (W / 2 - 0.02), y, 0);
      root.add(strip);
    }
  }

  // ── Server racks (left wall) + hack point (puzzle: grid.server) ─────────
  const black = new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.4, metalness: 0.7 });
  const rackFace = new THREE.MeshStandardMaterial({
    map: rackTexture(),
    emissiveMap: rackTexture(),
    emissive: 0xffffff,
    emissiveIntensity: 0.8,
    roughness: 0.5,
  });
  const rackLights: THREE.MeshStandardMaterial[] = [rackFace];
  for (let i = 0; i < 5; i++) {
    const rack = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.2, 0.85), black);
    rack.position.set(-W / 2 + 0.6, 1.1, 6.5 - i * 2.2);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 2.0), rackFace);
    face.position.set(-W / 2 + 1.04, 1.1, 6.5 - i * 2.2);
    face.rotation.y = Math.PI / 2;
    root.add(rack, face);
  }
  // The hack terminal at the machinery slot, with a live holo screen.
  const hackPos = slotLocal(RoomId.Grid, 'grid.machinery');
  const holo = new HoloScreen();
  holo.status = 'ICE FIREWALL v9';
  holo.subStatus = 'AWAITING PHYSICAL ACCESS';
  const hackKiosk = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.6), black);
  hackKiosk.position.set(hackPos.x, 0.55, hackPos.z);
  const hackScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 0.75),
    new THREE.MeshBasicMaterial({
      map: holo.texture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  hackScreen.position.set(hackPos.x + 0.35, 1.5, hackPos.z);
  hackScreen.rotation.y = Math.PI / 2;
  root.add(hackKiosk, hackScreen);

  // ── Laser grid maze (puzzle: grid.bloom) ─────────────────────────────────
  const fieldPos = slotLocal(RoomId.Grid, 'grid.field');
  const lasers = new THREE.Group();
  const laserMats = {
    red: new THREE.MeshBasicMaterial({
      color: RED,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    blue: new THREE.MeshBasicMaterial({
      color: CYAN,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  };
  const emitterMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  // Beams span the corridor at staggered heights/angles through the field zone.
  const beamSpecs: Array<{ y: number; z: number; tilt: number; red: boolean }> = [
    { y: 0.4, z: -4.5, tilt: 0, red: true },
    { y: 1.7, z: -4.0, tilt: 0.5, red: false },
    { y: 2.9, z: -3.2, tilt: -0.3, red: true },
    { y: 0.8, z: -2.2, tilt: 0.7, red: false },
    { y: 2.2, z: -1.4, tilt: 0, red: true },
    { y: 1.1, z: -0.4, tilt: -0.6, red: false },
    { y: 3.1, z: 0.4, tilt: 0.4, red: true },
    { y: 0.5, z: 1.3, tilt: 0, red: false },
    { y: 1.9, z: 2.2, tilt: -0.5, red: true },
    { y: 2.8, z: 3.1, tilt: 0.3, red: false },
    { y: 0.9, z: 4.0, tilt: 0, red: true },
    { y: 2.4, z: 4.8, tilt: -0.4, red: false },
  ];
  const beamLen = W - 0.4;
  // Beta crosses from the R1 end (+z) toward R3 (-z), so zones count down in
  // z: zone 0 is the first belt of beams Beta meets.
  const beamZone = (z: number): number => (z > 1.5 ? 0 : z > -1.5 ? 1 : 2);
  type BeamRecord = { group: THREE.Group; mat: THREE.MeshBasicMaterial; red: boolean; zone: number };
  const beams: BeamRecord[] = [];
  for (const spec of beamSpecs) {
    // Each beam gets its own material clone so zones can dim independently.
    const mat = (spec.red ? laserMats.red : laserMats.blue).clone();
    const beamGroup = new THREE.Group();
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, beamLen / Math.cos(spec.tilt * 0.35), 6),
      mat,
    );
    beam.rotation.z = Math.PI / 2;
    beam.rotation.y = spec.tilt * 0.35; // slight yaw so beams criss-cross
    beam.position.set(0, spec.y, fieldPos.z + spec.z);
    beamGroup.add(beam);
    for (const side of [-1, 1]) {
      const emitter = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), emitterMat);
      emitter.position.set(
        side * (beamLen / 2) * Math.cos(spec.tilt * 0.35),
        spec.y,
        fieldPos.z + spec.z + side * (beamLen / 2) * Math.sin(spec.tilt * 0.35),
      );
      beamGroup.add(emitter);
    }
    lasers.add(beamGroup);
    beams.push({ group: beamGroup, mat, red: spec.red, zone: beamZone(spec.z) });
  }
  root.add(lasers);
  // Barely-visible containment field around the maze — gives the pointer a
  // solid raycast target (the thin beams are near-impossible to hover).
  const laserField = new THREE.Mesh(
    new THREE.BoxGeometry(beamLen, H - 0.6, 11),
    new THREE.MeshBasicMaterial({
      color: CYAN,
      transparent: true,
      opacity: 0.025,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  laserField.position.set(0, H / 2 - 0.1, fieldPos.z);
  root.add(laserField);
  const laserGlow = new THREE.PointLight(RED, 6, 9, 2);
  laserGlow.position.set(0, 1.8, fieldPos.z);
  root.add(laserGlow);

  // ── Chemical analyzer kiosk (puzzle: grid.chemical) ─────────────────────
  const chemPos = slotLocal(RoomId.Grid, 'grid.analyzer');
  const chemBase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.5), black);
  chemBase.position.set(chemPos.x, 0.5, chemPos.z);
  chemBase.rotation.y = Math.PI / 2;
  const chemMat = new THREE.MeshBasicMaterial({ map: chemScreenTexture() });
  const chemScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), chemMat);
  chemScreen.position.set(chemPos.x + 0.28, 1.35, chemPos.z);
  chemScreen.rotation.y = Math.PI / 2;
  chemScreen.rotation.x = -0.3;
  root.add(chemBase, chemScreen);
  // Cycling compounds redraws the kiosk screen (dispose the stale texture —
  // CanvasTextures hold GPU memory).
  let chemIndex = -1;
  const setChemScreen = (candidate: string | null, confirmed: boolean): void => {
    chemMat.map?.dispose();
    chemMat.map = chemScreenTexture({ candidate, confirmed });
    chemMat.needsUpdate = true;
  };

  // ── Ceiling-track security drones ────────────────────────────────────────
  const railMat = new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.5, metalness: 0.8 });
  for (const x of [-1.5, 1.5]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, D - 1), railMat);
    rail.position.set(x, H - 0.18, 0);
    root.add(rail);
  }
  const drones = [-1.5, 1.5].map((x, i) => {
    const { group, scan } = securityDrone(black);
    group.position.set(x, H - 0.35, i === 0 ? -3 : 4);
    root.add(group);
    return { group, scan, phase: i * Math.PI, x };
  });

  // ── Doors at both ends ──────────────────────────────────────────────────
  const doorIn = sciFiDoor(steel, black, 'R1');
  doorIn.group.position.set(0, 1.55, D / 2 - 0.12);
  doorIn.group.rotation.y = Math.PI;
  const doorOut = sciFiDoor(steel, black, 'R3');
  doorOut.group.position.set(0, 1.55, -D / 2 + 0.12);
  root.add(doorIn.group, doorOut.group);

  // ── Animation ────────────────────────────────────────────────────────────
  let hackStart: number | null = null;
  let hackDone = false;
  let now = 0;
  let doorInProgress = 0;
  let doorOutProgress = 0;
  const doorInBar = doorIn.lockBar.material as THREE.MeshBasicMaterial;
  const doorOutBar = doorOut.lockBar.material as THREE.MeshBasicMaterial;
  const update = (delta: number, elapsed: number): void => {
    now = elapsed;
    holo.update(elapsed);
    // Lasers shimmer; emission colour follows Beta's spectrum shift, cleared
    // zones stay dark, and the whole grid dies once the maze is beaten.
    const strobe = 0.7 + Math.sin(elapsed * 2.2) * 0.15 + Math.sin(elapsed * 13) * 0.06;
    const mazeDown = puzzleState.isSolved('grid.bloom');
    const emittingRed = session.laserColor === 'crimson';
    for (const beam of beams) {
      if (mazeDown || beam.zone < session.bloomZone) {
        beam.group.visible = false;
        continue;
      }
      beam.group.visible = true;
      // The emitted colour is hot; the other spectrum idles at a whisper.
      const hot = beam.red === emittingRed;
      beam.mat.opacity = hot ? strobe : 0.12;
    }
    laserGlow.color.setHex(mazeDown ? 0x1a2a2a : emittingRed ? RED : CYAN);
    laserGlow.intensity = mazeDown ? 0.5 : 4.5 + Math.sin(elapsed * 2.2) * 2;
    // The hack runs in real time on the kiosk holo.
    if (hackStart !== null && !hackDone) {
      const progress = Math.min(1, (elapsed - hackStart) / HACK_DURATION);
      holo.status = `BREACHING… ${Math.round(progress * 100)}%`;
      holo.subStatus = 'ICE COUNTERMEASURES SUPPRESSED';
      if (progress >= 1) {
        hackDone = true;
        holo.status = 'ROOT ACCESS ✓';
        holo.subStatus = 'R3 LOCKDOWN LIFTED';
        puzzleState.solve('grid.server');
        playSuccess();
      }
    }
    // Drones patrol their rails and sweep their scan cones.
    for (const drone of drones) {
      drone.group.position.z = Math.sin(elapsed * 0.35 + drone.phase) * (D / 2 - 2);
      drone.scan.target.position.x = Math.sin(elapsed * 1.7 + drone.phase) * 1.5 - drone.x;
      drone.scan.intensity = 10 + Math.sin(elapsed * 5 + drone.phase) * 5;
    }
    // Rack LEDs flicker faintly.
    rackLights[0].emissiveIntensity = 0.72 + Math.sin(elapsed * 9.3) * 0.1;
    // Lockdown bars: blink red while sealed, solid green + leaf slides open.
    if (puzzleState.isSolved('sync.starmap')) {
      doorIn.lockBar.visible = true;
      doorInBar.color.setHex(0x39f0a0);
      if (doorInProgress < 1) {
        doorInProgress = Math.min(1, doorInProgress + delta / 2);
        doorIn.leaf.position.y = doorInProgress * 2.4;
      }
    } else {
      doorIn.lockBar.visible = Math.sin(elapsed * 5) > -0.4;
    }
    if (puzzleState.isSolved('grid.server')) {
      doorOut.lockBar.visible = true;
      doorOutBar.color.setHex(0x39f0a0);
      if (doorOutProgress < 1) {
        doorOutProgress = Math.min(1, doorOutProgress + delta / 2);
        doorOut.leaf.position.y = doorOutProgress * 2.4;
      }
    } else {
      doorOut.lockBar.visible = Math.sin(elapsed * 5 + 1.5) > -0.4;
    }
  };

  // ── Interactables ────────────────────────────────────────────────────────
  const say = (text: string): void => {
    window.dispatchEvent(new CustomEvent('game:toast', { detail: text }));
  };
  const interactables: Interactable[] = [
    {
      object: chemScreen,
      label: () => {
        if (!puzzleState.isAvailable('grid.chemical'))
          return 'Chemical Analyzer — OFFLINE. «CALIBRATE THE DIMENSIONAL LINK FIRST»';
        if (puzzleState.isSolved('grid.chemical'))
          return `Chemical Analyzer — base code ${CHEM_COMPOUNDS[TARGET_COMPOUND_INDEX]} locked in.`;
        return chemIndex < 0
          ? 'Chemical Analyzer — click to cycle compounds. Ask Alpha what the soil strips say.'
          : `Chemical Analyzer — candidate: ${CHEM_COMPOUNDS[chemIndex]}. Click to cycle; match Alpha’s readings.`;
      },
      enabled: () => puzzleState.isAvailable('grid.chemical') && !puzzleState.isSolved('grid.chemical'),
      onInteract: () => {
        ensureAudio();
        chemIndex = (chemIndex + 1) % CHEM_COMPOUNDS.length;
        playBlip(520);
        if (chemIndex === TARGET_COMPOUND_INDEX) {
          setChemScreen(CHEM_COMPOUNDS[chemIndex], true);
          // Brief beat so the player sees the candidate land before the lock.
          setTimeout(() => {
            puzzleState.solve('grid.chemical');
            playSuccess();
          }, 500);
        } else {
          setChemScreen(CHEM_COMPOUNDS[chemIndex], false);
        }
      },
    },
    {
      object: laserField,
      label: () => {
        if (puzzleState.isSolved('grid.bloom')) return 'Laser grid — dark. The path is clear.';
        if (!puzzleState.isAvailable('grid.bloom'))
          return 'Laser Grid Maze — LETHAL. Spectrum controls need the analyzer’s base code.';
        return `Laser grid — emitting ${session.laserColor.toUpperCase()} · zone ${session.bloomZone + 1}/${BLOOM_SAFE_PATH.length}. Click to shift the spectrum; Alpha’s flora reacts.`;
      },
      enabled: () => puzzleState.isAvailable('grid.bloom') && !puzzleState.isSolved('grid.bloom'),
      onInteract: () => {
        ensureAudio();
        session.laserColor = session.laserColor === 'crimson' ? 'blue' : 'crimson';
        playBlip(session.laserColor === 'crimson' ? 392 : 660);
        say(`Spectrum shifted to ${session.laserColor.toUpperCase()} — ask Alpha what the flora does.`);
      },
    },
    {
      object: hackScreen,
      label: () => {
        if (puzzleState.isSolved('grid.server')) return 'Server rack — ROOT ACCESS. R3 is open.';
        if (!puzzleState.isAvailable('grid.server'))
          return 'Server rack — unreachable behind the laser maze.';
        if (!session.allValvesOpen)
          return `Server rack — CPUs at 97°C, hack would abort. Alpha’s coolant valves: ${session.valvesOpen}/${VALVE_COUNT} open.`;
        return hackStart === null
          ? 'Server rack — coolant flowing, cores cold. Click to run the hack.'
          : 'Server rack — BREACH IN PROGRESS…';
      },
      enabled: () =>
        puzzleState.isAvailable('grid.server') &&
        session.allValvesOpen &&
        !puzzleState.isSolved('grid.server') &&
        hackStart === null,
      onInteract: () => {
        ensureAudio();
        hackStart = now;
        playBlip(740);
        say('Hack running — ICE suppression holding…');
      },
    },
    {
      object: doorOut.group,
      label: () =>
        puzzleState.isSolved('grid.server')
          ? 'Door R3 — lockdown lifted.'
          : 'Door R3 — LOCKDOWN. The server hack controls it.',
      onInteract: () => {
        if (!puzzleState.isSolved('grid.server')) say('«ACCESS DENIED — SERVER AUTHORITY REQUIRED»');
      },
    },
  ];

  return { object: root, update, interactables };
}
