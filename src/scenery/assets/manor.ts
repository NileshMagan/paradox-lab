import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Haunted manor — Victorian drawing-room/library/séance set. Pairs with the
 * 'gothic' and 'noir' palettes. Origins on the floor; wall-mounted props
 * (portraits, fireplace) face +Z so a room places them along the far wall.
 *
 * Several builders return moving handles so game code can drive them:
 *   grandfatherClock → hourHand/minuteHand (rotate about z on the +Z face),
 *   portraitRow → frames (swing about y), secretBookcase → books + bookcase
 *   pivot, seanceTable → planchette (slides in xz), pipeOrgan → keys (dip).
 */

/**
 * Longcase "grandfather" clock. Face is on the +Z front; `hourHand` and
 * `minuteHand` rotate about z (12 o'clock = 0, clockwise = negative). `door`
 * (lower case) swings about y at its left edge. `pendulum` swings about z.
 */
export function grandfatherClock(
  rng: Rng,
  pal: Palette,
): {
  group: THREE.Group;
  hourHand: THREE.Group;
  minuteHand: THREE.Group;
  pendulum: THREE.Group;
  door: THREE.Group;
} {
  const group = new THREE.Group();
  const W = 0.6;
  const H = 2.2;
  // Case: tall body, stepped crown, plinth.
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.36), pal.body);
  body.position.y = H / 2;
  body.castShadow = true;
  group.add(body);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(W + 0.14, 0.22, 0.46), pal.trim);
  plinth.position.y = 0.11;
  group.add(plinth);
  const crown = new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, 0.18, 0.42), pal.trim);
  crown.position.y = H + 0.02;
  group.add(crown);
  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 8), pal.metal);
  finial.position.y = H + 0.2;
  group.add(finial);

  // Clock face near the top, inset dark with a brass ring.
  const faceY = H - 0.42;
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), pal.soft);
  dial.position.set(0, faceY, 0.185);
  group.add(dial);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.02, 8, 24), pal.metal);
  bezel.position.set(0, faceY, 0.188);
  group.add(bezel);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.03, 0.008), pal.trim);
    mark.position.set(Math.sin(a) * 0.16, faceY + Math.cos(a) * 0.16, 0.19);
    mark.rotation.z = -a;
    group.add(mark);
  }
  // Hands: pivot groups centred on the dial; a hand box points +Y from the pivot.
  const makeHand = (len: number, wide: number): THREE.Group => {
    const hand = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.BoxGeometry(wide, len, 0.01).translate(0, len / 2, 0), pal.metal);
    hand.add(arm);
    hand.position.set(0, faceY, 0.195);
    group.add(hand);
    return hand;
  };
  const hourHand = makeHand(0.1, 0.02);
  const minuteHand = makeHand(0.16, 0.014);
  hourHand.rotation.z = rng.angle();
  minuteHand.rotation.z = rng.angle();

  // Glass door over the pendulum, and the swinging pendulum itself.
  const doorGlass = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.12, 1.0), pal.glass);
  const door = new THREE.Group();
  const doorFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.05, 0.04), pal.trim);
  doorFrameL.position.set((W - 0.12) / 2, 0, 0);
  door.add(doorGlass, doorFrameL);
  door.position.set(-(W - 0.12) / 2, faceY - 0.75, 0.185); // hinge at left edge
  group.add(door);

  const pendulum = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.7, 6).translate(0, -0.35, 0), pal.metal);
  const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16), pal.metal);
  bob.rotation.x = Math.PI / 2;
  bob.position.y = -0.7;
  pendulum.add(rod, bob);
  pendulum.position.set(0, faceY - 0.28, 0.12);
  group.add(pendulum);

  return { group, hourHand, minuteHand, pendulum, door };
}

/**
 * Row of framed portraits on the far wall (faces +Z). Each `frames[i]` swings
 * about y at its left edge (0 flush, ~-1.4 revealing whatever's behind it).
 */
