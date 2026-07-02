import * as THREE from 'three';
import { slotLocal } from '@/config/facility';
import { concreteTexture, whiteboardTexture } from '@/core/textures';
import { floraCluster, hangingCage, rustedDoor, vine } from '@/rooms/props';
import type { RoomDetail } from '@/rooms/types';
import { RoomId } from '@/types';
import { buildDomeShell } from './domeShell';

const R = 10;
const PIT_R = 2.6;
const OCULUS_R = 1.6;

/**
 * Room 3, Dimension Alpha — the ruined Paradox Core.
 * Matches docs/reference/r3-core-alpha.png: overgrown concrete dome with a
 * collapsed oculus, god-rays over a black-abyss reactor pit, the suspended
 * reactor cage, faded whiteboard equations, heavy mirrors on rusted tracks,
 * and the manual escape lever.
 */
export function buildCoreAlpha(): RoomDetail {
  const root = new THREE.Group();
  root.name = 'core-alpha';

  // ── Shell ────────────────────────────────────────────────────────────────
  const concrete = new THREE.MeshStandardMaterial({
    map: concreteTexture(),
    roughness: 0.96,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const mossFloor = new THREE.MeshStandardMaterial({
    map: concreteTexture(),
    color: 0x6c7258,
    roughness: 1,
  });
  const abyss = new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.9 });
  root.add(
    buildDomeShell({
      radius: R,
      pitRadius: PIT_R,
      wallMaterial: concrete,
      domeMaterial: concrete,
      floorMaterial: mossFloor,
      pitMaterial: abyss,
      oculusRadius: OCULUS_R,
      receiveShadow: true,
    }),
  );

  // ── Oculus: sky, god-ray shaft, sun ──────────────────────────────────────
  const sky = new THREE.Mesh(
    new THREE.CircleGeometry(OCULUS_R * 1.15, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff2cd }),
  );
  sky.rotation.x = Math.PI / 2;
  sky.position.y = Math.sqrt(R * R - OCULUS_R * OCULUS_R) + 0.15;
  sky.name = 'ceiling'; // hide with the dome cap in the admin overview
  root.add(sky);
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(OCULUS_R, OCULUS_R * 2.6, 9.6, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffdf9e,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  shaft.position.set(0.4, 5, -0.3);
  shaft.rotation.z = -0.05;
  root.add(shaft);
  const sun = new THREE.SpotLight(0xffd89b, 500, 40, 0.42, 0.55, 1.3);
  sun.position.set(2, 20, -1.5);
  sun.target.position.set(-0.5, 0, 0.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  root.add(sun, sun.target);
  root.add(new THREE.AmbientLight(0x3c422e, 0.7));
  root.add(new THREE.PointLight(0x8f7c52, 10, 22, 1.6));

  // ── The suspended reactor cage over the pit ──────────────────────────────
  const timber = new THREE.MeshStandardMaterial({ color: 0x3c3226, roughness: 0.95 });
  const { group: cage, crystal } = hangingCage(timber, 0x2ee6d6, 2.2);
  cage.position.set(0, 5.2, 0);
  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 3.6, 6),
    new THREE.MeshStandardMaterial({ color: 0x2a251d, roughness: 0.9 }),
  );
  cable.position.set(0, 8.1, 0);
  root.add(cage, cable);

  // Pit rim glow — bioluminescence creeping over the edge of the abyss.
  const rimLights: THREE.PointLight[] = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const glow = new THREE.PointLight(i % 2 ? 0xe344c4 : 0x2ee6d6, 2.5, 5, 2);
    glow.position.set(Math.cos(a) * (PIT_R + 0.4), 0.3, Math.sin(a) * (PIT_R + 0.4));
    root.add(glow);
    rimLights.push(glow);
  }

  // ── Whiteboards (puzzle: core.anchor) ────────────────────────────────────
  const eqPos = slotLocal(RoomId.ParadoxCore, 'core.equations');
  const boardFrame = new THREE.MeshStandardMaterial({ color: 0x4a4238, roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const board = new THREE.Group();
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 1.15),
      new THREE.MeshStandardMaterial({ map: whiteboardTexture(), roughness: 0.85 }),
    );
    face.position.y = 1.35;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.25, 0.06), boardFrame);
    frame.position.set(0, 1.35, -0.035);
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.55, 0.06), boardFrame);
      leg.position.set(side * 0.8, 0.78, -0.05);
      board.add(leg);
    }
    board.add(frame, face);
    board.position.set(eqPos.x + i * 1.6, 0, eqPos.z - i * 0.7);
    board.rotation.y = 0.9 - i * 0.35; // fanned around, facing the pit
    board.rotation.z = (i - 1) * 0.03; // slightly slumped
    root.add(board);
  }

  // ── Heavy mirrors on rusted tracks (puzzle: core.mirrors) ────────────────
  const mirrorsPos = slotLocal(RoomId.ParadoxCore, 'core.mirrors');
  const rust = new THREE.MeshStandardMaterial({ color: 0x7a4a26, roughness: 0.85, metalness: 0.45 });
  const rustDark = new THREE.MeshStandardMaterial({ color: 0x53331c, roughness: 0.9, metalness: 0.4 });
  const track = new THREE.Mesh(new THREE.BoxGeometry(7, 0.12, 0.55), rustDark);
  track.position.set(mirrorsPos.x + 1.5, 0.06, mirrorsPos.z);
  root.add(track);
  for (let i = 0; i < 2; i++) {
    const unit = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), rust);
    base.position.y = 0.35;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 8), rustDark);
    pillar.position.y = 0.9;
    const mirror = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 24),
      new THREE.MeshStandardMaterial({
        color: 0xbcc8c8,
        roughness: 0.08,
        metalness: 0.9,
        side: THREE.DoubleSide,
      }),
    );
    mirror.position.y = 1.45;
    mirror.rotation.set(-0.5, 0.6 + i * 0.8, 0);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 8, 24), rustDark);
    rim.position.copy(mirror.position);
    rim.rotation.copy(mirror.rotation);
    unit.add(base, pillar, mirror, rim);
    unit.position.set(mirrorsPos.x + i * 2.6, 0, mirrorsPos.z);
    unit.castShadow = true;
    root.add(unit);
  }

  // ── Manual lever (puzzle: core.lever) ────────────────────────────────────
  const leverPos = slotLocal(RoomId.ParadoxCore, 'core.lever');
  const lever = new THREE.Group();
  const leverBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.5, 10), rustDark);
  leverBase.position.y = 0.25;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.1, 0.09), rust);
  arm.position.set(0, 0.9, 0.18);
  arm.rotation.x = 0.5; // cocked back, waiting for the "3, 2, 1, pull!"
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x8a2f24, roughness: 0.6 }),
  );
  knob.position.set(0, 1.4, 0.45);
  lever.add(leverBase, arm, knob);
  lever.position.set(leverPos.x, 0, leverPos.z);
  root.add(lever);

  // ── Wrecked console arc + organic dressing ───────────────────────────────
  const consoleMat = new THREE.MeshStandardMaterial({ color: 0x37342c, roughness: 0.9, metalness: 0.3 });
  for (let i = 0; i < 4; i++) {
    const a = Math.PI * 0.75 + i * 0.35;
    const consoleUnit = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.85, 0.6), consoleMat);
    body.position.y = 0.42;
    const slope = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.5), rustDark);
    slope.position.set(0, 0.9, 0.1);
    slope.rotation.x = -0.5;
    consoleUnit.add(body, slope);
    consoleUnit.position.set(Math.cos(a) * (PIT_R + 1.7), 0, -Math.abs(Math.sin(a)) * (PIT_R + 1.7));
    consoleUnit.lookAt(0, 0.4, 0);
    consoleUnit.rotation.z = (Math.random() - 0.5) * 0.06;
    root.add(consoleUnit);
  }
  const ivyMat = new THREE.MeshStandardMaterial({ color: 0x2a4a26, roughness: 0.95 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.2;
    const from = new THREE.Vector3(Math.cos(a) * OCULUS_R * 1.2, 9.4, Math.sin(a) * OCULUS_R * 1.2);
    const to = new THREE.Vector3(Math.cos(a) * 6, 5.4 - Math.random() * 1.6, Math.sin(a) * 6);
    root.add(vine(from, to, ivyMat));
  }
  const floraLights: THREE.PointLight[] = [];
  const floraPhases: number[] = [];
  [
    { x: -7.5, z: 3.5, color: 0x2ee6d6, s: 1.4 },
    { x: 7.2, z: 4.2, color: 0xe344c4, s: 1.2 },
    { x: -6.8, z: -4.5, color: 0x39f0a0, s: 1.1 },
    { x: 6.5, z: -5.2, color: 0x2ee6d6, s: 1.3 },
    { x: 0.5, z: 7.8, color: 0xe344c4, s: 1.0 },
  ].forEach((spot, i) => {
    const { group, light } = floraCluster(spot.color, spot.s);
    group.position.set(spot.x, 0, spot.z);
    root.add(group);
    floraLights.push(light);
    floraPhases.push(i * 1.6);
  });
  const rubbleMat = new THREE.MeshStandardMaterial({ color: 0x4d5148, roughness: 1 });
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2;
    const dist = PIT_R + 1 + Math.random() * (R - PIT_R - 2);
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.12 + Math.random() * 0.3, 0),
      rubbleMat,
    );
    rock.position.set(Math.cos(a) * dist, 0.1, Math.sin(a) * dist);
    rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    rock.castShadow = true;
    root.add(rock);
  }
  const door = rustedDoor(rust, rustDark).group;
  door.position.set(0, 0, 9.55);
  door.rotation.y = Math.PI;
  root.add(door);

  // ── Dust in the god-rays ─────────────────────────────────────────────────
  const DUST = 320;
  const dustPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    const rr = Math.random() * 2.6;
    const a = Math.random() * Math.PI * 2;
    dustPos[i * 3] = 0.4 + Math.cos(a) * rr;
    dustPos[i * 3 + 1] = Math.random() * 9;
    dustPos[i * 3 + 2] = -0.3 + Math.sin(a) * rr;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: 0xffe6b0,
      size: 0.025,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  root.add(dust);

  const update = (delta: number, elapsed: number): void => {
    floraLights.forEach((light, i) => {
      light.intensity = 2.0 + Math.sin(elapsed * 1.05 + floraPhases[i]) * 1.1;
    });
    rimLights.forEach((light, i) => {
      light.intensity = 2.2 + Math.sin(elapsed * 0.9 + i * 1.7) * 1.0;
    });
    // The dormant crystal barely breathes.
    (crystal.material as THREE.MeshStandardMaterial).emissiveIntensity =
      1.6 + Math.sin(elapsed * 0.7) * 0.7;
    cage.rotation.y = Math.sin(elapsed * 0.18) * 0.12; // slow sway on its cable
    const pos = dustGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < DUST; i++) {
      let y = pos.getY(i) + delta * 0.05;
      if (y > 9) y = 0;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  };

  return { object: root, update };
}
