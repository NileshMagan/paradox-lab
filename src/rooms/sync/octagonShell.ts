import * as THREE from 'three';

export interface OctagonShellOptions {
  /** Distance from centre to each flat wall (half the room width). */
  apothem: number;
  height: number;
  wallMaterial: THREE.Material;
  floorMaterial: THREE.Material;
  ceilingMaterial: THREE.Material;
  /** If set, the ceiling gets a central circular skylight hole of this radius. */
  skylightRadius?: number;
  receiveShadow?: boolean;
}

/**
 * The Sync Chamber's octagonal shell — THE SHARED GEOMETRY. Both dimensions
 * call this with the same dimensions and different materials, which is the
 * mirrored-footprint rule applied to the room itself. Flats face the ±X/±Z
 * axes so wall-mounted props in facility.ts line up in both worlds.
 */
export function buildOctagonShell(opts: OctagonShellOptions): THREE.Group {
  const { apothem: a, height: h } = opts;
  const group = new THREE.Group();
  group.name = 'octagon-shell';
  const circumradius = a / Math.cos(Math.PI / 8);
  const wallWidth = 2 * a * Math.tan(Math.PI / 8) + 0.5; // overlap hides seams

  // Eight walls.
  for (let k = 0; k < 8; k++) {
    const angle = (k * Math.PI) / 4;
    const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const wall = new THREE.Mesh(new THREE.BoxGeometry(wallWidth, h, 0.3), opts.wallMaterial);
    wall.position.copy(dir).multiplyScalar(a + 0.15);
    wall.position.y = h / 2;
    wall.rotation.y = Math.atan2(dir.x, dir.z);
    if (opts.receiveShadow) wall.receiveShadow = true;
    group.add(wall);
  }

  // Floor: 8-sided cylinder, rotated so its flats match the walls.
  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(circumradius, circumradius, 0.2, 8),
    opts.floorMaterial,
  );
  floor.rotation.y = Math.PI / 8;
  floor.position.y = -0.1;
  if (opts.receiveShadow) floor.receiveShadow = true;
  group.add(floor);

  // Ceiling: solid slab, or an extruded octagon with a skylight hole.
  if (opts.skylightRadius) {
    const shape = new THREE.Shape();
    for (let k = 0; k <= 8; k++) {
      const angle = (k * Math.PI) / 4 + Math.PI / 8;
      const x = Math.cos(angle) * circumradius;
      const y = Math.sin(angle) * circumradius;
      if (k === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    const hole = new THREE.Path();
    hole.absarc(0, 0, opts.skylightRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const ceiling = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false }),
      opts.ceilingMaterial,
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = h + 0.3;
    ceiling.name = 'ceiling'; // hidden by the admin overview's dollhouse view
    group.add(ceiling);
  } else {
    const ceiling = new THREE.Mesh(
      new THREE.CylinderGeometry(circumradius, circumradius, 0.2, 8),
      opts.ceilingMaterial,
    );
    ceiling.rotation.y = Math.PI / 8;
    ceiling.position.y = h + 0.1;
    ceiling.name = 'ceiling'; // hidden by the admin overview's dollhouse view
    group.add(ceiling);
  }

  return group;
}
