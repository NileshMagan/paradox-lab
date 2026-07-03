import * as THREE from 'three';
import { slotLocal } from '@/config/facility';
import { DRIP_LOOP, DRIP_PATTERN, TARGET_GLYPH_INDEX, ZODIAC } from '@/config/puzzles';
import { ensureAudio, playBlip, playDrip, playSuccess } from '@/core/audio';
import { concreteTexture, muralTexture } from '@/core/textures';
import { floraCluster, rustedDoor, vine } from '@/rooms/props';
import type { Interactable, RoomDetail } from '@/rooms/types';
import { puzzleState } from '@/systems/puzzle/state';
import { RoomId } from '@/types';
import { buildOctagonShell } from './octagonShell';

const APOTHEM = 4;
const HEIGHT = 4;
const SKYLIGHT_R = 1.25;

/** A toothed gear silhouette for the rusted mural mechanism. */
function gearShape(outerR: number, innerR: number, teeth: number): THREE.Shape {
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const pts: Array<[number, number]> = [
      [a0 + step * 0.4, outerR],
      [a0 + step * 0.5, innerR],
      [a0 + step * 0.9, innerR],
      [(i + 1) * step, outerR],
    ];
    if (i === 0) shape.moveTo(Math.cos(a0) * outerR, Math.sin(a0) * outerR);
    for (const [a, r] of pts) shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const hub = new THREE.Path();
  hub.absarc(0, 0, innerR * 0.35, 0, Math.PI * 2, true);
  shape.holes.push(hub);
  return shape;
}

/**
 * Room 1, Dimension Alpha — "The Overgrown Past" Sync Chamber.
 * Matches docs/reference/r1-sync-alpha.png: golden god-rays through a cracked
 * skylight, carved zodiac mural, rusted gears, drip-and-bucket, bioluminescent
 * flora, ivy, rubble, stagnant puddles.
 */
