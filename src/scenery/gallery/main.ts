import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Engine } from '@/core/Engine';
import {
  Rng,
  applyPlacement,
  barrelCluster,
  barrierLine,
  bioPodCluster,
  cableRun,
  catwalk,
  collapsedSlab,
  conduitRun,
  crateStack,
  createAlphaKit,
  createBetaKit,
  deadTree,
  disposeSceneryObject,
  fernCluster,
  gantryFrame,
  grimeStreak,
  hangingVines,
  hazardDecal,
  holoSign,
  ivyClimb,
  lightStrip,
  monitorWall,
  mossPatch,
  pillar,
  pipeManifold,
  puddle,
  ring,
  rootSystem,
  rubblePile,
  serverRack,
  stalactites,
  terminalKiosk,
  ventStack,
  type SharedMats,
} from '@/scenery';
import {
  archway,
  bookRow,
  bottleCluster,
  bunkBed,
  cabinet,
  cableCoil,
  ceilingBeams,
  centrifuge,
  consoleBank,
  controlPanel,
  coolingFan,
  createStandardPalettes,
  doorFrame,
  floorGrate,
  gasCylinders,
  generatorUnit,
  lightFixture,
  lockerBank,
  noticeBoard,
  palletStack,
  paperScatter,
  partitionScreen,
  platformDais,
  pumpAssembly,
  railing,
  shelvingUnit,
  smallCrates,
  stairFlight,
  stool,
  storageTank,
  swivelChair,
  tarpPile,
  toolScatter,
  wallPanelling,
  windowFrame,
  workDesk,
  type Palette,
} from '@/scenery';
// The newest categories are numerous — pull them in via a namespace to keep
// the import lists sane.
import * as S from '@/scenery';

/**
 * Scenery gallery — a museum floor of every builder in src/scenery/, so new
 * assets can be eyeballed in isolation before they're composed into rooms.
 * Dev-only page: `npm run dev`, then open /gallery.html.
 *
 *   drag/scroll  orbit + zoom
 *   [R]          reseed every exhibit (proves the parametric variation)
 *   [T]          cycle light mood: showroom → Alpha dusk → Beta clinical
 */

interface Built {
  object: THREE.Object3D;
  update?: (delta: number, elapsed: number) => void;
}

interface Exhibit {
  name: string;
  build: (rng: Rng) => Built;
}

const alphaKit = createAlphaKit();
const betaKit = createBetaKit();

/** Concrete backdrop panel for wall-mounted exhibits (decals, ivy, monitors). */
function backdrop(material: THREE.Material): THREE.Mesh {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.4, 0.08), material);
  wall.position.set(0, 1.2, -0.1);
  return wall;
}

/** Overhead mount bar for exhibits that hang (vines, stalactites, cables). */
function overhead(material: THREE.Material, width = 2.6): THREE.Mesh {
  const bar = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.4), material);
  bar.position.y = 2.3;
  return bar;
}

const ALPHA_EXHIBITS: Exhibit[] = [
  { name: 'rootSystem', build: (rng) => ({ object: rootSystem(rng, alphaKit) }) },
  {
    name: 'hangingVines',
    build: (rng) => {
      const g = new THREE.Group();
      g.add(overhead(alphaKit.rustDark));
      const vines = hangingVines(rng, alphaKit, { span: 2.4, count: 7, drop: 1.9 });
      vines.position.y = 2.26;
      g.add(vines);
      return { object: g };
    },
  },
  { name: 'mossPatch', build: (rng) => ({ object: mossPatch(rng, alphaKit, { radius: 0.7 }) }) },
  { name: 'fernCluster', build: (rng) => ({ object: fernCluster(rng, alphaKit, { scale: 1.4 }) }) },
  { name: 'rubblePile', build: (rng) => ({ object: rubblePile(rng, alphaKit) }) },
  { name: 'collapsedSlab', build: (rng) => ({ object: collapsedSlab(rng, alphaKit) }) },
  {
    name: 'stalactites',
    build: (rng) => {
      const g = new THREE.Group();
      const slab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 2.2), alphaKit.concrete);
      slab.position.y = 2.4;
      g.add(slab);
      const spikes = stalactites(rng, alphaKit, { width: 1.9, depth: 1.9, count: 10 });
      spikes.position.y = 2.34;
      g.add(spikes);
      return { object: g };
    },
  },
  {
    name: 'bioPodCluster',
    build: (rng) => {
      const { group, material } = bioPodCluster(rng, alphaKit, {
        color: 0xff3fb0,
        scale: 1.4,
        withLight: true,
      });
      return {
        object: group,
        update: (_d, e) => {
          material.emissiveIntensity = 1.6 + Math.sin(e * 1.3) * 0.8;
        },
      };
    },
  },
  { name: 'puddle', build: (rng) => ({ object: puddle(rng, alphaKit, { radius: 0.9 }) }) },
  { name: 'deadTree', build: (rng) => ({ object: deadTree(rng, alphaKit) }) },
  {
    name: 'grimeStreak',
    build: (rng) => {
      const g = new THREE.Group();
      g.add(backdrop(alphaKit.concrete));
      const streak = grimeStreak(rng, { width: 1, height: 1.7 });
      streak.position.set(0, 1.5, -0.05);
      g.add(streak);
      return { object: g };
    },
  },
  {
    name: 'ivyClimb',
    build: (rng) => {
      const g = new THREE.Group();
      g.add(backdrop(alphaKit.concrete));
      const ivy = ivyClimb(rng, alphaKit, { width: 1.6, height: 2.2 });
      ivy.position.z = -0.05;
      g.add(ivy);
      return { object: g };
    },
  },
];

