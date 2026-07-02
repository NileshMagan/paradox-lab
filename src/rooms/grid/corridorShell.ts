import * as THREE from 'three';

export interface CorridorShellOptions {
  width: number;
  height: number;
  depth: number;
  wallMaterial: THREE.Material;
  floorMaterial: THREE.Material;
  /**
   * Roof style. Same footprint either way (mirrored rule) — Alpha's collapsed
   * greenhouse gable vs Beta's sealed flat ceiling is a skin difference, like
   * R1's skylight.
   */
  roof:
    | { style: 'gable'; material: THREE.Material; apex: number }
    | { style: 'flat'; material: THREE.Material };
  receiveShadow?: boolean;
}

/**
 * The Grid's long rectangular shell — THE SHARED GEOMETRY for Room 2. Both
 * dimensions call this with the same dimensions and different materials.
 * Runs along Z; door walls sit at both ends (doors themselves are props).
 */
export function buildCorridorShell(opts: CorridorShellOptions): THREE.Group {
  const { width: w, height: h, depth: d } = opts;
  const group = new THREE.Group();
  group.name = 'corridor-shell';

  const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), opts.floorMaterial);
  floor.position.y = -0.1;
  if (opts.receiveShadow) floor.receiveShadow = true;
  group.add(floor);

  const wallGeo = new THREE.BoxGeometry(0.3, h, d);
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(wallGeo, opts.wallMaterial);
    wall.position.set(side * (w / 2 + 0.15), h / 2, 0);
    if (opts.receiveShadow) wall.receiveShadow = true;
    group.add(wall);
  }

  // End walls reach the roofline so gable ends aren't open to the void.
  const endH = opts.roof.style === 'gable' ? h + opts.roof.apex : h;
  const endGeo = new THREE.BoxGeometry(w + 0.6, endH, 0.3);
  for (const side of [-1, 1]) {
    const end = new THREE.Mesh(endGeo, opts.wallMaterial);
    end.position.set(0, endH / 2, side * (d / 2 + 0.15));
    if (opts.receiveShadow) end.receiveShadow = true;
    group.add(end);
  }

  if (opts.roof.style === 'gable') {
    const { apex, material } = opts.roof;
    const slant = Math.hypot(w / 2, apex);
    const angle = Math.atan2(apex, w / 2);
    for (const side of [-1, 1]) {
      const pane = new THREE.Mesh(new THREE.BoxGeometry(slant + 0.1, 0.06, d), material);
      pane.rotation.z = side * angle;
      pane.position.set(-side * (w / 4), h + apex / 2, 0);
      pane.name = 'ceiling'; // hidden by the admin overview's dollhouse view
      group.add(pane);
    }
  } else {
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), opts.roof.material);
    ceiling.position.y = h + 0.1;
    ceiling.name = 'ceiling'; // hidden by the admin overview's dollhouse view
    group.add(ceiling);
  }

  return group;
}