export function buildSyncChamberAlpha(): RoomDetail {
  const root = new THREE.Group();
  root.name = 'sync-chamber-alpha';

  // ── Shell ────────────────────────────────────────────────────────────────
  const concrete = new THREE.MeshStandardMaterial({
    map: concreteTexture(),
    roughness: 0.96,
    metalness: 0.02,
  });
  const dirtFloor = new THREE.MeshStandardMaterial({
    map: concreteTexture(),
    color: 0x8a8676, // tints the concrete toward dry dirt
    roughness: 1,
  });
  root.add(
    buildOctagonShell({
      apothem: APOTHEM,
      height: HEIGHT,
      wallMaterial: concrete,
      floorMaterial: dirtFloor,
      ceilingMaterial: concrete,
      skylightRadius: SKYLIGHT_R,
      receiveShadow: true,
    }),
  );

  // ── Skylight: sky disc, god-ray shaft, sunbeam spotlight ────────────────
  const sky = new THREE.Mesh(
    new THREE.CircleGeometry(SKYLIGHT_R * 1.05, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff2cd }),
  );
  sky.rotation.x = Math.PI / 2;
  sky.position.y = HEIGHT + 0.28;
  sky.name = 'ceiling'; // hide with the ceiling in the admin overview
  root.add(sky);

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(SKYLIGHT_R * 0.95, SKYLIGHT_R * 1.9, HEIGHT + 0.4, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffdf9e,
      transparent: true,
      opacity: 0.075,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  shaft.position.set(0.35, HEIGHT / 2, -0.2); // slight lean, like the reference
  shaft.rotation.z = -0.06;
  root.add(shaft);

  const sun = new THREE.SpotLight(0xffd89b, 140, 20, 0.55, 0.55, 1.4);
  sun.position.set(1.6, 9.5, -0.8);
  sun.target.position.set(-0.4, 0, 0.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  root.add(sun, sun.target);

  // Gentle warm fill so shadowed corners aren't pitch black.
  root.add(new THREE.PointLight(0x8f7c52, 4, 12, 1.6));

  // ── Dust motes drifting in the shaft ─────────────────────────────────────
  const DUST_COUNT = 220;
  const dustPos = new Float32Array(DUST_COUNT * 3);
  const dustPhase = new Float32Array(DUST_COUNT);
  for (let i = 0; i < DUST_COUNT; i++) {
    const r = Math.random() * 1.7;
    const a = Math.random() * Math.PI * 2;
    dustPos[i * 3] = 0.35 + Math.cos(a) * r;
    dustPos[i * 3 + 1] = Math.random() * HEIGHT;
    dustPos[i * 3 + 2] = -0.2 + Math.sin(a) * r;
    dustPhase[i] = Math.random() * Math.PI * 2;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: 0xffe6b0,
      size: 0.02,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  root.add(dust);

  // ── Stone mural (puzzle: sync.frequency) ─────────────────────────────────
  const muralPos = slotLocal(RoomId.SyncChamber, 'sync.leftPanel');
  const mural = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 1.45, 0.16, 40),
    new THREE.MeshStandardMaterial({ map: muralTexture(), roughness: 0.9 }),
  );
  disc.rotation.z = Math.PI / 2; // face +x, into the room
  disc.castShadow = true;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.45, 0.08, 10, 40),
    new THREE.MeshStandardMaterial({ color: 0x5b5443, roughness: 0.95 }),
  );
  rim.rotation.y = Math.PI / 2;
  // Pointer notch at the top of the ring — the glyph beneath it is "selected".
  const notch = new THREE.Mesh(
    new THREE.ConeGeometry(0.09, 0.22, 4),
    new THREE.MeshStandardMaterial({
      color: 0x6b4a26,
      emissive: 0xffb85c,
      emissiveIntensity: 0.6,
    }),
  );
  notch.position.set(0.12, 1.62, 0);
  notch.rotation.z = Math.PI; // point down at the ring
  mural.add(disc, rim, notch);
  mural.position.set(muralPos.x, muralPos.y, muralPos.z);
  root.add(mural);
  // Mural ring state (puzzle: sync.starmap). Each click advances one glyph;
  // the disc spins to match. Index 0 (♈) starts under the notch.
  let muralIndex = 0;
  let muralTargetRot = 0;
  // Faint cyan spill from flora onto the mural (her flashlight in the art).
  const muralGlow = new THREE.PointLight(0xbfd9c8, 3, 4, 1.8);
  muralGlow.position.set(muralPos.x + 1.4, muralPos.y, muralPos.z);
  root.add(muralGlow);

  // ── Rusted gears (puzzle: sync.starmap) ──────────────────────────────────
  const gearsPos = slotLocal(RoomId.SyncChamber, 'sync.gears');
  const rust = new THREE.MeshStandardMaterial({ color: 0x7a4a26, roughness: 0.85, metalness: 0.45 });
  const rustDark = new THREE.MeshStandardMaterial({ color: 0x53331c, roughness: 0.9, metalness: 0.4 });
  const gears = new THREE.Group();
  const gearSpecs: Array<{ r: number; lean: number; x: number; z: number; mat: THREE.Material }> = [
    { r: 0.85, lean: 0.18, x: 0, z: 0, mat: rust },
    { r: 0.55, lean: -0.12, x: -0.75, z: 0.35, mat: rustDark },
    { r: 0.4, lean: 1.45, x: 0.55, z: 0.55, mat: rustDark }, // fallen flat
  ];
  for (const spec of gearSpecs) {
    const gear = new THREE.Mesh(
      new THREE.ExtrudeGeometry(gearShape(spec.r, spec.r * 0.78, 12), {
        depth: 0.12,
        bevelEnabled: false,
      }),
      spec.mat,
    );
    gear.position.set(spec.x, spec.r + 0.02, spec.z);
    gear.rotation.x = spec.lean;
    gear.castShadow = true;
    gears.add(gear);
  }
  gears.position.set(gearsPos.x, gearsPos.y, gearsPos.z);
  gears.rotation.y = 0.5;
  root.add(gears);

  // ── Drip + bucket (puzzle: sync.frequency) ──────────────────────────────
  const dripPos = slotLocal(RoomId.SyncChamber, 'sync.drip');
  const bucket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.13, 0.3, 14, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x5f6668,
      roughness: 0.5,
      metalness: 0.8,
      side: THREE.DoubleSide,
    }),
  );
  bucket.position.set(dripPos.x, 0.15, dripPos.z);
  bucket.castShadow = true;
  root.add(bucket);
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(0.15, 14),
    new THREE.MeshStandardMaterial({ color: 0x24343a, roughness: 0.05, metalness: 0.6 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(dripPos.x, 0.24, dripPos.z);
  root.add(water);
  // The drip IS the puzzle: drops land exactly on the DRIP_PATTERN beats.
  // Landing times within each loop, from the cumulative pattern gaps.
  const DROP_TOP = HEIGHT - 0.2;
  const DROP_BOTTOM = 0.26;
  const FALL_TIME = (DROP_TOP - DROP_BOTTOM) / 3.4;
  const landTimes: number[] = [];
  let acc = 0;
  for (const gap of DRIP_PATTERN) {
    landTimes.push(acc);
    acc += gap;
  }
  const dropMat = new THREE.MeshBasicMaterial({ color: 0xcfe8f0, transparent: true, opacity: 0.8 });
  const drops = landTimes.map((land) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 5), dropMat);
    mesh.visible = false;
    mesh.position.set(dripPos.x, DROP_TOP, dripPos.z);
    root.add(mesh);
    return { mesh, land, falling: false };
  });
  // Drip AUDIO is off until the player clicks the bucket to listen — otherwise
  // the rhythm loops non-stop and grates. The visual drops always fall.
  let listening = false;

  // ── Rusted hatch door (slot: sync.hatch) ─────────────────────────────────
  const hatchPos = slotLocal(RoomId.SyncChamber, 'sync.hatch');
  const hatch = rustedDoor(rust, rustDark);
  hatch.group.position.set(hatchPos.x, hatchPos.y, hatchPos.z + 0.15);
  root.add(hatch.group);
  let doorProgress = 0; // 0 sealed → 1 open, driven once sync.starmap solves

  // ── Bioluminescent flora clusters ────────────────────────────────────────
  const floraSpots: Array<{ x: number; z: number; color: number; s: number }> = [
    { x: -3.1, z: 2.3, color: 0x2ee6d6, s: 1.3 },
    { x: 3.1, z: 2.0, color: 0xe344c4, s: 1.1 },
    { x: -2.9, z: -2.5, color: 0x39f0a0, s: 0.9 },
    { x: 3.0, z: -2.3, color: 0x2ee6d6, s: 1.0 },
    { x: 1.6, z: 3.1, color: 0xe344c4, s: 0.8 },
    { x: -1.2, z: 3.2, color: 0x39f0a0, s: 0.7 },
  ];
  const floraLights: THREE.PointLight[] = [];
  const floraPhases: number[] = [];
  floraSpots.forEach((spot, i) => {
    const { group, light } = floraCluster(spot.color, spot.s);
    group.position.set(spot.x, 0, spot.z);
    root.add(group);
    floraLights.push(light);
    floraPhases.push(i * 1.7);
  });

  // ── Ivy + moss dressing ──────────────────────────────────────────────────
  const ivyMat = new THREE.MeshStandardMaterial({ color: 0x2a4a26, roughness: 0.95 });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.4;
    const from = new THREE.Vector3(Math.cos(a) * SKYLIGHT_R * 1.1, HEIGHT + 0.05, Math.sin(a) * SKYLIGHT_R * 1.1);
    const to = new THREE.Vector3(Math.cos(a) * 2.6, HEIGHT - 1.6 - Math.random() * 1.2, Math.sin(a) * 2.6);
    root.add(vine(from, to, ivyMat));
  }
  // Wall vines sliding down from the ceiling line.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.15;
    const wall = 3.85;
    const from = new THREE.Vector3(Math.cos(a) * wall, HEIGHT - 0.1, Math.sin(a) * wall);
    const to = new THREE.Vector3(Math.cos(a) * wall, HEIGHT - 2.2 - Math.random() * 1.5, Math.sin(a) * wall);
    root.add(vine(from, to, ivyMat));
  }
  const mossMat = new THREE.MeshStandardMaterial({
    color: 0x18261c,
    roughness: 1,
    emissive: 0x17604a,
    emissiveIntensity: 0.12,
  });
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const moss = new THREE.Mesh(new THREE.CircleGeometry(0.12 + Math.random() * 0.22, 10), mossMat);
    const r = 3.82;
    moss.position.set(Math.cos(a) * r, 0.3 + Math.random() * 2.2, Math.sin(a) * r);
    moss.lookAt(0, moss.position.y, 0);
    root.add(moss);
  }

  // ── Rubble, cabinet, puddle ──────────────────────────────────────────────
  const rubbleMat = new THREE.MeshStandardMaterial({ color: 0x4d5148, roughness: 1 });
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2.4 + Math.random() * 1.2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.abs(x) < 1.2 && z < -2.4) continue; // keep the doorway clear
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.22, 0), rubbleMat);
    rock.position.set(x, 0.08, z);
    rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    rock.castShadow = true;
    root.add(rock);
  }
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.25, 0.6), rustDark);
  cabinet.position.set(3.2, 0.62, 0.6);
  cabinet.rotation.set(0.04, -0.4, -0.09); // slumped
  cabinet.castShadow = true;
  root.add(cabinet);
  // Stagnant puddle: without an environment map high metalness reads as a
  // black hole, so keep it a dark glossy dielectric that catches the sunbeam.
  const puddle = new THREE.Mesh(
    new THREE.CircleGeometry(0.75, 20),
    new THREE.MeshStandardMaterial({ color: 0x2a3d38, roughness: 0.08, metalness: 0.25 }),
  );
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(1.1, 0.012, 1.4);
  puddle.receiveShadow = true;
  root.add(puddle);

  // ── Animation ────────────────────────────────────────────────────────────
  const update = (delta: number, elapsed: number): void => {
    // Organic pulse per flora cluster.
    floraLights.forEach((light, i) => {
      light.intensity = 2.0 + Math.sin(elapsed * 1.1 + floraPhases[i]) * 1.1;
    });
    // Dust drifts up-and-around inside the shaft.
    const pos = dustGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < DUST_COUNT; i++) {
      let y = pos.getY(i) + delta * 0.06;
      if (y > HEIGHT) y = 0;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(elapsed * 0.6 + dustPhase[i]) * delta * 0.02);
    }
    pos.needsUpdate = true;
    // Droplets fall so they LAND on the pattern beats — the audible rhythm
    // Beta needs. A drop is released FALL_TIME before its landing beat.
    const phase = elapsed % DRIP_LOOP;
    for (const drop of drops) {
      const sinceLand = (phase - drop.land + DRIP_LOOP) % DRIP_LOOP;
      const falling = sinceLand > DRIP_LOOP - FALL_TIME || sinceLand === 0;
      if (falling) {
        const t = (sinceLand - (DRIP_LOOP - FALL_TIME) + DRIP_LOOP) % DRIP_LOOP;
        drop.mesh.position.y = DROP_TOP - (t / FALL_TIME) * (DROP_TOP - DROP_BOTTOM);
        drop.mesh.visible = true;
      } else {
        if (drop.falling && listening) playDrip(); // it just hit the bucket
        drop.mesh.visible = false;
      }
      drop.falling = falling;
    }
    // Mural ring eases toward its clicked position.
    disc.rotation.x += (muralTargetRot - disc.rotation.x) * Math.min(1, delta * 6);
    // Hatch: once the mural aligns, the wheel spins and the leaf swings open.
    if (puzzleState.isSolved('sync.starmap') && doorProgress < 1) {
      doorProgress = Math.min(1, doorProgress + delta / 2.4);
      hatch.wheel.rotation.z = doorProgress * Math.PI * 4;
      const swing = Math.max(0, (doorProgress - 0.4) / 0.6);
      hatch.leaf.rotation.y = -swing * 1.9; // creaks inward
    }
    // The sunbeam breathes very slightly.
    sun.intensity = 140 + Math.sin(elapsed * 0.4) * 10;
  };

  // ── Interactables ────────────────────────────────────────────────────────
  const say = (text: string): void => {
    window.dispatchEvent(new CustomEvent('game:toast', { detail: text }));
  };
  const interactables: Interactable[] = [
    {
      object: bucket,
      label: () =>
        listening
          ? 'Rusted bucket — you’re listening to the drip. Click to stop.'
          : 'Rusted bucket — water drips into it in a steady pattern. Click to listen.',
      onInteract: () => {
        ensureAudio();
        listening = !listening;
        say(
          listening
            ? 'You listen: drip · drip · … · drip  (short, short, LONG, short)'
            : 'You stop listening to the drip.',
        );
      },
    },
    {
      object: mural,
      label: () =>
        puzzleState.isSolved('sync.starmap')
          ? `Stone Mural — aligned to ${ZODIAC[muralIndex]}. The hatch is open.`
          : puzzleState.isAvailable('sync.starmap')
            ? `Stone Mural — top glyph: ${ZODIAC[muralIndex]}. Click to rotate. Which sign does Beta's star map show?`
            : 'Stone Mural — the rings are seized. Something on the other side must unlock them.',
      enabled: () => puzzleState.isAvailable('sync.starmap') && !puzzleState.isSolved('sync.starmap'),
      onInteract: () => {
        ensureAudio();
        muralIndex = (muralIndex + 1) % ZODIAC.length;
        muralTargetRot += (Math.PI * 2) / ZODIAC.length;
        playBlip(330);
        if (muralIndex === TARGET_GLYPH_INDEX) {
          setTimeout(() => {
            puzzleState.solve('sync.starmap');
            playSuccess();
          }, 500);
        }
      },
    },
    {
      object: gears,
      label: () =>
        puzzleState.isAvailable('sync.starmap')
          ? 'Rusted gears — they shudder and mesh with the mural rings.'
          : 'Rusted gears — seized solid. They drive the mural, if they ever turn again.',
      onInteract: () => say('The gears grind but hold. They engage the mural’s rings.'),
    },
    {
      object: hatch.group,
      label: () =>
        puzzleState.isSolved('sync.starmap')
          ? 'Hatch to the Grid — open.'
          : 'Rusted hatch — sealed. The mural mechanism controls it.',
      onInteract: () => {
        if (!puzzleState.isSolved('sync.starmap')) say('The wheel won’t budge.');
      },
    },
  ];

  return { object: root, update, interactables };
}