const BETA_EXHIBITS: Exhibit[] = [
  {
    name: 'cableRun',
    build: (rng) => {
      const g = new THREE.Group();
      for (const x of [-1.3, 1.3]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.2, 8), betaKit.black);
        post.position.set(x, 1.1, 0);
        g.add(post);
      }
      g.add(
        cableRun(rng, betaKit, new THREE.Vector3(-1.3, 2.15, 0), new THREE.Vector3(1.3, 2.05, 0)),
      );
      return { object: g };
    },
  },
  {
    name: 'conduitRun',
    build: (rng) => {
      const g = conduitRun(rng, betaKit, { length: 2.6, pipes: 4 });
      g.rotation.y = Math.PI / 2; // face the run toward the aisle
      return { object: g };
    },
  },
  {
    name: 'serverRack',
    build: (rng) => {
      const { group, statusMaterial } = serverRack(rng, betaKit);
      return {
        object: group,
        update: (_d, e) => {
          statusMaterial.color.setHex(Math.sin(e * 5) > 0 ? 0x2bff88 : 0x0a3320);
        },
      };
    },
  },
  { name: 'ventStack', build: (rng) => ({ object: ventStack(rng, betaKit) }) },
  {
    name: 'holoSign',
    build: () => {
      const { group, material } = holoSign('EXIT', { size: 1 });
      group.position.y = 1.6;
      return {
        object: group,
        update: (_d, e) => {
          // Unstable projector: mostly steady, with a sharp stutter.
          material.opacity = 0.75 + Math.sin(e * 9) * 0.1 + (Math.sin(e * 31) > 0.96 ? -0.4 : 0);
        },
      };
    },
  },
  {
    name: 'lightStrip',
    build: () => {
      const strip = lightStrip(betaKit, { length: 2.2, color: 0x1fd1ff });
      strip.rotation.y = Math.PI / 2;
      strip.position.y = 1;
      return { object: strip };
    },
  },
  { name: 'catwalk', build: (rng) => ({ object: catwalk(rng, betaKit, { length: 2.8 }) }) },
  {
    name: 'barrierLine',
    build: () => ({
      object: barrierLine(betaKit, new THREE.Vector3(-1.2, 0, 0), new THREE.Vector3(1.2, 0, 0)),
    }),
  },
  { name: 'pipeManifold', build: (rng) => ({ object: pipeManifold(rng, betaKit) }) },
  {
    name: 'terminalKiosk',
    build: (rng) => {
      const { group, screenMaterial } = terminalKiosk(rng, betaKit);
      return {
        object: group,
        update: (_d, e) => {
          screenMaterial.emissiveIntensity = 1.3 + Math.sin(e * 2.2) * 0.25;
        },
      };
    },
  },
  { name: 'hazardDecal', build: () => ({ object: hazardDecal({ length: 2.4, width: 0.4 }) }) },
  {
    name: 'monitorWall',
    build: (rng) => {
      const { group, screenMaterials } = monitorWall(rng, betaKit, { cols: 3, rows: 3 });
      return {
        object: group,
        update: (_d, e) => {
          screenMaterials.forEach((mat, i) => {
            mat.emissiveIntensity = 1.1 + Math.sin(e * 3 + i * 1.7) * 0.5;
          });
        },
      };
    },
  },
];

/**
 * Shared-silhouette exhibits are built TWICE from identically-labelled forks
 * (same stream ⇒ same shape) with each dimension's materials — the pair
 * standing side by side is the mirrored-footprint rule made visible.
 */
const SHARED_BUILDERS: Array<{
  name: string;
  build: (rng: Rng, mats: SharedMats) => THREE.Object3D;
}> = [
  { name: 'crateStack', build: (rng, mats) => crateStack(rng, mats) },
  { name: 'pillar', build: (_rng, mats) => pillar(mats, { height: 2.6 }) },
  { name: 'barrelCluster', build: (rng, mats) => barrelCluster(rng, mats) },
  { name: 'gantryFrame', build: (_rng, mats) => gantryFrame(mats, { span: 1.8, height: 2.2 }) },
];

const SHARED_EXHIBITS: Exhibit[] = SHARED_BUILDERS.map(({ name, build }) => ({
  name,
  build: (rng) => {
    const g = new THREE.Group();
    const alphaSkin = build(rng.fork('shape'), { body: alphaKit.bark, trim: alphaKit.rust });
    alphaSkin.position.x = -1;
    const betaSkin = build(rng.fork('shape'), { body: betaKit.shell, trim: betaKit.black });
    betaSkin.position.x = 1;
    g.add(alphaSkin, betaSkin);
    return { object: g };
  },
}));

/**
 * Palette-driven exhibits wear the stock palettes in rotation (exhibit i gets
 * palette i mod N), so one glance down an aisle shows the builders × palettes
 * multiplier at work. Nameplates carry the palette name.
 */
const PALETTES = createStandardPalettes();
/** Look a stock palette up by name (for aisles pinned to their home theme). */
function themed(...names: string[]): Palette[] {
  return names.map((name) => {
    const found = PALETTES.find((p) => p.name === name);
    if (!found) throw new Error(`unknown palette ${name}`);
    return found;
  });
}

/** Anything a builder hands back: a plain group, a Built, or a handle object. */
type AnyBuilt = THREE.Object3D | Built | { group: THREE.Group };

function palExhibits(
  builders: Array<{
    name: string;
    build: (rng: Rng, pal: Palette) => AnyBuilt;
    /** Wall props get a backdrop panel; ceiling props get an overhead mount. */
    mount?: 'wall' | 'ceiling';
  }>,
  pals: Palette[] = PALETTES,
): Exhibit[] {
  const palFor = (i: number): Palette => pals[i % pals.length];
  return builders.map(({ name, build, mount }, i) => ({
    name: `${name} · ${palFor(i).name}`,
    build: (rng: Rng): Built => {
      const out = build(rng, palFor(i));
      const built: Built =
        out instanceof THREE.Object3D
          ? { object: out }
          : 'object' in out
            ? out
            : { object: out.group };
      if (mount === 'wall') {
        const wrap = new THREE.Group();
        wrap.add(backdrop(palFor(i).body), built.object);
        built.object = wrap;
      } else if (mount === 'ceiling') {
        const wrap = new THREE.Group();
        wrap.add(overhead(palFor(i).trim));
        built.object.position.y += 2.26;
        wrap.add(built.object);
        built.object = wrap;
      }
      return built;
    },
  }));
}