export function portraitRow(
  rng: Rng,
  pal: Palette,
  opts: { count?: number } = {},
): { group: THREE.Group; frames: THREE.Group[] } {
  const count = Math.min(opts.count ?? 4, 5);
  const group = new THREE.Group();
  const frames: THREE.Group[] = [];
  const fw = 0.5;
  const gap = 0.28;
  const span = count * fw + (count - 1) * gap;
  for (let i = 0; i < count; i++) {
    const cx = -span / 2 + fw / 2 + i * (fw + gap);
    // Pivot sits at the frame's LEFT edge so rotation.y opens it like a door;
    // the portrait content is built centred at +fw/2 from that hinge.
    const pivot = new THREE.Group();
    const border = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.72, 0.05), pal.metal);
    border.position.x = fw / 2;
    pivot.add(border);
    // Canvas: a dim portrait suggested by a head-and-shoulders silhouette.
    const canvas = new THREE.Mesh(new THREE.PlaneGeometry(fw - 0.1, 0.62), pal.soft);
    canvas.position.set(fw / 2, 0, 0.03);
    pivot.add(canvas);
    const shoulders = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 0.22, 12, 1, false, 0, Math.PI), pal.trim);
    shoulders.rotation.x = Math.PI / 2;
    shoulders.position.set(fw / 2, -0.16, 0.035);
    pivot.add(shoulders);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), pal.trim);
    head.position.set(fw / 2, 0.02, 0.04);
    head.scale.set(1, 1.15, 0.6);
    pivot.add(head);
    pivot.position.set(cx - fw / 2, 1.55, 0);
    pivot.rotation.y = rng.chance(0.15) ? -0.2 : 0; // one hangs slightly ajar
    group.add(pivot);
    frames.push(pivot);
  }
  return { group, frames };
}

/**
 * Stone fireplace on the far wall (+Z). `flameMaterials` drive the fire glow;
 * `lever` is a side damper handle that rotates about z.
 */
export function hearthFireplace(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; flameMaterials: THREE.MeshStandardMaterial[]; lever: THREE.Group } {
  const group = new THREE.Group();
  const W = 1.6;
  // Surround: two jambs + lintel + mantel shelf.
  for (const side of [-1, 1]) {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 0.4), pal.body);
    jamb.position.set((side * (W - 0.3)) / 2, 0.75, 0);
    jamb.castShadow = true;
    group.add(jamb);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, 0.4), pal.body);
  lintel.position.set(0, 1.35, 0);
  group.add(lintel);
  const mantel = new THREE.Mesh(new THREE.BoxGeometry(W + 0.24, 0.12, 0.5), pal.trim);
  mantel.position.set(0, 1.56, 0.02);
  group.add(mantel);
  // Firebox: dark recess.
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.6, 1.2), pal.trim);
  back.position.set(0, 0.6, -0.18);
  group.add(back);
  // Logs + flames.
  const flameMaterials: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 5; i++) {
    const mat = pal.glow(i % 2 ? 0xff7a2a : 0xffc24a).clone();
    mat.emissiveIntensity = 1.4;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.05 + rng.next() * 0.03, 0.2 + rng.next() * 0.12, 6), mat);
    flame.position.set(-0.3 + i * 0.15 + rng.jitter(0.03), 0.18 + rng.next() * 0.05, -0.05);
    flame.userData.disposeMaterial = true;
    group.add(flame);
    flameMaterials.push(mat);
  }
  for (const z of [-0.05, 0.06]) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8), pal.trim);
    log.rotation.z = Math.PI / 2;
    log.position.set(rng.jitter(0.05), 0.06, z);
    group.add(log);
  }
  // Damper lever on the right jamb.
  const lever = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.04).translate(0, 0.12, 0), pal.metal);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), pal.metal);
  knob.position.y = 0.26;
  lever.add(handle, knob);
  lever.position.set((W - 0.3) / 2, 1.0, 0.22);
  lever.rotation.z = 0.5; // resting to one side
  group.add(lever);
  return { group, flameMaterials, lever };
}

