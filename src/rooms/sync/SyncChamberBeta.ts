import * as THREE from 'three';
import { slotLocal } from '@/config/facility';
import { betaFloorTextures, HoloScreen, muralTexture, starmapTexture, steelTexture } from '@/core/textures';
import { sciFiDoor } from '@/rooms/props';
import type { RoomDetail } from '@/rooms/types';
import { RoomId } from '@/types';
import { buildOctagonShell } from './octagonShell';

const APOTHEM = 4;
const HEIGHT = 4;
const CYAN = 0x20d5ff;

/**
 * Room 1, Dimension Beta — "The Neon Future" Sync Chamber.
 * Matches docs/reference/r1-sync-beta.png: stark LED ceiling, glowing cyan
 * floor web, holographic audio analyzer, artifact pedestal (the mural's echo),
 * octagonal R2 door with red lockdown bar, amber emergency beacon.
 */
export function buildSyncChamberBeta(): RoomDetail {
  const root = new THREE.Group();
  root.name = 'sync-chamber-beta';

  // ── Shell ────────────────────────────────────────────────────────────────
  const steel = new THREE.MeshStandardMaterial({
    map: steelTexture(),
    roughness: 0.35,
    metalness: 0.85,
  });
  const [floorMap, floorGlow] = betaFloorTextures();
  const resin = new THREE.MeshStandardMaterial({
    map: floorMap,
    emissiveMap: floorGlow,
    emissive: 0xffffff,
    emissiveIntensity: 0.55,
    roughness: 0.12,
    metalness: 0.3,
  });
  root.add(
    buildOctagonShell({
      apothem: APOTHEM,
      height: HEIGHT,
      wallMaterial: steel,
      floorMaterial: resin,
      ceilingMaterial: steel,
    }),
  );

  // ── Wall dressing: black inset panels + cyan trim strips ────────────────
  const black = new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.4, metalness: 0.7 });
  const trimMat = new THREE.MeshBasicMaterial({ color: CYAN });
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const rotY = Math.atan2(dir.x, dir.z);
    // Matte black inset on alternating walls.
    if (k % 2 === 0) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.9, 0.06), black);
      panel.position.copy(dir).multiplyScalar(APOTHEM - 0.04);
      panel.position.y = 1.9;
      panel.rotation.y = rotY;
      root.add(panel);
    }
    // Two horizontal cyan light strips per wall.
    for (const y of [0.85, 3.15]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.05, 0.03), trimMat);
      strip.position.copy(dir).multiplyScalar(APOTHEM - 0.02);
      strip.position.y = y;
      strip.rotation.y = rotY;
      root.add(strip);
    }
  }

  // ── Ceiling LED panels (shadowless clinical light) ───────────────────────
  const led = new THREE.MeshBasicMaterial({ color: 0xf4f9ff });
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.6), led);
    panel.position.set(Math.cos(a) * 2.3, HEIGHT - 0.05, Math.sin(a) * 2.3);
    panel.rotation.y = -a + Math.PI / 2;
    panel.name = 'ceiling'; // LED panels hide with the ceiling in the overview
    root.add(panel);
  }
  const ceilingLight = new THREE.PointLight(0xf4f9ff, 40, 16, 1.7);
  ceilingLight.position.set(0, HEIGHT - 0.4, 0);
  root.add(ceilingLight);
  const floorBounce = new THREE.PointLight(CYAN, 6, 9, 2);
  floorBounce.position.set(0, 0.3, 0);
  root.add(floorBounce);

  // ── Holo audio analyzer (puzzle: sync.frequency) ─────────────────────────
  const panelPos = slotLocal(RoomId.SyncChamber, 'sync.leftPanel');
  const screenSlab = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 1.7, 2.7),
    new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 0.1, metalness: 0.9 }),
  );
  screenSlab.position.set(panelPos.x - 0.25, panelPos.y, panelPos.z);
  root.add(screenSlab);

  const holo = new HoloScreen();
  const holoPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 1.45),
    new THREE.MeshBasicMaterial({
      map: holo.texture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  holoPlane.position.set(panelPos.x + 0.25, panelPos.y, panelPos.z);
  holoPlane.rotation.y = Math.PI / 2;
  root.add(holoPlane);
  const holoLight = new THREE.PointLight(CYAN, 5, 5, 2);
  holoLight.position.set(panelPos.x + 0.6, panelPos.y, panelPos.z);
  root.add(holoLight);

  // Curved console desk in front of the analyzer.
  const deskTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.15, 0.07, 24, 1, false, -0.5, 2.1),
    new THREE.MeshStandardMaterial({
      color: 0x0b0f16,
      roughness: 0.15,
      metalness: 0.8,
      emissive: CYAN,
      emissiveIntensity: 0.25,
    }),
  );
  deskTop.position.set(panelPos.x + 1.5, 0.95, panelPos.z);
  deskTop.rotation.y = Math.PI; // opening faces the screen
  const deskBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.95, 0.7), black);
  deskBase.position.set(panelPos.x + 1.5, 0.47, panelPos.z);
  root.add(deskTop, deskBase);

  // ── Artifact pedestal (slot: sync.drip — the mural's holographic echo) ──
  const dripPos = slotLocal(RoomId.SyncChamber, 'sync.drip');
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.6), black);
  pedestal.position.set(dripPos.x, 0.5, dripPos.z);
  const pedestalTrim = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.04, 0.64), trimMat);
  pedestalTrim.position.set(dripPos.x, 1.0, dripPos.z);
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.72, 0.55),
    new THREE.MeshStandardMaterial({
      color: 0xdff4ff,
      transparent: true,
      opacity: 0.14,
      roughness: 0.05,
      metalness: 0.1,
    }),
  );
  glass.position.set(dripPos.x, 1.4, dripPos.z);
  // The golden mural hologram inside — literally Alpha's mural, miniaturised.
  // Two crossed discs so it never vanishes edge-on while it rotates.
  const artifactMat = new THREE.MeshBasicMaterial({
    map: muralTexture(),
    color: 0xffc36b,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const artifact = new THREE.Group();
  const discA = new THREE.Mesh(new THREE.CircleGeometry(0.22, 32), artifactMat);
  const discB = discA.clone();
  discB.rotation.y = Math.PI / 2;
  artifact.add(discA, discB);
  artifact.position.set(dripPos.x, 1.4, dripPos.z);
  const artifactLight = new THREE.PointLight(0xffb85c, 2.5, 3, 2);
  artifactLight.position.set(dripPos.x, 1.45, dripPos.z);
  root.add(pedestal, pedestalTrim, glass, artifact, artifactLight);

  // ── Star map console (puzzle: sync.starmap) ─────────────────────────────
  const gearsPos = slotLocal(RoomId.SyncChamber, 'sync.gears');
  const consoleBase = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 0.55), black);
  consoleBase.position.set(gearsPos.x, 0.45, gearsPos.z);
  consoleBase.rotation.y = -Math.PI / 2;
  const consoleScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.85),
    new THREE.MeshBasicMaterial({ map: starmapTexture() }),
  );
  consoleScreen.position.set(gearsPos.x - 0.29, 1.25, gearsPos.z);
  consoleScreen.rotation.y = -Math.PI / 2;
  consoleScreen.rotation.x = -0.35; // angled up toward the player
  root.add(consoleBase, consoleScreen);

  // ── Octagonal R2 door with lockdown bar (slot: sync.hatch) ───────────────
  const hatchPos = slotLocal(RoomId.SyncChamber, 'sync.hatch');
  const { group: doorGroup, lockBar } = sciFiDoor(steel, black, 'R2');
  doorGroup.position.set(hatchPos.x, 1.55, hatchPos.z + 0.18);
  root.add(doorGroup);

  // ── Amber emergency beacon (right wall) ─────────────────────────────────
  const beaconMount = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 0.3), black);
  beaconMount.position.set(APOTHEM - 0.15, 2.7, 1.6);
  const beaconLamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffa427 }),
  );
  beaconLamp.position.set(APOTHEM - 0.32, 2.7, 1.6);
  root.add(beaconMount, beaconLamp);
  const beaconPivot = new THREE.Group();
  beaconPivot.position.copy(beaconLamp.position);
  const beaconBeam = new THREE.SpotLight(0xffa427, 30, 12, 0.45, 0.7, 1.5);
  beaconBeam.target.position.set(-2, -1, 0);
  beaconPivot.add(beaconBeam, beaconBeam.target);
  root.add(beaconPivot);

  // ── Animation ────────────────────────────────────────────────────────────
  const holoMat = holoPlane.material as THREE.MeshBasicMaterial;
  const update = (_delta: number, elapsed: number): void => {
    holo.update(elapsed);
    // Holographic flicker.
    holoMat.opacity = 0.82 + Math.sin(elapsed * 17) * 0.05 + Math.sin(elapsed * 3.1) * 0.05;
    // Artifact slowly rotates in its case.
    artifact.rotation.y = elapsed * 0.6;
    // Lockdown bar blinks; beacon sweeps and pulses.
    lockBar.visible = Math.sin(elapsed * 5) > -0.4;
    beaconPivot.rotation.y = elapsed * 2.2;
    beaconBeam.intensity = 22 + Math.sin(elapsed * 4.4) * 10;
    // The floor web breathes faintly.
    resin.emissiveIntensity = 0.5 + Math.sin(elapsed * 1.4) * 0.12;
  };

  return { object: root, update };
}