const ARCHITECTURE_EXHIBITS = palExhibits([
  { name: 'doorFrame', build: (_rng, pal) => doorFrame(pal) },
  { name: 'archway', build: (_rng, pal) => archway(pal, { span: 1.8, height: 1.6 }) },
  { name: 'stairFlight', build: (_rng, pal) => stairFlight(pal) },
  { name: 'railing', build: (_rng, pal) => railing(pal, { length: 2.4 }) },
  { name: 'windowFrame', build: (rng, pal) => windowFrame(rng, pal) },
  {
    name: 'ceilingBeams',
    build: (rng, pal) => {
      const beams = ceilingBeams(rng, pal, { span: 2.4, depth: 2.2 });
      beams.position.y = 2.6;
      return beams;
    },
  },
  { name: 'platformDais', build: (_rng, pal) => platformDais(pal) },
  { name: 'floorGrate', build: (_rng, pal) => floorGrate(pal) },
  { name: 'wallPanelling', build: (rng, pal) => wallPanelling(rng, pal, { length: 2.4 }) },
]);

const FURNITURE_EXHIBITS = palExhibits([
  { name: 'workDesk', build: (rng, pal) => workDesk(rng, pal) },
  { name: 'swivelChair', build: (rng, pal) => swivelChair(rng, pal) },
  { name: 'shelvingUnit', build: (rng, pal) => shelvingUnit(rng, pal) },
  { name: 'lockerBank', build: (rng, pal) => lockerBank(rng, pal) },
  { name: 'stool', build: (_rng, pal) => stool(pal) },
  { name: 'bunkBed', build: (rng, pal) => bunkBed(rng, pal) },
  { name: 'cabinet', build: (rng, pal) => cabinet(rng, pal) },
  { name: 'noticeBoard', build: (rng, pal) => noticeBoard(rng, pal) },
  { name: 'partitionScreen', build: (rng, pal) => partitionScreen(rng, pal) },
]);

const MACHINE_EXHIBITS = palExhibits([
  { name: 'storageTank', build: (rng, pal) => storageTank(rng, pal) },
  { name: 'generatorUnit', build: (rng, pal) => generatorUnit(rng, pal) },
  { name: 'consoleBank', build: (rng, pal) => consoleBank(rng, pal) },
  { name: 'centrifuge', build: (rng, pal) => centrifuge(rng, pal) },
  { name: 'controlPanel', build: (rng, pal) => controlPanel(rng, pal) },
  { name: 'pumpAssembly', build: (rng, pal) => pumpAssembly(rng, pal) },
  { name: 'gasCylinders', build: (rng, pal) => gasCylinders(rng, pal) },
  {
    name: 'coolingFan',
    build: (_rng, pal) => {
      const { group, rotor } = coolingFan(pal);
      return {
        object: group,
        update: (delta: number) => {
          rotor.rotation.z += delta * 2.4;
        },
      };
    },
  },
]);

const CLUTTER_EXHIBITS = palExhibits([
  { name: 'bookRow', build: (rng, pal) => bookRow(rng, pal) },
  { name: 'bottleCluster', build: (rng, pal) => bottleCluster(rng, pal) },
  { name: 'toolScatter', build: (rng, pal) => toolScatter(rng, pal) },
  { name: 'paperScatter', build: (rng, pal) => paperScatter(rng, pal) },
  { name: 'cableCoil', build: (rng, pal) => cableCoil(rng, pal) },
  { name: 'palletStack', build: (rng, pal) => palletStack(rng, pal) },
  { name: 'tarpPile', build: (rng, pal) => tarpPile(rng, pal) },
  { name: 'smallCrates', build: (rng, pal) => smallCrates(rng, pal) },
  {
    name: 'lightFixture',
    build: (rng, pal) => {
      const g = new THREE.Group();
      const mount = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.3), pal.trim);
      mount.position.y = 2.5;
      g.add(mount);
      const lamp = lightFixture(rng, pal, { drop: 0.9 });
      lamp.position.y = 2.5;
      g.add(lamp);
      return g;
    },
  },
]);

const WALLART_EXHIBITS = palExhibits([
  { name: 'framedPhoto', mount: 'wall', build: (rng, pal) => S.framedPhoto(rng, pal) },
  { name: 'portraitPainting', mount: 'wall', build: (rng, pal) => S.portraitPainting(rng, pal) },
  { name: 'agedPoster', mount: 'wall', build: (rng, pal) => S.agedPoster(rng, pal) },
  { name: 'polaroidString', mount: 'wall', build: (rng, pal) => S.polaroidString(rng, pal) },
  { name: 'muralPanel', mount: 'wall', build: (rng, pal) => S.muralPanel(rng, pal, { width: 1.5, height: 1.4 }) },
  { name: 'blueprintPinup', mount: 'wall', build: (rng, pal) => S.blueprintPinup(rng, pal) },
  {
    name: 'wallClock',
    mount: 'wall',
    build: (_rng, pal) => {
      const { group, hourHand, minuteHand } = S.wallClock(pal);
      hourHand.rotation.z = -((10 + 10 / 60) / 12) * Math.PI * 2; // ten past ten
      minuteHand.rotation.z = -(10 / 60) * Math.PI * 2;
      return {
        object: group,
        update: (delta: number) => {
          minuteHand.rotation.z -= delta * 0.15; // visibly ticking along
        },
      };
    },
  },
  {
    name: 'lightboxSlide',
    mount: 'wall',
    build: (rng, pal) => {
      const { group, panelMaterial } = S.lightboxSlide(rng, pal);
      return {
        object: group,
        update: (_d: number, e: number) => {
          panelMaterial.emissiveIntensity = 1.1 + (Math.sin(e * 17) > 0.93 ? -0.5 : 0);
        },
      };
    },
  },
  { name: 'wallMirror', mount: 'wall', build: (_rng, pal) => S.wallMirror(pal) },
  { name: 'plaqueRow', mount: 'wall', build: (rng, pal) => S.plaqueRow(rng, pal) },
]);

