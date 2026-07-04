import * as THREE from 'three';
import * as S from '@/scenery';
import type { RoomSpec } from '@/scenery/compose';
import { approach, type GameCtx, type RoomGame } from '@/scenery/play';

/**
 * "The Hollow Manor" — a gothic three-stage adventure built from the manor +
 * gothic library sets. Each stage introduces a distinct new mechanic:
 *   1. Drawing Room  — set the grandfather clock to the master's death hour,
 *      then a portrait swings aside to a wall safe (carry out: LIBRARY KEY).
 *   2. Library       — play the organ in the sheet-music order, then pull the
 *      three numbered volumes so the bookcase pivots to a hidden stair.
 *   3. Séance Chamber— spell what haunts the house on the spirit board.
 *
 * Handles wired: clock, portraits, hearth, safe (S1); organ, bookcase (S2);
 * table, mirror (S3).
 */

const WALL = (d: number): number => -d / 2 + 0.22; // far-wall inset for flush props

// ── Stage 1 — The Drawing Room ───────────────────────────────────────────────

const S1 = { w: 9, h: 3.6, d: 11 };
const MASTER = 3; // which portrait hides the safe
const DEATH_HOUR = 3; // set the clock here

export const drawingRoomSpec: RoomSpec = {
  name: 'The Drawing Room',
  paletteName: 'gothic',
  seed: 'manor-drawing:v1',
  size: S1,
  shell: { floor: 0x2a2028, walls: 0x241d2a, ceiling: 0x181420 },
  lighting: {
    ambient: { color: 0x2a2338, intensity: 0.5 },
    points: [
      { x: -2.0, y: 1.0, z: WALL(S1.d) + 0.3, color: 0xff8a3a, intensity: 12, distance: 7 }, // hearth
      { x: 2.4, y: 2.2, z: 1.5, color: 0xffcf8a, intensity: 8, distance: 7 }, // candelabra pool
      { x: 0, y: 3.2, z: 0, color: 0x8a4aff, intensity: 5, distance: 12 }, // cold accent
    ],
  },
  pieces: [
    { id: 'clock', at: [-3.5, -1.5], clearRadius: 0.8, build: (rng, pal) => S.grandfatherClock(rng, pal) },
    { id: 'hearth', at: [-2.0, WALL(S1.d)], clearRadius: 1.2, build: (rng, pal) => S.hearthFireplace(rng, pal) },
    { id: 'portraits', at: [1.9, WALL(S1.d) - 0.05], clearRadius: 0.3, build: (rng, pal) => S.portraitRow(rng, pal, { count: 4 }) },
    { id: 'safe', at: [3.07, WALL(S1.d) + 0.4], clearRadius: 0.7, build: (rng, pal) => S.safeBox(rng, pal) },
    { at: [2.6, 1.8], build: (rng, pal) => S.candelabra(rng, pal) },
    { at: [-3.6, 2.6], build: (rng, pal) => S.ravenPerch(rng, pal) },
    { at: [3.4, 3.0], rotY: -0.6, build: (rng, pal) => S.dustSheetChair(rng, pal) },
    { at: [0, 2], clearRadius: 0, build: (rng) => S.dustMotes(rng, { width: S1.w - 1, height: S1.h, depth: S1.d - 1, count: 160 }) },
    { at: [-S1.w / 2 + 0.2, 0], clearRadius: 0, build: (rng, pal) => S.cobweb(rng, pal, { size: 1.1 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('manor:clock-tick') },
  ],
  scatter: [{ count: 3, build: (rng, pal) => S.gravelPatch(rng, pal, { radius: 0.4 }) }],
};

export function drawingRoomGame(
  handles: Record<string, unknown>,
  ctx: GameCtx,
  carry: Record<string, unknown>,
): RoomGame {
  const clock = handles.clock as ReturnType<typeof S.grandfatherClock>;
  const portraits = handles.portraits as ReturnType<typeof S.portraitRow>;
  const hearth = handles.hearth as ReturnType<typeof S.hearthFireplace>;
  const safe = handles.safe as ReturnType<typeof S.safeBox>;

  let readHearth = false;
  let hour = 12;
  let caseOpen = false;
  let hasKey = false;
  let safeRevealed = false;
  let safeOpen = false;

  ctx.setObjective('Locked in the drawing room. The manor hides its exits behind its dead.');
  ctx.setHint(
    'Read the fireplace note, then the portraits — the master died at the THIRD hour. Wind the grandfather clock to 3 o’clock to spring its case for a key, then the master’s portrait swings aside to a wall safe.',
  );

  ctx.register('hearth', hearth.group, () => {
    readHearth = true;
    ctx.toast('A charred note in the grate: "The hour of my death opens the case. — ask the faces."');
    ctx.setObjective('Inspect the portraits.');
  });

  ctx.register('portraits', portraits.group, () => {
    ctx.toast(
      readHearth
        ? 'The MASTER’s brass plaque: "d. III o’clock." The others died by day.'
        : 'Four grim ancestors. One plaque reads "d. III o’clock," but of whom?',
    );
    ctx.setObjective('Set the grandfather clock to 3 o’clock.');
  });

  ctx.register('clock', clock.group, () => {
    if (!caseOpen) {
      hour = (hour % 12) + 1;
      ctx.toast(`The hands grind to ${hour} o’clock.`);
      if (hour === DEATH_HOUR) {
        caseOpen = true;
        ctx.toast('A chime, then a clunk — the clock case swings open on a brass KEY.');
        ctx.setObjective('Take the key from the clock case.');
      }
      return;
    }
    if (!hasKey) {
      hasKey = true;
      safeRevealed = true;
      ctx.toast('You pocket the key. Across the room, the master’s portrait yawns from the wall…');
      ctx.setObjective('A safe hid behind the portrait. Open it.');
    }
  });

  ctx.register('safe', safe.group, () => {
    if (!safeRevealed) {
      ctx.toast('You rap the wall — hollow behind that portrait. Something is set into it.');
      return;
    }
    if (!hasKey) {
      ctx.toast('The safe is locked. It wants a small brass key.');
      return;
    }
    if (safeOpen) return;
    safeOpen = true;
    carry.libraryKey = true; // travels to the Library
    ctx.win('Inside the safe: the iron LIBRARY KEY. Its door unbars with a groan.');
  });

  // Rest pose for animated parts.
  clock.minuteHand.rotation.z = 0;
  const pendulumBase = clock.pendulum.rotation.z;
  return {
    update: (delta, elapsed) => {
      // Hour hand eases to the set hour (clockwise = negative on the +Z face).
      clock.hourHand.rotation.z = approach(clock.hourHand.rotation.z, -(hour / 12) * Math.PI * 2, delta, 3);
      clock.minuteHand.rotation.z = approach(clock.minuteHand.rotation.z, 0, delta, 3);
      clock.pendulum.rotation.z = pendulumBase + Math.sin(elapsed * 2.2) * 0.18;
      if (caseOpen) clock.door.rotation.y = approach(clock.door.rotation.y, -1.2, delta, 2);
      if (safeRevealed) {
        portraits.frames[MASTER].rotation.y = approach(portraits.frames[MASTER].rotation.y, -1.35, delta, 2);
      }
      if (safeOpen) safe.door.rotation.y = approach(safe.door.rotation.y, -1.4, delta, 2);
      hearth.flameMaterials.forEach((m, i) => {
        m.emissiveIntensity = 1.3 + Math.sin(elapsed * 8 + i * 1.7) * 0.5;
      });
    },
  };
}

// ── Stage 2 — The Library ────────────────────────────────────────────────────

const S2 = { w: 10, h: 3.8, d: 11 };
const ORGAN_TUNE = [3, 1, 4, 2, 3]; // key indices to press, in order
const BOOK_CODE = [2, 8, 15]; // 0-based spine indices (3rd, 9th, 16th)

export const librarySpec: RoomSpec = {
  name: 'The Library',
  paletteName: 'gothic',
  seed: 'manor-library:v1',
  size: S2,
  shell: { floor: 0x241c22, walls: 0x201a26, ceiling: 0x15111c },
  lighting: {
    ambient: { color: 0x2b2440, intensity: 0.55 },
    points: [
      { x: -2.5, y: 2.4, z: 1.0, color: 0xffcf8a, intensity: 9, distance: 8 },
      { x: 3.0, y: 2.2, z: -2.0, color: 0xffb060, intensity: 7, distance: 7 },
      { x: 0, y: 3.4, z: 0, color: 0x8a4aff, intensity: 4, distance: 12 },
    ],
  },
  pieces: [
    { id: 'bookcase', at: [-3.4, WALL(S2.d)], clearRadius: 1.0, build: (rng, pal) => S.secretBookcase(rng, pal, { books: 7 }) },
    { id: 'organ', at: [2.6, WALL(S2.d) + 0.4], rotY: 0, clearRadius: 1.2, build: (rng, pal) => S.pipeOrgan(rng, pal, { keys: 7 }) },
    { at: [-3.2, 2.8], build: (rng, pal) => S.candelabra(rng, pal) },
    { at: [3.6, 3.2], rotY: -0.7, build: (rng, pal) => S.dustSheetChair(rng, pal) },
    { at: [0, 3.0], rotY: 0, build: (rng, pal) => S.bookRow(rng, pal, { length: 1.4 }) },
    { at: [S2.w / 2 - 0.2, -3], clearRadius: 0, build: (rng, pal) => S.cobweb(rng, pal, { size: 1.1 }) },
    { at: [0, 2], clearRadius: 0, build: (rng) => S.dustMotes(rng, { width: S2.w - 1, height: S2.h, depth: S2.d - 1, count: 160 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('manor:wind') },
  ],
};

export function libraryGame(
  handles: Record<string, unknown>,
  ctx: GameCtx,
  carry: Record<string, unknown>,
): RoomGame {
  const organ = handles.organ as ReturnType<typeof S.pipeOrgan>;
  const bookcase = handles.bookcase as ReturnType<typeof S.secretBookcase>;

  let readMusic = false;
  let pressed: number[] = [];
  let organDone = false;
  const pulled = new Set<number>();
  let caseOpen = false;
  const keyDip = new Map<number, number>(); // key index → remaining dip time

  ctx.setObjective(
    carry.libraryKey ? 'The library door opens. A way down must be hidden here.' : 'The library. Find the way down.',
  );
  ctx.setHint(
    'The organ’s sheet music gives a five-note order (keys 4-2-5-3-4). Play it to unlatch the shelves, then pull the three volumes the slip names (3rd, 9th, 16th) and the bookcase pivots open.',
  );

  ctx.register('organ', organ.group, () => {
    if (organDone) {
      ctx.toast('The organ sits silent, its work done.');
      return;
    }
    readMusic = true;
    ctx.toast('Sheet music on the rack: the notes fall to keys 4 · 2 · 5 · 3 · 4.');
    ctx.setObjective('Play the organ keys in that order (left key = 1).');
  });

  organ.keys.forEach((key, i) => {
    ctx.register(`key:${i}`, key, () => {
      if (organDone) return;
      if (!readMusic) {
        ctx.toast('You press a key — a mournful note swells. But in what order?');
        return;
      }
      keyDip.set(i, 0.25);
      pressed.push(i);
      const expected = ORGAN_TUNE[pressed.length - 1];
      if (i !== expected) {
        pressed = [];
        ctx.toast('The chord sours and dies. Begin the passage again.');
        return;
      }
      if (pressed.length === ORGAN_TUNE.length) {
        organDone = true;
        ctx.toast('The passage resolves. Behind the shelves, a heavy latch THUNKS. The bench slips ajar — a slip: III · IX · XVI.');
        ctx.setObjective('Pull the 3rd, 9th and 16th books.');
      } else {
        ctx.toast(`A note holds… (${pressed.length}/${ORGAN_TUNE.length})`);
      }
    });
  });

  bookcase.books.forEach((book, i) => {
    ctx.register(`book:${i}`, book, () => {
      if (!organDone) {
        ctx.toast('The shelves won’t shift — something still holds them fast.');
        return;
      }
      if (caseOpen) return;
      if (!BOOK_CODE.includes(i)) {
        ctx.toast('Just a book. It thumps back into place.');
        return;
      }
      if (pulled.has(i)) return;
      pulled.add(i);
      book.userData.pulled = true;
      ctx.toast(`A volume tilts out with a click. (${pulled.size}/${BOOK_CODE.length})`);
      if (pulled.size === BOOK_CODE.length) {
        caseOpen = true;
        ctx.win('The whole bookcase grinds aside on a hidden pivot — a stair spirals down into the dark.');
      }
    });
  });

  return {
    update: (delta) => {
      for (const [i, t] of keyDip) {
        const key = organ.keys[i];
        const remaining = t - delta;
        key.position.y = 0.96 - (remaining > 0 ? 0.02 : 0);
        if (remaining <= 0) keyDip.delete(i);
        else keyDip.set(i, remaining);
      }
      for (const i of pulled) {
        const book = bookcase.books[i];
        book.rotation.x = approach(book.rotation.x, -0.5, delta, 4); // tilts out
      }
      if (caseOpen) bookcase.bookcase.rotation.y = approach(bookcase.bookcase.rotation.y, -1.3, delta, 1.6);
    },
  };
}

// ── Stage 3 — The Séance Chamber ─────────────────────────────────────────────

const S3 = { w: 9, h: 3.4, d: 10 };
const BOARD_LETTERS = ['R', 'A', 'V', 'E', 'N', 'S', 'T', 'O'];
const SPELL = [0, 1, 2, 3, 4]; // R-A-V-E-N

export const seanceSpec: RoomSpec = {
  name: 'The Séance Chamber',
  paletteName: 'gothic',
  seed: 'manor-seance:v1',
  size: S3,
  shell: { floor: 0x201824, walls: 0x1c1622, ceiling: 0x120e18 },
  lighting: {
    ambient: { color: 0x241d33, intensity: 0.45 },
    points: [
      { x: 0, y: 1.6, z: 0, color: 0x9dff5a, intensity: 6, distance: 6 }, // cauldron/board glow
      { x: -3.0, y: 2.2, z: -2.5, color: 0xffcf8a, intensity: 6, distance: 6 },
      { x: 0, y: 3.0, z: 0, color: 0x8a4aff, intensity: 6, distance: 12 },
    ],
  },
  pieces: [
    { id: 'table', at: [0, 0.5], clearRadius: 1.2, build: (rng, pal) => S.seanceTable(rng, pal, { letters: 8 }) },
    { id: 'mirror', at: [-3.6, WALL(S3.d)], clearRadius: 0.6, build: (rng, pal) => S.brokenMirror(rng, pal) },
    { at: [3.3, WALL(S3.d) + 0.2], build: (rng, pal) => S.cryptNiche(rng, pal) },
    { at: [3.4, 2.6], build: (rng, pal) => S.cauldron(rng, pal) },
    { at: [-3.4, 2.8], build: (rng, pal) => S.candelabra(rng, pal) },
    { at: [-2.4, -3.2], rotY: 0.5, build: (rng, pal) => S.coffin(rng, pal).group },
    { at: [2.2, -3.4], build: (rng, pal) => S.ravenPerch(rng, pal) },
    { at: [0, 2], clearRadius: 0, build: (rng) => S.dustMotes(rng, { width: S3.w - 1, height: S3.h, depth: S3.d - 1, count: 180 }) },
    { at: [0, 0], clearRadius: 0, build: () => S.soundMarker('manor:whisper') },
  ],
};

export function seanceGame(
  handles: Record<string, unknown>,
  ctx: GameCtx,
  _carry: Record<string, unknown>,
): RoomGame {
  const table = handles.table as ReturnType<typeof S.seanceTable>;

  let asked = false;
  let spelled: number[] = [];
  let done = false;
  const target = new THREE.Vector3().copy(table.planchette.position);

  ctx.setObjective('The chamber below. The board will not speak until it is asked.');
  ctx.setHint(
    'Read the fogged mirror — it names the bird that watches from every room. Spell it on the spirit board: R-A-V-E-N.',
  );

  ctx.register('mirror', handles.mirror as THREE.Group, () => {
    asked = true;
    ctx.toast('The glass fogs, then clears around one word — the black bird that watches every room. NAME IT.');
    ctx.setObjective('Spell it on the spirit board.');
  });

  table.letterSlots.forEach((slot, i) => {
    ctx.register(`letter:${i}`, slot, () => {
      if (done) return;
      if (!asked) {
        ctx.toast('The planchette drifts, then stills. The board waits to be asked a question.');
        return;
      }
      const step = SPELL[spelled.length];
      if (i === step) {
        spelled.push(i);
      } else if (i === SPELL[0]) {
        spelled = [i]; // restart cleanly on the first letter
      } else {
        spelled = [];
        ctx.toast('The planchette jerks back to the centre. That letter is wrong.');
        target.set(0, table.planchette.position.y, 0);
        return;
      }
      target.copy(slot.position);
      target.y = table.planchette.position.y;
      const letter = BOARD_LETTERS[i];
      if (spelled.length === SPELL.length) {
        done = true;
        ctx.toast('R–A–V–E–N. The planchette flies to GOODBYE.');
        ctx.win('Every candle gutters out at once — and the chamber door yawns wide. You flee the Hollow Manor into the night.');
      } else {
        ctx.toast(`The planchette slides to ${letter}… (${spelled.length}/${SPELL.length})`);
      }
    });
  });

  return {
    update: (delta, elapsed) => {
      table.planchette.position.x = approach(table.planchette.position.x, target.x, delta, 5);
      table.planchette.position.z = approach(table.planchette.position.z, target.z, delta, 5);
      // Board letters pulse; the current target letter burns brighter.
      table.letterSlots.forEach((slot, i) => {
        const mark = slot.children[0] as THREE.Mesh;
        const mat = mark.material as THREE.MeshStandardMaterial;
        const isNext = asked && !done && SPELL[spelled.length] === i;
        mat.emissiveIntensity = (isNext ? 1.8 : 0.5) + Math.sin(elapsed * 4 + i) * 0.2;
      });
    },
  };
}
