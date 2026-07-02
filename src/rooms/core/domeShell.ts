import * as THREE from 'three';

export interface DomeShellOptions {
  radius: number;
  pitRadius: number;
  wallMaterial: THREE.Material;
  domeMaterial: THREE.Material;
  floorMaterial: THREE.Material;
  pitMaterial: THREE.Material;
  /** If set, the dome apex is open (Alpha's collapsed oculus). */
  oculusRadius?: number;
  receiveShadow?: boolean;
}

/**
 * The Paradox Core's domed shell — THE SHARED GEOMETRY for Room 3. A
 * hemispherical dome over a circular floor with a central reactor pit. The
 * dome is split into an upper cap (tagged `ceiling`, hidden in the admin
 * overview) and a lower wall band that stays visible.
 */
export function buildDomeShell(opts: DomeShellOptions): THREE.Group {
  const { radius: r } = opts;
  const group = new THREE.Group();
  group.name = 'dome-shell';

  // Floor: annulus from pit rim to dome edge.
  const floorShape = new THREE.Shape();
  floorShape.absarc(0, 0, r, 0, Math.PI * 2, false);
  const pitHole = new THREE.Path();
  pitHole.absarc(0, 0, opts.pitRadius, 0, Math.PI * 2, true);
  floorShape.holes.push(pitHole);
  const floor = new THREE.Mesh(
    new THREE.ExtrudeGeometry(floorShape, { depth: 0.2, bevelEnabled: false }),
    opts.floorMaterial,
  );
  floor.rotation.x = Math.PI / 2; // extrudes downward, top face at y=0
  if (opts.receiveShadow) floor.receiveShadow = true;
  group.add(floor);

  // The pit: inner wall + a bottom far below.
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(opts.pitRadius, opts.pitRadius, 3, 28, 1, true),
    opts.pitMaterial,
  );
  pitWall.position.y = -1.5;
  group.add(pitWall);
  const pitBottom = new THREE.Mesh(new THREE.CircleGeometry(opts.pitRadius, 28), opts.pitMaterial);
  pitBottom.rotation.x = -Math.PI / 2;
  pitBottom.position.y = -3;
  group.add(pitBottom);

  // Dome: theta runs from the apex (0) to the equator (π/2). Split into an
  // upper cap and a lower wall band; the cap starts below the oculus if any.
  const capStart = opts.oculusRadius ? Math.asin(opts.oculusRadius / r) : 0;
  const split = 1.0; // radians from apex where cap becomes wall
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(r, 32, 12, 0, Math.PI * 2, capStart, split - capStart),
    opts.domeMaterial,
  );
  cap.name = 'ceiling'; // hidden by the admin overview's dollhouse view
  group.add(cap);
  const wall = new THREE.Mesh(
    new THREE.SphereGeometry(r, 32, 10, 0, Math.PI * 2, split, Math.PI / 2 - split),
    opts.wallMaterial,
  );
  if (opts.receiveShadow) wall.receiveShadow = true;
  group.add(wall);

  return group;
}