const PUZZLE_INPUT_EXHIBITS = palExhibits([
  { name: 'keypad', mount: 'wall', build: (rng, pal) => S.keypad(rng, pal) },
  { name: 'combinationDial', mount: 'wall', build: (rng, pal) => S.combinationDial(rng, pal) },
  { name: 'rotaryRings', mount: 'wall', build: (rng, pal) => S.rotaryRings(rng, pal) },
  { name: 'leverBank', build: (rng, pal) => S.leverBank(rng, pal) },
  {
    name: 'sequenceButtons',
    mount: 'wall',
    build: (rng, pal) => {
      const { group, lampMaterials } = S.sequenceButtons(rng, pal);
      return {
        object: group,
        update: (_d: number, e: number) => {
          // Chase pattern — exactly what the real puzzle loop will drive.
          const active = Math.floor(e * 2) % lampMaterials.length;
          lampMaterials.forEach((m, i) => (m.emissiveIntensity = i === active ? 2.6 : 0.35));
        },
      };
    },
  },
  { name: 'wireFusePanel', mount: 'wall', build: (rng, pal) => S.wireFusePanel(rng, pal) },
  {
    name: 'crankWheel',
    mount: 'wall',
    build: (rng, pal) => {
      const { group, crank } = S.crankWheel(rng, pal);
      return { object: group, update: (delta: number) => void (crank.rotation.z += delta * 0.8) };
    },
  },
  { name: 'slideRail', mount: 'wall', build: (_rng, pal) => S.slideRail(pal) },
  { name: 'pressurePlate', build: (rng, pal) => S.pressurePlate(rng, pal) },
  { name: 'patchBoard', mount: 'wall', build: (rng, pal) => S.patchBoard(rng, pal) },
]);

const PUZZLE_OBJECT_EXHIBITS = palExhibits([
  { name: 'lockedChest', build: (rng, pal) => S.lockedChest(rng, pal) },
  { name: 'safeBox', build: (rng, pal) => S.safeBox(rng, pal) },
  { name: 'balanceScale', build: (rng, pal) => S.balanceScale(rng, pal) },
  { name: 'symbolTiles', build: (rng, pal) => S.symbolTiles(rng, pal) },
  { name: 'pivotMirror', build: (rng, pal) => S.pivotMirror(rng, pal) },
  { name: 'weightSet', build: (rng, pal) => S.weightSet(rng, pal) },
  { name: 'glyphPillar', build: (rng, pal) => S.glyphPillar(rng, pal) },
  { name: 'chimeRack', build: (rng, pal) => S.chimeRack(rng, pal) },
  {
    name: 'runeFloor',
    build: (rng, pal) => {
      const { group, runeMaterials } = S.runeFloor(rng, pal);
      return {
        object: group,
        update: (_d: number, e: number) => {
          const active = Math.floor(e * 1.5) % runeMaterials.length;
          runeMaterials.forEach((m, i) => (m.emissiveIntensity = i <= active ? 2.2 : 0.3));
        },
      };
    },
  },
  { name: 'keyRelics', build: (rng, pal) => S.keyRelics(rng, pal) },
]);

const LAB_EXHIBITS = palExhibits([
  { name: 'microscope', build: (rng, pal) => S.microscope(rng, pal) },
  { name: 'burnerRig', build: (rng, pal) => S.burnerRig(rng, pal) },
  { name: 'specimenJars', build: (rng, pal) => S.specimenJars(rng, pal) },
  { name: 'fumeHood', build: (rng, pal) => S.fumeHood(rng, pal) },
  { name: 'sampleFridge', build: (rng, pal) => S.sampleFridge(rng, pal) },
  { name: 'testTubeRack', build: (rng, pal) => S.testTubeRack(rng, pal) },
  { name: 'autoclave', build: (rng, pal) => S.autoclave(rng, pal) },
  { name: 'petriStack', build: (rng, pal) => S.petriStack(rng, pal) },
  { name: 'labScale', build: (rng, pal) => S.labScale(rng, pal) },
  { name: 'chemicalShelf', mount: 'wall', build: (rng, pal) => S.chemicalShelf(rng, pal) },
]);

const MEDICAL_EXHIBITS = palExhibits([
  { name: 'gurney', build: (rng, pal) => S.gurney(rng, pal) },
  { name: 'ivStand', build: (rng, pal) => S.ivStand(rng, pal) },
  { name: 'medCabinet', mount: 'wall', build: (rng, pal) => S.medCabinet(rng, pal) },
  { name: 'surgicalLight', build: (_rng, pal) => S.surgicalLight(pal) },
  { name: 'wheelchair', build: (rng, pal) => S.wheelchair(rng, pal) },
  { name: 'biohazardBin', build: (rng, pal) => S.biohazardBin(rng, pal) },
  { name: 'defibUnit', build: (rng, pal) => S.defibUnit(rng, pal) },
  { name: 'privacyScreen', build: (rng, pal) => S.privacyScreen(rng, pal) },
  { name: 'xrayViewer', mount: 'wall', build: (rng, pal) => S.xrayViewer(rng, pal) },
  { name: 'scannerArch', build: (rng, pal) => S.scannerArch(rng, pal) },
]);

const INDUSTRIAL_EXHIBITS = palExhibits([
  {
    name: 'conveyorSegment',
    build: (rng, pal) => {
      const { group, rollers } = S.conveyorSegment(rng, pal);
      return {
        object: group,
        update: (delta: number) => rollers.forEach((r) => void (r.rotation.y += delta * 2)),
      };
    },
  },
  { name: 'chainHoist', mount: 'ceiling', build: (rng, pal) => S.chainHoist(rng, pal) },
  { name: 'workbenchVice', build: (rng, pal) => S.workbenchVice(rng, pal) },
  { name: 'toolWall', mount: 'wall', build: (rng, pal) => S.toolWall(rng, pal) },
  {
    name: 'furnaceBox',
    build: (rng, pal) => {
      const { group, mouthMaterial } = S.furnaceBox(rng, pal);
      return {
        object: group,
        update: (_d: number, e: number) => {
          mouthMaterial.emissiveIntensity = 2 + Math.sin(e * 7) * 0.4 + Math.sin(e * 13) * 0.25;
        },
      };
    },
  },
  { name: 'anvilBlock', build: (rng, pal) => S.anvilBlock(rng, pal) },
  { name: 'leaningLadder', mount: 'wall', build: (rng, pal) => S.leaningLadder(rng, pal) },
  { name: 'scaffoldTower', build: (rng, pal) => S.scaffoldTower(rng, pal) },
  { name: 'cableReel', build: (rng, pal) => S.cableReel(rng, pal) },
  { name: 'pipeBridge', mount: 'ceiling', build: (rng, pal) => S.pipeBridge(rng, pal) },
]);

