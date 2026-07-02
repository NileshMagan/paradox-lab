import * as THREE from 'three';
import { labelTexture } from '@/core/textures';

/**
 * Reusable prop builders shared across room dressings. Alpha props are rusted
 * and organic; Beta props are sleek and emissive; the cage is deliberately the
 * SAME silhouette in both dimensions (the relic that survives the split).
 */

/** A clump of glowing mutant mushrooms/pods with its own point light (Alpha). */
export function floraCluster(
  color: number,
  scale: number,
): { group: THREE.Group; light: THREE.PointLight } {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0c1f16,
    roughness: 0.7,
    emissive: new THREE.Color(color),
    emissiveIntensity: 1.6,
  });
  const count = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const tall = Math.random() > 0.5;
    const geo = tall
      ? new THREE.ConeGeometry(0.05 + Math.random() * 0.05, 0.25 + Math.random() * 0.35, 6)
      : new THREE.SphereGeometry(0.06 + Math.random() * 0.08, 8, 6);
    const pod = new THREE.Mesh(geo, mat);
    pod.position.set((Math.random() - 0.5) * 0.6, tall ? 0.18 : 0.08, (Math.random() - 0.5) * 0.6);
    pod.castShadow = true;
    group.add(pod);
  }
  const light = new THREE.PointLight(color, 2.4, 4.5, 2);
  light.position.y = 0.35;
  group.add(light);
  group.scale.setScalar(scale);
  return { group, light };
}

/** Hanging ivy strand as a tube along a sagging curve (Alpha). */
export function vine(
  from: THREE.Vector3,
  to: THREE.Vector3,
  material: THREE.Material,
): THREE.Mesh {
  const mid1 = from.clone().lerp(to, 0.35).add(new THREE.Vector3(0.15, -0.25, 0.1));
  const mid2 = from.clone().lerp(to, 0.7).add(new THREE.Vector3(-0.1, -0.15, -0.12));
  const curve = new THREE.CatmullRomCurve3([from, mid1, mid2, to]);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.017, 5), material);
}

/**
 * Rusted bulkhead door with a wheel handle (Alpha). Origin at floor centre.
 * `leaf` and `wheel` are exposed so puzzles can animate it opening — the
 * wheel is parented to the leaf so they swing together.
 */
export function rustedDoor(
  rust: THREE.Material,
  rustDark: THREE.Material,
  width = 1.5,
  height = 2.5,
): { group: THREE.Group; leaf: THREE.Mesh; wheel: THREE.Group } {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, height + 0.5, 0.24), rustDark);
  frame.position.y = (height + 0.5) / 2;
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.18), rust);
  leaf.position.set(0, height / 2 + 0.05, 0.06);
  const wheel = new THREE.Group();
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.045, 8, 20), rustDark));
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 0.05), rustDark);
    spoke.rotation.z = (i * Math.PI) / 3;
    wheel.add(spoke);
  }
  wheel.position.set(0, 0.05, 0.14); // leaf-local, at the leaf's centre
  leaf.add(wheel);
  group.add(frame, leaf);
  return { group, leaf, wheel };
}

/** Extruded octagon slab (Beta door leaf/frame shape). */
export function octagonSlab(radius: number, depth: number, material: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape();
  for (let k = 0; k <= 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    if (k === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }), material);
}

/**
 * Beta's octagonal blast door with a room label and blinking lockdown bar.
 * Origin at the door's centre; caller positions and rotates the group.
 */
export function sciFiDoor(
  steel: THREE.Material,
  black: THREE.Material,
  label: string,
): { group: THREE.Group; lockBar: THREE.Mesh; leaf: THREE.Mesh } {
  const group = new THREE.Group();
  const frame = octagonSlab(1.45, 0.14, black);
  const leaf = octagonSlab(1.25, 0.1, steel);
  leaf.position.z = 0.12;
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.3, 0.04), black);
  seam.position.z = 0.24;
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.4),
    new THREE.MeshBasicMaterial({ map: labelTexture(label), transparent: true }),
  );
  plate.position.set(0.55, 0.1, 0.25);
  const lockBar = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.12, 0.06),
    new THREE.MeshBasicMaterial({ color: 0xff2b3a }),
  );
  lockBar.position.set(0, 1.7, 0.22);
  group.add(frame, leaf, seam, plate, lockBar);
  return { group, lockBar, leaf };
}

/**
 * The suspended reactor cage — the one object with the SAME silhouette in both
 * dimensions (overgrown timber in Alpha, scorched relic in Beta's beam).
 * A rough cubic frame of beams with a glowing crystal at its heart.
 */
export function hangingCage(
  frameMat: THREE.Material,
  crystalColor: number,
  size = 1.6,
): { group: THREE.Group; crystal: THREE.Mesh } {
  const group = new THREE.Group();
  const half = size / 2;
  const beam = (len: number): THREE.BoxGeometry => new THREE.BoxGeometry(0.1, 0.1, len);
  // 12 cube edges.
  for (const [x, y] of [
    [-half, -half],
    [-half, half],
    [half, -half],
    [half, half],
  ]) {
    const edge = new THREE.Mesh(beam(size), frameMat);
    edge.position.set(x, y, 0);
    group.add(edge);
    const edgeX = new THREE.Mesh(beam(size), frameMat);
    edgeX.rotation.y = Math.PI / 2;
    edgeX.position.set(0, x, y);
    group.add(edgeX);
    const edgeY = new THREE.Mesh(beam(size), frameMat);
    edgeY.rotation.x = Math.PI / 2;
    edgeY.position.set(x, 0, y);
    group.add(edgeY);
  }
  const crystal = new THREE.Mesh(
    new THREE.IcosahedronGeometry(size * 0.22, 0),
    new THREE.MeshStandardMaterial({
      color: 0x0a1418,
      roughness: 0.2,
      emissive: new THREE.Color(crystalColor),
      emissiveIntensity: 2.2,
    }),
  );
  group.add(crystal);
  return { group, crystal };
}

/**
 * Beta security drone: a small tracked unit with a downward red scan light.
 * Caller animates the group's position and the light's sweep.
 */
export function securityDrone(black: THREE.Material): {
  group: THREE.Group;
  scan: THREE.SpotLight;
} {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.34), black);
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xff2b3a }),
  );
  eye.position.y = -0.09;
  const scan = new THREE.SpotLight(0xff2b3a, 14, 8, 0.28, 0.6, 1.6);
  scan.position.set(0, -0.05, 0);
  scan.target.position.set(0, -4, 0);
  group.add(body, eye, scan, scan.target);
  return { group, scan };
}
