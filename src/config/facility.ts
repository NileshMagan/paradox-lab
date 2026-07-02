import { RoomId, type RoomBlueprint, type Vec3 } from '@/types';

/**
 * THE MIRRORED FOOTPRINT.
 *
 * Single source of truth for the lab's physical blueprint. Both Alpha and Beta
 * render from these exact coordinates — a prop in the top-left for one player
 * is in the top-left for the other; only the visuals differ. This is what lets
 * players guide each other blindly over voice.
 *
 * Layout runs along -Z, matching the facility map (docs/reference/facility-map.png):
 *   START (+Z) → R1 Sync Chambers (octagon) → R2 Grid (corridor) → R3 Paradox Core (dome) → EXIT (-Z)
 *
 * Each slot's `kind` is the shared geometric archetype; each dimension skins it
 * differently. `puzzle` ties the slot to a puzzle in docs/DESIGN.md.
 */
export const FACILITY: RoomBlueprint[] = [
  {
    // Small claustrophobic octagonal airlock. Establishes the comms loop.
    id: RoomId.SyncChamber,
    size: { x: 8, y: 4, z: 8 },
    center: { x: 0, y: 0, z: 0 },
    props: [
      // Left wall: Alpha's carved Stone Mural (zodiac) / Beta's Holo Audio Analyzer.
      {
        id: 'sync.leftPanel',
        kind: 'wall-panel',
        position: { x: -3.6, y: 1.6, z: -1 },
        rotationY: Math.PI / 2,
        interactive: true,
        label: 'Stone Mural (A) / Audio Analyzer (B)',
        puzzle: 'sync.frequency',
      },
      // Rhythmic water drip + bucket (A) / audio pedestal artifact (B).
      {
        id: 'sync.drip',
        kind: 'floor-unit',
        position: { x: -0.5, y: 0, z: -1.5 },
        interactive: true,
        label: 'Water Drip & Bucket (A) / Starmap Pedestal (B)',
        puzzle: 'sync.frequency',
      },
      // Rusted gear mechanism (A) / holo console cluster (B).
      {
        id: 'sync.gears',
        kind: 'terminal',
        position: { x: 2.6, y: 0, z: -1 },
        rotationY: -Math.PI / 2,
        interactive: true,
        label: 'Gears (A) / Star Map Console (B)',
        puzzle: 'sync.starmap',
      },
      // Exit hatch to R2.
      {
        id: 'sync.hatch',
        kind: 'debris',
        position: { x: 0, y: 0, z: -3.8 },
        interactive: false,
        label: 'Hatch to Grid',
      },
    ],
  },
  {
    // Long rectangular testing corridor. Cross-dimensional colour/flora puzzle.
    id: RoomId.Grid,
    size: { x: 6, y: 4, z: 18 },
    center: { x: 0, y: 0, z: -13 },
    props: [
      // Right wall: mutated bioluminescent vine wall (A) / deadly laser grid (B).
      {
        id: 'grid.field',
        kind: 'field',
        position: { x: 2.2, y: 0, z: -13 },
        interactive: true,
        label: 'Mutated Flora Wall (A) / Laser Grid Maze (B)',
        puzzle: 'grid.bloom',
      },
      // Soil/pH analysis bench (A) / chemical analyzer terminal (B).
      {
        id: 'grid.analyzer',
        kind: 'floor-unit',
        position: { x: -2.2, y: 0, z: -9 },
        rotationY: Math.PI / 2,
        interactive: true,
        label: 'Soil/pH Bench (A) / Chemical Analyzer (B)',
        puzzle: 'grid.chemical',
      },
      // Left wall machinery: rusted valves (A) / server racks + hack point (B).
      {
        id: 'grid.machinery',
        kind: 'terminal',
        position: { x: -2.4, y: 0, z: -16 },
        rotationY: Math.PI / 2,
        interactive: true,
        label: 'Rusted Valves (A) / Server Rack + Hack (B)',
        puzzle: 'grid.server',
      },
    ],
  },
  {
    // Massive cavernous dome with a central reactor pit. The climax.
    id: RoomId.ParadoxCore,
    size: { x: 20, y: 10, z: 20 },
    center: { x: 0, y: 0, z: -32 },
    props: [
      // Central reactor pit structure (dark abyss (A) / glowing energy (B)).
      {
        id: 'core.reactor',
        kind: 'pit-core',
        position: { x: 0, y: 0, z: -32 },
        interactive: false,
        label: 'Paradox Core reactor pit',
      },
      // Whiteboard equations (A) / digital time-dilation charts (B) — left wall.
      {
        id: 'core.equations',
        kind: 'wall-panel',
        position: { x: -6, y: 2, z: -37 },
        interactive: true,
        label: 'Whiteboard Equations (A) / Dilation Charts (B)',
        puzzle: 'core.anchor',
      },
      // Heavy mirrors on rusty tracks (A) / control terminal that aims them (B).
      {
        id: 'core.mirrors',
        kind: 'terminal',
        position: { x: -5, y: 0, z: -30 },
        interactive: true,
        label: 'Heavy Mirrors on Tracks (A) / Core Control Terminal (B)',
        puzzle: 'core.mirrors',
      },
      // Simultaneous manual escape lever — rusted (A) / sleek black (B).
      {
        id: 'core.lever',
        kind: 'lever',
        position: { x: 3, y: 0, z: -29 },
        interactive: true,
        label: 'Manual Lever (both — pull on "3,2,1")',
        puzzle: 'core.lever',
      },
    ],
  },
];

/**
 * Room-local position of a prop slot (blueprint position minus room centre).
 * Detailed room builders MUST place puzzle props via this — never hard-coded
 * coordinates — so both dimensions stay mirrored.
 */
export function slotLocal(roomId: RoomId, slotId: string): Vec3 {
  const room = FACILITY.find((r) => r.id === roomId);
  const slot = room?.props.find((p) => p.id === slotId);
  if (!room || !slot) throw new Error(`Unknown slot ${roomId}/${slotId}`);
  return {
    x: slot.position.x - room.center.x,
    y: slot.position.y - room.center.y,
    z: slot.position.z - room.center.z,
  };
}