const STORAGE_EXHIBITS = palExhibits([
  { name: 'shippingContainer', build: (rng, pal) => S.shippingContainer(rng, pal, { length: 2.2 }) },
  { name: 'filingCabinet', build: (rng, pal) => S.filingCabinet(rng, pal) },
  { name: 'archiveShelf', build: (rng, pal) => S.archiveShelf(rng, pal) },
  { name: 'cageLockup', build: (rng, pal) => S.cageLockup(rng, pal) },
  { name: 'cargoNetPile', build: (rng, pal) => S.cargoNetPile(rng, pal) },
  { name: 'cratePyramid', build: (rng, pal) => S.cratePyramid(rng, pal) },
  { name: 'handTruck', build: (rng, pal) => S.handTruck(rng, pal) },
  { name: 'spoolRack', build: (rng, pal) => S.spoolRack(rng, pal) },
  { name: 'coatRail', mount: 'wall', build: (rng, pal) => S.coatRail(rng, pal) },
  { name: 'drumRack', build: (rng, pal) => S.drumRack(rng, pal) },
]);

const LIGHTING_EXHIBITS = palExhibits([
  { name: 'wallSconce', mount: 'wall', build: (rng, pal) => S.wallSconce(rng, pal) },
  { name: 'floodlightTripod', build: (rng, pal) => S.floodlightTripod(rng, pal) },
  {
    name: 'emergencyBeacon',
    build: (rng, pal) => {
      const { group, rotor, glowMaterial } = S.emergencyBeacon(rng, pal);
      group.position.y = 1; // dome is tiny — raise it on a virtual post height
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1, 8), pal.trim);
      post.position.y = 0.5;
      const wrap = new THREE.Group();
      wrap.add(post, group);
      return {
        object: wrap,
        update: (delta: number, e: number) => {
          rotor.rotation.y += delta * 6;
          glowMaterial.emissiveIntensity = 1.8 + Math.sin(e * 6) * 0.7;
        },
      };
    },
  },
  {
    name: 'neonSign',
    mount: 'wall',
    build: (rng, pal) => {
      const { group, tubeMaterial } = S.neonSign(rng, pal);
      return {
        object: group,
        update: (_d: number, e: number) => {
          tubeMaterial.emissiveIntensity = 2.4 + (Math.sin(e * 23) > 0.9 ? -1.6 : 0);
        },
      };
    },
  },
  { name: 'candleCluster', build: (rng, pal) => S.candleCluster(rng, pal) },
  { name: 'hangingLantern', mount: 'ceiling', build: (rng, pal) => S.hangingLantern(rng, pal) },
  { name: 'stringLights', mount: 'ceiling', build: (rng, pal) => S.stringLights(rng, pal, { span: 2.6 }) },
  { name: 'spotRig', build: (rng, pal) => S.spotRig(rng, pal) },
  { name: 'glowRope', build: (rng, pal) => S.glowRope(rng, pal, { length: 2.6 }) },
  { name: 'lightPanel', mount: 'wall', build: (_rng, pal) => S.lightPanel(pal) },
]);

const HIGHTECH_EXHIBITS = palExhibits([
  { name: 'holoTable', build: (rng, pal) => S.holoTable(rng, pal) },
  { name: 'antennaMast', build: (rng, pal) => S.antennaMast(rng, pal) },
  {
    name: 'radarDish',
    build: (rng, pal) => {
      const { group, dish } = S.radarDish(rng, pal);
      return { object: group, update: (delta: number) => void (dish.rotation.y += delta * 0.7) };
    },
  },
  { name: 'robotArm', build: (rng, pal) => S.robotArm(rng, pal) },
  { name: 'chargeDock', build: (rng, pal) => S.chargeDock(rng, pal) },
  { name: 'droneRack', build: (rng, pal) => S.droneRack(rng, pal) },
  { name: 'sensorPylon', build: (rng, pal) => S.sensorPylon(rng, pal) },
  {
    name: 'surveillanceCamera',
    mount: 'wall',
    build: (rng, pal) => {
      const { group, yoke } = S.surveillanceCamera(rng, pal);
      return {
        object: group,
        update: (_d: number, e: number) => void (yoke.rotation.y = Math.sin(e * 0.6) * 0.6),
      };
    },
  },
  { name: 'serverTotem', build: (rng, pal) => S.serverTotem(rng, pal) },
  { name: 'controlLectern', build: (rng, pal) => S.controlLectern(rng, pal) },
]);

// ── Theme aisles: each pinned to its home palette(s) ────────────────────────
const EGYPTIAN_EXHIBITS = palExhibits(
  [
    { name: 'obelisk', build: (rng, pal) => S.obelisk(rng, pal) },
    { name: 'sarcophagus', build: (rng, pal) => S.sarcophagus(rng, pal) },
    { name: 'hieroglyphPanel', build: (rng, pal) => S.hieroglyphPanel(rng, pal) },
    { name: 'canopicJars', build: (rng, pal) => S.canopicJars(rng, pal) },
    { name: 'pharaohBust', build: (rng, pal) => S.pharaohBust(rng, pal) },
    { name: 'stepAltar', build: (rng, pal) => S.stepAltar(rng, pal) },
    { name: 'ankhStand', build: (_rng, pal) => S.ankhStand(pal) },
    { name: 'sphinxStatue', build: (rng, pal) => S.sphinxStatue(rng, pal) },
    { name: 'sandDrift', build: (rng, pal) => S.sandDrift(rng, pal) },
    { name: 'scarabRelief', mount: 'wall', build: (rng, pal) => S.scarabRelief(rng, pal) },
  ],
  themed('sandstone'),
);

const TEMPLE_EXHIBITS = palExhibits(
  [
    { name: 'carvedPillar', build: (rng, pal) => S.carvedPillar(rng, pal) },
    { name: 'lotusFountain', build: (rng, pal) => S.lotusFountain(rng, pal) },
    { name: 'elephantStatue', build: (rng, pal) => S.elephantStatue(rng, pal) },
    { name: 'mandalaMedallion', build: (rng, pal) => S.mandalaMedallion(rng, pal) },
    { name: 'bellChain', mount: 'ceiling', build: (rng, pal) => S.bellChain(rng, pal) },
    { name: 'incenseBurner', build: (rng, pal) => S.incenseBurner(rng, pal) },
    { name: 'shrineAlcove', build: (rng, pal) => S.shrineAlcove(rng, pal) },
    { name: 'toranArch', build: (rng, pal) => S.toranArch(rng, pal) },
    { name: 'diyaRow', build: (rng, pal) => S.diyaRow(rng, pal) },
    { name: 'rangoliDecal', build: (rng, pal) => S.rangoliDecal(rng, pal) },
  ],
  themed('temple'),
);

