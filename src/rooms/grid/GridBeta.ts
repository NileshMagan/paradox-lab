import * as THREE from 'three';
import { slotLocal } from '@/config/facility';
import { chemScreenTexture, HoloScreen, rackTexture, steelTexture, streamFloorTextures } from '@/core/textures';
import { sciFiDoor, securityDrone } from '@/rooms/props';
import type { RoomDetail } from '@/rooms/types';
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
  for (const spec of beamSpecs) {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, beamLen / Math.cos(spec.tilt * 0.35), 6),
      spec.red ? laserMats.red : laserMats.blue,
    );
    beam.rotation.z = Math.PI / 2;
    beam.rotation.y = spec.tilt * 0.35; // slight yaw so beams criss-cross
    beam.position.set(0, spec.y, fieldPos.z + spec.z);
    lasers.add(beam);
    for (const side of [-1, 1]) {
      const emitter = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), emitterMat);
      emitter.position.set(
        side * (beamLen / 2) * Math.cos(spec.tilt * 0.35),
        spec.y,
        fieldPos.z + spec.z + side * (beamLen / 2) * Math.sin(spec.tilt * 0.35),
      );
      lasers.add(emitter);
    }
  }
  root.add(lasers);
  const laserGlow = new THREE.PointLight(RED, 6, 9, 2);
  laserGlow.position.set(0, 1.8, fieldPos.z);
  root.add(laserGlow);

  // ── Chemical analyzer kiosk (puzzle: grid.chemical) ─────────────────────
  const chemPos = slotLocal(RoomId.Grid, 'grid.analyzer');
  const chemBase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.5), black);
  chemBase.position.set(chemPos.x, 0.5, chemPos.z);
  chemBase.rotation.y = Math.PI / 2;
  const chemScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.8),
    new THREE.MeshBasicMaterial({ map: chemScreenTexture() }),
  );
  chemScreen.position.set(chemPos.x + 0.28, 1.35, chemPos.z);
  chemScreen.rotation.y = Math.PI / 2;
  chemScreen.rotation.x = -0.3;
  root.add(chemBase, chemScreen);

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
  const update = (_delta: number, elapsed: number): void => {
    holo.update(elapsed);
    // Lasers shimmer; the whole grid re-arms with a slow strobe.
    const strobe = 0.7 + Math.sin(elapsed * 2.2) * 0.15 + Math.sin(elapsed * 13) * 0.06;
    laserMats.red.opacity = strobe;
    laserMats.blue.opacity = 0.95 - strobe * 0.25;
    laserGlow.intensity = 4.5 + Math.sin(elapsed * 2.2) * 2;
    // Drones patrol their rails and sweep their scan cones.
    for (const drone of drones) {
      drone.group.position.z = Math.sin(elapsed * 0.35 + drone.phase) * (D / 2 - 2);
      drone.scan.target.position.x = Math.sin(elapsed * 1.7 + drone.phase) * 1.5 - drone.x;
      drone.scan.intensity = 10 + Math.sin(elapsed * 5 + drone.phase) * 5;
    }
    // Rack LEDs flicker faintly.
    rackLights[0].emissiveIntensity = 0.72 + Math.sin(elapsed * 9.3) * 0.1;
    // Lockdown bars blink out of phase.
    doorIn.lockBar.visible = Math.sin(elapsed * 5) > -0.4;
    doorOut.lockBar.visible = Math.sin(elapsed * 5 + 1.5) > -0.4;
  };

  return { object: root, update };
}