/**
 * Bookcase against the far wall (+Z). `books` are individual spines that dip
 * about x when pulled; `bookcase` is the whole unit, which rotates about y at
 * its left edge to reveal a passage once the right books are pulled.
 */
export function secretBookcase(
  rng: Rng,
  pal: Palette,
  opts: { books?: number } = {},
): { group: THREE.Group; bookcase: THREE.Group; books: THREE.Mesh[] } {
  const group = new THREE.Group();
  const bookcase = new THREE.Group();
  const W = 1.5;
  const H = 2.2;
  const carcass = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.34), pal.body);
  carcass.position.set(W / 2, H / 2, -0.12);
  carcass.castShadow = true;
  bookcase.add(carcass);
  const books: THREE.Mesh[] = [];
  const shelves = 4;
  const perShelf = opts.books ?? 7;
  const bookColors = [pal.trim, pal.metal, pal.soft, pal.body];
  for (let s = 0; s < shelves; s++) {
    const shelfY = 0.4 + s * ((H - 0.6) / (shelves - 1));
    const board = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 0.04, 0.3), pal.trim);
    board.position.set(W / 2, shelfY - 0.16, -0.1);
    bookcase.add(board);
    for (let b = 0; b < perShelf; b++) {
      const bw = 0.06 + rng.next() * 0.04;
      const bh = 0.24 + rng.next() * 0.08;
      const spine = new THREE.Mesh(
        new THREE.BoxGeometry(bw, bh, 0.22),
        bookColors[(s + b) % bookColors.length],
      );
      spine.position.set(0.14 + b * (W - 0.24) / perShelf + rng.jitter(0.01), shelfY + bh / 2 - 0.14, -0.05);
      spine.rotation.z = rng.chance(0.15) ? rng.jitter(0.12) : 0; // a few leaning
      bookcase.add(spine);
      books.push(spine);
    }
  }
  bookcase.position.set(-W / 2, 0, 0); // hinge at the unit's left edge
  group.add(bookcase);
  return { group, bookcase, books };
}

/**
 * Round séance table with a spirit board. `planchette` slides across the board
 * (set its x/z to a letter's local position); `letterSlots` are the marker
 * groups ringing the board (read their positions to move the planchette).
 */
export function seanceTable(
  rng: Rng,
  pal: Palette,
  opts: { letters?: number } = {},
): { group: THREE.Group; planchette: THREE.Group; letterSlots: THREE.Group[] } {
  const group = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 28), pal.body);
  top.position.y = 0.75;
  top.castShadow = true;
  group.add(top);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, 0.72, 12), pal.trim);
  pedestal.position.y = 0.37;
  group.add(pedestal);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.05, 16), pal.trim);
  foot.position.y = 0.03;
  group.add(foot);
  // Spirit board face.
  const board = new THREE.Mesh(new THREE.CircleGeometry(0.6, 28), pal.soft);
  board.rotation.x = -Math.PI / 2;
  board.position.y = 0.783;
  group.add(board);
  const letterSlots: THREE.Group[] = [];
  const count = Math.min(opts.letters ?? 8, 12);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const slot = new THREE.Group();
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.05), pal.glow());
    slot.add(mark);
    slot.position.set(Math.cos(a) * 0.46, 0.788, Math.sin(a) * 0.46);
    slot.rotation.y = -a;
    group.add(slot);
    letterSlots.push(slot);
  }
  // Planchette: heart-ish teardrop with a viewing hole (two little feet).
  const planchette = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.02, 3), pal.metal);
  plate.rotation.x = Math.PI / 2;
  planchette.add(plate);
  const hole = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 14), pal.trim);
  hole.rotation.x = Math.PI / 2;
  hole.position.y = 0.012;
  planchette.add(hole);
  planchette.position.set(rng.jitter(0.1), 0.8, rng.jitter(0.1));
  group.add(planchette);
  return { group, planchette, letterSlots };
}