const BAR_EXHIBITS = palExhibits(
  [
    { name: 'barCounter', build: (rng, pal) => S.barCounter(rng, pal) },
    { name: 'backBar', build: (rng, pal) => S.backBar(rng, pal) },
    { name: 'beerTaps', build: (rng, pal) => S.beerTaps(rng, pal) },
    { name: 'poolTable', build: (rng, pal) => S.poolTable(rng, pal) },
    { name: 'dartBoard', mount: 'wall', build: (rng, pal) => S.dartBoard(rng, pal) },
    {
      name: 'jukebox',
      build: (rng, pal) => {
        const { group, lampMaterials } = S.jukebox(rng, pal);
        return {
          object: group,
          update: (_d: number, e: number) => {
            lampMaterials.forEach((m, i) => {
              m.emissiveIntensity = 1.4 + Math.sin(e * 3 + i * 2.1) * 0.7;
            });
          },
        };
      },
    },
    { name: 'boothSeat', build: (rng, pal) => S.boothSeat(rng, pal) },
    { name: 'glassRack', mount: 'ceiling', build: (rng, pal) => S.glassRack(rng, pal) },
    { name: 'kegStack', build: (rng, pal) => S.kegStack(rng, pal) },
  ],
  themed('speakeasy'),
);

const CITY_EXHIBITS = palExhibits(
  [
    { name: 'streetLamp', build: (rng, pal) => S.streetLamp(rng, pal) },
    {
      name: 'trafficLight',
      build: (rng, pal) => {
        const { group, lampMaterials } = S.trafficLight(rng, pal);
        return {
          object: group,
          update: (_d: number, e: number) => {
            const phase = Math.floor(e * 0.6) % 3; // red → amber → green
            lampMaterials.forEach((m, i) => (m.emissiveIntensity = i === phase ? 2.2 : 0.15));
          },
        };
      },
    },
    { name: 'fireHydrant', build: (rng, pal) => S.fireHydrant(rng, pal) },
    { name: 'mailbox', build: (rng, pal) => S.mailbox(rng, pal) },
    { name: 'dumpster', build: (rng, pal) => S.dumpster(rng, pal) },
    { name: 'busShelter', build: (rng, pal) => S.busShelter(rng, pal) },
    { name: 'graffitiWall', build: (rng, pal) => S.graffitiWall(rng, pal) },
    { name: 'manholeCover', build: (rng, pal) => S.manholeCover(rng, pal) },
    { name: 'storefrontAwning', mount: 'wall', build: (rng, pal) => S.storefrontAwning(rng, pal) },
    { name: 'phoneBooth', build: (rng, pal) => S.phoneBooth(rng, pal) },
  ],
  themed('streets', 'noir'),
);

const WINTER_EXHIBITS = palExhibits(
  [
    { name: 'snowDrift', build: (rng, pal) => S.snowDrift(rng, pal) },
    { name: 'snowman', build: (rng, pal) => S.snowman(rng, pal) },
    { name: 'icicleRow', mount: 'ceiling', build: (rng, pal) => S.icicleRow(rng, pal) },
    { name: 'snowPine', build: (rng, pal) => S.snowPine(rng, pal) },
    { name: 'frozenPond', build: (rng, pal) => S.frozenPond(rng, pal) },
    { name: 'logPile', build: (rng, pal) => S.logPile(rng, pal) },
    { name: 'sled', build: (rng, pal) => S.sled(rng, pal) },
    { name: 'iceBlockWall', build: (rng, pal) => S.iceBlockWall(rng, pal) },
    { name: 'snowyLampPost', build: (rng, pal) => S.snowyLampPost(rng, pal) },
    { name: 'iglooArch', build: (rng, pal) => S.iglooArch(rng, pal) },
  ],
  themed('arctic'),
);

const SPY_EXHIBITS = palExhibits(
  [
    {
      name: 'laserTripwires',
      build: (rng, pal) => {
        const { group, beamMaterial } = S.laserTripwires(rng, pal);
        return {
          object: group,
          update: (_d: number, e: number) => {
            beamMaterial.emissiveIntensity = 2.4 + Math.sin(e * 11) * 0.5;
          },
        };
      },
    },
    { name: 'vaultDoor', build: (rng, pal) => S.vaultDoor(rng, pal) },
    { name: 'evidenceBoard', mount: 'wall', build: (rng, pal) => S.evidenceBoard(rng, pal) },
    { name: 'dossierTable', build: (rng, pal) => S.dossierTable(rng, pal) },
    { name: 'briefcase', build: (rng, pal) => S.briefcase(rng, pal) },
    {
      name: 'listeningPost',
      build: (rng, pal) => {
        const { group, reels } = S.listeningPost(rng, pal);
        return {
          object: group,
          update: (delta: number) => reels.forEach((r) => void (r.rotation.y += delta * 1.6)),
        };
      },
    },
    { name: 'disguiseRack', build: (rng, pal) => S.disguiseRack(rng, pal) },
    { name: 'mapTable', build: (rng, pal) => S.mapTable(rng, pal) },
    { name: 'keycardGate', build: (rng, pal) => S.keycardGate(rng, pal) },
  ],
  themed('agency', 'noir'),
);

const GOTHIC_EXHIBITS = palExhibits(
  [
    { name: 'coffin', build: (rng, pal) => S.coffin(rng, pal) },
    { name: 'candelabra', build: (rng, pal) => S.candelabra(rng, pal) },
    { name: 'gargoyle', build: (rng, pal) => S.gargoyle(rng, pal) },
    { name: 'tombstoneRow', build: (rng, pal) => S.tombstoneRow(rng, pal) },
    { name: 'ironFence', build: (rng, pal) => S.ironFence(rng, pal) },
    { name: 'chandelier', mount: 'ceiling', build: (rng, pal) => S.chandelier(rng, pal) },
    {
      name: 'cobweb',
      mount: 'wall',
      build: (rng, pal) => {
        const web = S.cobweb(rng, pal);
        web.position.set(-0.8, 2.2, 0.06); // tucked into the backdrop's corner
        return web;
      },
    },
    { name: 'brokenMirror', build: (rng, pal) => S.brokenMirror(rng, pal) },
    { name: 'cryptNiche', build: (rng, pal) => S.cryptNiche(rng, pal) },
    { name: 'cauldron', build: (rng, pal) => S.cauldron(rng, pal) },
  ],
  themed('gothic'),
);

