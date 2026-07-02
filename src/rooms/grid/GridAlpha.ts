import * as THREE from 'three';
import { slotLocal } from '@/config/facility';
import { concreteTexture } from '@/core/textures';
import { floraCluster, rustedDoor, vine } from '@/rooms/props';
import type { RoomDetail } from '@/rooms/types';
import { RoomId } from '@/types';
import { buildCorridorShell } from './corridorShell';

const W = 6;
const H = 4;
const D = 18;

/** A rusted valve: wheel + spokes + a stub of pipe. */
function valve(rust: THREE.Material, rustDark: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 18), rust);
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.04), rustDark);
    spoke.rotation.z = (i * Math.PI) / 3;
    wheel.add(spoke);
  }
  const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8), rustDark);
  stub.rotation.x = Math.PI / 2;
  stub.position.z = -0.15;
  group.add(wheel, stub);
  return group;
}

/**
 * Room 2, Dimension Alpha — "The Greenhouse".
 * Matches docs/reference/r2-grid-alpha.png: collapsed glass gable roof with
 * hazy sun, rusted pipes and valve clusters on the left wall, a mutated
 * bioluminescent flora wall on the right, soil-analysis bench, overgrown
 * server cabinets, hanging CRT monitors, roots across the floor.
 */
export function buildGridAlpha(): RoomDetail {
  const root = new THREE.Group();
  root.name = 'grid-alpha';

  // ── Shell: concrete walls, dirt floor, broken glass gable roof ──────────
  const concrete = new THREE.MeshStandardMaterial({
    map: concreteTexture(),
    roughness: 0.96,
    metalness: 0.02,
  });
  const dirtFloor = new THREE.MeshStandardMaterial({
    map: concreteTexture(),
    color: 0x77755f,
    roughness: 1,
  });
  const dirtyGlass = new THREE.MeshStandardMaterial({
    color: 0xcfd8b8,
    transparent: true,
    opacity: 0.28,
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  root.add(
    buildCorridorShell({
      width: W,
      height: H,
      depth: D,
      wallMaterial: concrete,
      floorMaterial: dirtFloor,
      roof: { style: 'gable', material: dirtyGlass, apex: 1.4 },
      receiveShadow: true,
    }),
  );

  // ── Hazy sun through the glass ───────────────────────────────────────────
  const sun = new THREE.DirectionalLight(0xffd89b, 2.6);
  sun.position.set(3, 12, 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  root.add(sun, sun.target);
  root.add(new THREE.AmbientLight(0x50583c, 0.9));
  // Two soft god-ray sheets hanging in the humid air.
  const rayMat = new THREE.MeshBasicMaterial({
    color: 0xffe2a8,
    transparent: true,
    opacity: 0.05,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  for (const z of [-3.5, 3]) {
    const ray = new THREE.Mesh(new THREE.PlaneGeometry(3.5, H + 1), rayMat);
    ray.position.set(0.4, H / 2, z);
    ray.rotation.set(0, 0.5, -0.35);
    root.add(ray);
  }

  // ── Mutated flora wall (puzzle: grid.bloom) — right side ────────────────
  const fieldPos = slotLocal(RoomId.Grid, 'grid.field');
  // Faint self-glow: the wall faces away from the sun and would otherwise
  // read as a black void — it's a living mass, so let it shimmer.
  const vineWallMat = new THREE.MeshStandardMaterial({
    color: 0x1b3320,
    roughness: 1,
    emissive: 0x143020,
    emissiveIntensity: 0.4,
  });
  const vineWall = new THREE.Mesh(new THREE.BoxGeometry(0.45, H - 0.4, 12), vineWallMat);
  vineWall.position.set(fieldPos.x + 0.5, (H - 0.4) / 2, fieldPos.z);
  root.add(vineWall);
  // Blooms studding the vine wall — these mirror Beta's laser colours.
  const bloomLights: THREE.PointLight[] = [];
  const bloomPhases: number[] = [];
  const bloomMats = [0x2ee6d6, 0xe344c4, 0x39f0a0].map(
    (color) =>
      new THREE.MeshStandardMaterial({
        color: 0x11241a,
        roughness: 0.7,
        emissive: new THREE.Color(color),
        emissiveIntensity: 1.5,
      }),
  );
  for (let i = 0; i < 22; i++) {
    const bloom = new THREE.Mesh(
      new THREE.SphereGeometry(0.07 + Math.random() * 0.09, 8, 6),
      bloomMats[i % bloomMats.length],
    );
    bloom.position.set(
      fieldPos.x + 0.22,
      0.4 + Math.random() * (H - 1.2),
      fieldPos.z - 5.5 + Math.random() * 11,
    );
    root.add(bloom);
  }
  for (let i = 0; i < 5; i++) {
    const glow = new THREE.PointLight([0x2ee6d6, 0xe344c4][i % 2], 3.2, 5.5, 2);
    glow.position.set(fieldPos.x - 0.5, 1.2 + (i % 3) * 0.8, fieldPos.z - 4.8 + i * 2.4);
    root.add(glow);
    bloomLights.push(glow);
    bloomPhases.push(i * 1.9);
  }

  // ── Soil/pH bench (puzzle: grid.chemical) ────────────────────────────────
  const benchPos = slotLocal(RoomId.Grid, 'grid.analyzer');
  const rust = new THREE.MeshStandardMaterial({ color: 0x7a4a26, roughness: 0.85, metalness: 0.45 });
  const rustDark = new THREE.MeshStandardMaterial({ color: 0x53331c, roughness: 0.9, metalness: 0.4 });
  const bench = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.7), rustDark);
  top.position.y = 0.85;
  bench.add(top);
  for (const [lx, lz] of [
    [-0.7, -0.25],
    [0.7, -0.25],
    [-0.7, 0.25],
    [0.7, 0.25],
  ]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.85, 0.07), rustDark);
    leg.position.set(lx, 0.42, lz);
    bench.add(leg);
  }
  // Soil trays + the coloured pH strips Alpha reads out to Beta.
  const soil = new THREE.MeshStandardMaterial({ color: 0x2e2318, roughness: 1 });
  for (let i = 0; i < 3; i++) {
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.5), soil);
    tray.position.set(-0.55 + i * 0.55, 0.93, 0);
    bench.add(tray);
  }
  const stripColors = [0xdd3333, 0xddcc22, 0x22cc55, 0x6633cc];
  stripColors.forEach((color, i) => {
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(0.06, 0.2),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    );
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(-0.3 + i * 0.16, 0.9, 0.28);
    bench.add(strip);
  });
  bench.position.set(benchPos.x, 0, benchPos.z);
  bench.rotation.y = 0.25;
  root.add(bench);

  // ── Rusted pipes + valve cluster (puzzle: grid.server mirror) — left ────
  const pipesPos = slotLocal(RoomId.Grid, 'grid.machinery');
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x5e4a35, roughness: 0.8, metalness: 0.5 });
  for (let i = 0; i < 3; i++) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 7, 10), pipeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(-W / 2 + 0.35, 1.2 + i * 0.75, pipesPos.z + 1.5);
    root.add(pipe);
  }
  const valves = new THREE.Group();
  const valveSpots: Array<[number, number]> = [
    [1.4, 0],
    [2.1, 0.55],
    [2.8, -0.4],
    [1.9, -0.8],
  ];
  for (const [vy, vz] of valveSpots) {
    const unit = valve(rust, rustDark);
    unit.rotation.y = Math.PI / 2;
    unit.position.set(-W / 2 + 0.42, vy, pipesPos.z + vz);
    valves.add(unit);
  }
  root.add(valves);

  // ── Overgrown server cabinets + hanging CRTs ─────────────────────────────
  const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x2f3630, roughness: 0.9, metalness: 0.3 });
  for (let i = 0; i < 3; i++) {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.9, 0.6), cabinetMat);
    cab.position.set(-W / 2 + 0.75, 0.95, 4.5 - i * 2.1);
    cab.rotation.z = (Math.random() - 0.5) * 0.08;
    cab.castShadow = true;
    root.add(cab);
  }
  const crtMat = new THREE.MeshStandardMaterial({ color: 0x1d201d, roughness: 0.6 });
  for (const [cx, cz, drop] of [
    [-0.8, -1, 1.0],
    [0.9, -5.5, 1.4],
  ]) {
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, drop, 6), crtMat);
    cable.position.set(cx, H + 0.7 - drop / 2, cz);
    const crt = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.5), crtMat);
    crt.position.set(cx, H + 0.7 - drop - 0.22, cz);
    crt.rotation.set(0.15, 0.4, -0.08);
    root.add(cable, crt);
  }

  // ── Organic dressing: roots, vines, flora, puddle, doors ────────────────
  const ivyMat = new THREE.MeshStandardMaterial({ color: 0x2a4a26, roughness: 0.95 });
  for (let i = 0; i < 8; i++) {
    const z = -7 + i * 2;
    const from = new THREE.Vector3((Math.random() - 0.5) * 2, H + 1.1, z);
    const to = new THREE.Vector3((Math.random() - 0.5) * 4, H - 1.6 - Math.random(), z + 1);
    root.add(vine(from, to, ivyMat));
  }
  // Thick roots snaking across the floor.
  for (let i = 0; i < 4; i++) {
    const z = -6 + i * 3.6;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-W / 2 + 0.3, 0.05, z),
      new THREE.Vector3(-0.8, 0.1, z + 0.8),
      new THREE.Vector3(1.2, 0.05, z + 0.3),
      new THREE.Vector3(W / 2 - 0.6, 0.12, z + 1.2),
    ]);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.06, 6), ivyMat));
  }
  const floraLights: THREE.PointLight[] = [];
  const floraPhases: number[] = [];
  [
    { x: -2.3, z: 7.6, color: 0x2ee6d6, s: 1.1 },
    { x: 2.1, z: 8.2, color: 0xe344c4, s: 0.9 }, // clear of the default camera spawn

    { x: -2.2, z: -7.4, color: 0x39f0a0, s: 1.0 },
  ].forEach((spot, i) => {
    const { group, light } = floraCluster(spot.color, spot.s);
    group.position.set(spot.x, 0, spot.z);
    root.add(group);
    floraLights.push(light);
    floraPhases.push(i * 2.1);
  });
  const puddle = new THREE.Mesh(
    new THREE.CircleGeometry(0.9, 18),
    new THREE.MeshStandardMaterial({ color: 0x2a3d38, roughness: 0.08, metalness: 0.25 }),
  );
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(-0.6, 0.012, 1.8);
  puddle.receiveShadow = true;
  root.add(puddle);
  // Doors at both ends (back to R1, on to R3).
  const doorIn = rustedDoor(rust, rustDark);
  doorIn.position.set(0, 0, D / 2 - 0.1);
  doorIn.rotation.y = Math.PI;
  const doorOut = rustedDoor(rust, rustDark);
  doorOut.position.set(0, 0, -D / 2 + 0.1);
  root.add(doorIn, doorOut);

  // ── Drifting humid dust ─────────────────────────────────────────────────
  const DUST = 260;
  const dustPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * W;
    dustPos[i * 3 + 1] = Math.random() * (H + 1);
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * D;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: 0xffe6b0,
      size: 0.02,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  root.add(dust);

  const update = (delta: number, elapsed: number): void => {
    floraLights.forEach((light, i) => {
      light.intensity = 2.0 + Math.sin(elapsed * 1.1 + floraPhases[i]) * 1.1;
    });
    bloomLights.forEach((light, i) => {
      light.intensity = 2.8 + Math.sin(elapsed * 1.4 + bloomPhases[i]) * 1.2;
    });
    const pos = dustGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < DUST; i++) {
      let y = pos.getY(i) + delta * 0.05;
      if (y > H + 1) y = 0;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  };

  return { object: root, update };
}