/**
 * Small chamber pipe organ. `keys` are the manual's keys — each dips about x
 * (front edge) when played. Read the pipe heights for an ordering clue.
 */
export function pipeOrgan(
  rng: Rng,
  pal: Palette,
  opts: { keys?: number } = {},
): { group: THREE.Group; keys: THREE.Mesh[] } {
  const group = new THREE.Group();
  // Console box.
  const consoleBox = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 0.5), pal.body);
  consoleBox.position.set(0, 0.45, 0);
  consoleBox.castShadow = true;
  group.add(consoleBox);
  // Pipe array rising behind the console, graded heights.
  const pipeCount = 7;
  for (let i = 0; i < pipeCount; i++) {
    const h = 0.6 + Math.abs(3 - i) * -0.06 + (pipeCount - i) * 0.08;
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, h, 12), pal.metal);
    pipe.position.set(-0.55 + i * 0.18, 0.9 + h / 2, -0.16);
    pipe.rotation.z = rng.jitter(0.012); // centuries of settling
    group.add(pipe);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 12), pal.trim);
    cap.position.set(pipe.position.x, 0.9 + h + 0.04, -0.16);
    group.add(cap);
  }
  // Music rack + keyboard shelf.
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.34), pal.trim);
  shelf.position.set(0, 0.92, 0.18);
  group.add(shelf);
  const keys: THREE.Mesh[] = [];
  const keyCount = Math.min(opts.keys ?? 7, 10);
  for (let i = 0; i < keyCount; i++) {
    const key = new THREE.Mesh(new THREE.BoxGeometry(1.1 / keyCount - 0.01, 0.03, 0.24), pal.soft);
    key.position.set(-0.55 + (i + 0.5) * (1.1 / keyCount), 0.96, 0.22);
    group.add(key);
    keys.push(key);
  }
  // Pedals + bench.
  const bench = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.28), pal.trim);
  bench.position.set(0, 0.48, 0.75);
  group.add(bench);
  for (const x of [-0.35, 0.35]) {
    for (const z of [0.64, 0.86]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.48, 0.05), pal.trim);
      leg.position.set(x, 0.24, z);
      group.add(leg);
    }
  }
  return { group, keys };
}

/** AMBIENCE — dust-sheeted armchair: draped soft cloth over a boxy form. */
export function dustSheetChair(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), pal.soft);
  seat.position.y = 0.35;
  seat.castShadow = true;
  g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.16), pal.soft);
  back.position.set(0, 0.7, -0.3);
  back.rotation.x = -0.12;
  g.add(back);
  // Draped folds: a few tilted planes hanging over the edges.
  for (let i = 0; i < 5; i++) {
    const fold = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.02), pal.soft);
    fold.position.set(-0.3 + i * 0.15, 0.2, 0.36);
    fold.rotation.x = 0.3 + rng.jitter(0.1);
    g.add(fold);
  }
  return g;
}

/** AMBIENCE — a perched raven atop a short pillar, head cocked to watch. */
export function ravenPerch(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.1, 10), pal.trim);
  pillar.position.y = 0.55;
  pillar.castShadow = true;
  g.add(pillar);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.08, 10), pal.body);
  cap.position.y = 1.14;
  g.add(cap);
  const ravenMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0f, roughness: 0.7 });
  const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), ravenMat);
  bodyMesh.userData.disposeMaterial = true;
  bodyMesh.scale.set(1, 1.1, 1.4);
  bodyMesh.position.set(0, 1.3, 0);
  g.add(bodyMesh);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), ravenMat);
  head.position.set(0, 1.42, 0.12);
  head.rotation.y = rng.jitter(0.4);
  g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.09, 6), pal.glow(0xffc24a));
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 1.42, 0.2);
  g.add(beak);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 4), ravenMat);
  tail.rotation.x = -Math.PI / 2.4;
  tail.position.set(0, 1.28, -0.16);
  g.add(tail);
  return g;
}