/**
 * Custom-media aisle: every exhibit has swappable ImageSlots. The gallery
 * fills them with demo textures (via textTexture) to prove the insertion
 * path — a real room would call slot.setImage(await loadImageTexture(url)).
 */
const demoImage = (label: string, hue: number): THREE.Texture =>
  S.textTexture([label], { background: `hsl(${hue}, 45%, 38%)`, color: '#f2ecdc' });

const CUSTOM_EXHIBITS = palExhibits(
  [
    {
      name: 'pictureFrame',
      mount: 'wall',
      build: (_rng, pal) => {
        const { group, slot } = S.pictureFrame(pal);
        slot.setImage(demoImage('TEAM 42', 210));
        // Exercise the REAL insertion path: an actual PNG over HTTP replaces
        // the generated texture once it arrives (public/demo-photo.png).
        S.loadImageTexture('/demo-photo.png')
          .then((tex) => slot.setImage(tex))
          .catch((err) => console.warn('demo photo failed to load', err));
        return group;
      },
    },
    {
      name: 'galleryWall',
      mount: 'wall',
      build: (rng, pal) => {
        const { group, slots } = S.galleryWall(rng, pal);
        slots.forEach((s, i) => i % 2 === 0 && s.setImage(demoImage(`GUEST ${i + 1}`, 30 + i * 40)));
        return group;
      },
    },
    {
      name: 'posterBoard',
      mount: 'wall',
      build: (_rng, pal) => {
        const { group, slot } = S.posterBoard(pal);
        slot.setImage(demoImage('WANTED', 0));
        return group;
      },
    },
    {
      name: 'tvScreen',
      mount: 'wall',
      build: (_rng, pal) => {
        const { group, slot } = S.tvScreen(pal);
        slot.setImage(demoImage('LIVE FEED', 140));
        return group;
      },
    },
    { name: 'standee', build: (_rng, pal) => S.standee(pal).group },
    {
      name: 'engravedPlaque',
      mount: 'wall',
      build: (_rng, pal) => S.engravedPlaque(pal, ['THE QUANTUM SPLIT', 'EST. 2026']),
    },
    {
      name: 'hangingBanner',
      mount: 'ceiling',
      build: (_rng, pal) => {
        const { group, slot } = S.hangingBanner(pal);
        slot.setImage(demoImage('HOUSE SIGIL', 280));
        return group;
      },
    },
    {
      name: 'deskPhoto',
      build: (_rng, pal) => {
        const { group, slot } = S.deskPhoto(pal);
        slot.setImage(demoImage('MUM', 330));
        // Desk-scale prop: give it a pedestal so it isn't lost on the plinth.
        const stand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.5), pal.body);
        stand.position.y = 0.4;
        const wrap = new THREE.Group();
        group.position.y = 0.8;
        wrap.add(stand, group);
        return wrap;
      },
    },
    {
      name: 'displayCase',
      build: (_rng, pal) => {
        const { group, slot } = S.displayCase(pal);
        slot.setImage(demoImage('RELIC No. 7', 45));
        return group;
      },
    },
  ],
  themed('speakeasy', 'sterile', 'noir'),
);

const VISTA_EXHIBITS = palExhibits(
  [
    { name: 'windowVista:city', build: (rng, pal) => S.windowVista(rng, pal, { kind: 'city-night' }) },
    { name: 'windowVista:mountains', build: (rng, pal) => S.windowVista(rng, pal, { kind: 'mountains' }) },
    { name: 'windowVista:desert', build: (rng, pal) => S.windowVista(rng, pal, { kind: 'desert' }) },
    { name: 'windowVista:ocean', build: (rng, pal) => S.windowVista(rng, pal, { kind: 'ocean' }) },
    { name: 'buildingFacade', build: (rng, pal) => S.buildingFacade(rng, pal) },
    { name: 'skylineBlocks', build: (rng, pal) => S.skylineBlocks(rng, pal) },
    { name: 'cabinHut', build: (rng, pal) => S.cabinHut(rng, pal) },
    { name: 'guardTower', build: (rng, pal) => S.guardTower(rng, pal) },
    { name: 'colonnade', build: (rng, pal) => S.colonnade(rng, pal, { bays: 2 }) },
    { name: 'openingWall:door', build: (_rng, pal) => S.openingWall(pal, { opening: 'door' }) },
    { name: 'openingWall:window', build: (_rng, pal) => S.openingWall(pal, { opening: 'window' }) },
  ],
  themed('streets', 'arctic', 'sandstone', 'noir'),
);

// ── Floor plan: twenty-five aisles of plinths ───────────────────────────────
const SPACING = 3.2;
const AISLE_GAP = 7; // roomy enough that wall-exhibit backdrops never crowd the camera
const ROWS: Array<{ exhibits: Exhibit[]; z: number }> = [
  ALPHA_EXHIBITS,
  BETA_EXHIBITS,
  SHARED_EXHIBITS,
  ARCHITECTURE_EXHIBITS,
  FURNITURE_EXHIBITS,
  MACHINE_EXHIBITS,
  CLUTTER_EXHIBITS,
  WALLART_EXHIBITS,
  PUZZLE_INPUT_EXHIBITS,
  PUZZLE_OBJECT_EXHIBITS,
  LAB_EXHIBITS,
  MEDICAL_EXHIBITS,
  INDUSTRIAL_EXHIBITS,
  STORAGE_EXHIBITS,
  LIGHTING_EXHIBITS,
  HIGHTECH_EXHIBITS,
  EGYPTIAN_EXHIBITS,
  TEMPLE_EXHIBITS,
  BAR_EXHIBITS,
  CITY_EXHIBITS,
  WINTER_EXHIBITS,
  SPY_EXHIBITS,
  GOTHIC_EXHIBITS,
  CUSTOM_EXHIBITS,
  VISTA_EXHIBITS,
].map((exhibits, i) => ({ exhibits, z: 15 - i * AISLE_GAP }));

function cellX(index: number, total: number): number {
  return (index - (total - 1) / 2) * SPACING;
}

// ── Scene bootstrap ─────────────────────────────────────────────────────────
const container = document.getElementById('app');
if (!container) throw new Error('#app container not found');
const engine = new Engine(container);
const scene = engine.scene;
scene.background = new THREE.Color(0x0b0e12);

const controls = new OrbitControls(engine.camera, engine.renderer.domElement);
engine.camera.position.set(0, 26, 42);
controls.target.set(0, 0.8, -12);
controls.enableDamping = true;

// Museum floor.
const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a2027, roughness: 0.9 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(48, 198), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.z = -69;
floor.receiveShadow = true;
scene.add(floor);
const grid = new THREE.GridHelper(198, 120, 0x232b36, 0x1a212b);
grid.position.set(0, 0.002, -69);
scene.add(grid);

// ── Light moods ─────────────────────────────────────────────────────────────
function moodGroup(lights: THREE.Light[]): THREE.Group {
  const g = new THREE.Group();
  for (const l of lights) g.add(l);
  scene.add(g);
  return g;
}
const showroomKey = new THREE.DirectionalLight(0xffffff, 5);
showroomKey.position.set(6, 12, 8);
showroomKey.castShadow = true;
showroomKey.shadow.mapSize.set(4096, 4096);
showroomKey.shadow.camera.left = -26;
showroomKey.shadow.camera.right = 26;
showroomKey.shadow.camera.top = 100;
showroomKey.shadow.camera.bottom = -100;
const alphaSun = new THREE.DirectionalLight(0xffd27f, 4.5);
alphaSun.position.set(-8, 10, 4);
const betaFill = new THREE.PointLight(0xf4f9ff, 520, 60, 1.6);
betaFill.position.set(0, 10, 0);
const MOODS: Array<{ label: string; background: number; group: THREE.Group }> = [
  {
    label: 'showroom',
    background: 0x0b0e12,
    group: moodGroup([showroomKey, new THREE.HemisphereLight(0x8fa3bd, 0x2a2620, 2.4)]),
  },
  {
    label: 'alpha dusk',
    background: 0x0a0d08,
    group: moodGroup([alphaSun, new THREE.AmbientLight(0x50583c, 1.9)]),
  },
  {
    label: 'beta clinical',
    background: 0x02040a,
    group: moodGroup([betaFill, new THREE.AmbientLight(0xdfe9ff, 1.5)]),
  },
];
let mood = 0;
function applyMood(): void {
  MOODS.forEach((m, i) => (m.group.visible = i === mood));
  scene.background = new THREE.Color(MOODS[mood].background);
}
applyMood();

// ── Static furniture: plinths + nameplates (never rebuilt) ─────────────────
function nameplate(text: string): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#cfe8ff';
    ctx.font = '26px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 34);
  }
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.4),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }),
  );
  mesh.userData.disposeMaterial = true;
  return mesh;
}

const plinthMat = new THREE.MeshStandardMaterial({ color: 0x2a3340, roughness: 0.8 });
const furniture = new THREE.Group();
for (const row of ROWS) {
  row.exhibits.forEach((exhibit, i) => {
    const x = cellX(i, row.exhibits.length);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 2.6), plinthMat);
    plinth.position.set(x, 0.025, row.z);
    plinth.receiveShadow = true;
    furniture.add(plinth);
    const plate = nameplate(exhibit.name);
    plate.position.set(x, 2.9, row.z);
    furniture.add(plate);
  });
}
scene.add(furniture);

// ── Exhibit builds (rebuilt on every reseed) ────────────────────────────────
const exhibitRoot = new THREE.Group();
scene.add(exhibitRoot);
let updates: Array<(delta: number, elapsed: number) => void> = [];
let seedIndex = 1;

function rebuild(): void {
  disposeSceneryObject(exhibitRoot);
  exhibitRoot.clear();
  updates = [];
  const seed = `gallery:${seedIndex}`;
  for (const row of ROWS) {
    row.exhibits.forEach((exhibit, i) => {
      const built = exhibit.build(new Rng(`${seed}:${exhibit.name}`));
      built.object.position.x += cellX(i, row.exhibits.length);
      built.object.position.y += 0.05; // sit on the plinth
      built.object.position.z += row.z;
      if (built.update) updates.push(built.update);
      exhibitRoot.add(built.object);
    });
  }
  // A scatter demo in the far corner: the dressing kit placing fern clusters
  // deterministically around a keep-out ring (visible spacing + avoidance).
  const demoSeed = `${seed}:scatter`;
  const demo = new THREE.Group();
  demo.position.set(0, 0.05, -160);
  for (const p of ring({ seed: demoSeed, radius: 2.2, count: 8, radiusJitter: 0.3 })) {
    const fern = fernCluster(new Rng(`${demoSeed}:${p.x.toFixed(2)}`), alphaKit);
    applyPlacement(fern, p);
    demo.add(fern);
  }
  exhibitRoot.add(demo);
  const seedEl = document.getElementById('seed');
  if (seedEl) seedEl.textContent = seed;
}
rebuild();

// ── Input + loop ────────────────────────────────────────────────────────────
let currentAisle = -1;
function jumpToAisle(index: number): void {
  currentAisle = Math.max(0, Math.min(ROWS.length - 1, index));
  // Stay inside the aisle gap so the neighbouring row can't block the view.
  const z = ROWS[currentAisle].z;
  engine.camera.position.set(0, 3.4, z + 5.8);
  controls.target.set(0, 1.2, z);
}
function overview(): void {
  currentAisle = -1;
  engine.camera.position.set(0, 26, 42);
  controls.target.set(0, 0.8, -12);
}

window.addEventListener('keydown', (event) => {
  const digit = Number.parseInt(event.key, 10);
  if (digit >= 1 && digit <= 9) jumpToAisle(digit - 1);
  if (event.key === '0') overview();
  if (event.key === ']') jumpToAisle(currentAisle + 1);
  if (event.key === '[') jumpToAisle(Math.max(0, currentAisle - 1));
  if (event.key === 'r' || event.key === 'R') {
    seedIndex++;
    rebuild();
  } else if (event.key === 't' || event.key === 'T') {
    mood = (mood + 1) % MOODS.length;
    applyMood();
    const moodEl = document.getElementById('mood');
    if (moodEl) moodEl.textContent = MOODS[mood].label;
  }
});

engine.onUpdate((delta, elapsed) => {
  controls.update();
  for (const update of updates) update(delta, elapsed);
});
engine.start();
