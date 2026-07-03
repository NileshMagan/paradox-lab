import * as THREE from 'three';
import { DIMENSION_THEME, RENDER } from '@/config/constants';
import { FACILITY } from '@/config/facility';
import type { Interactable, RoomDetail } from '@/rooms/types';
import { DimensionId, type PropKind, type RoomBlueprint } from '@/types';

/**
 * Base class for a rendered dimension. Builds a Three.js scene from the shared
 * FACILITY footprint, then defers all look-and-feel to subclasses via the
 * `buildRoomShell` / `buildProp` hooks. This is where the "same blueprint,
 * different reality" invariant is enforced: geometry positions come from the
 * blueprint, materials come from the subclass.
 */
export abstract class Dimension {
  readonly scene = new THREE.Scene();
  /** Interactive hotspots contributed by this dimension's rooms. */
  readonly interactables: Interactable[] = [];
  protected readonly theme: (typeof DIMENSION_THEME)[DimensionId];
  /**
   * Per-room render data. Only the focused room's lights and per-frame update
   * run: a whole dimension holds ~30 dynamic lights across its three rooms,
   * and Three.js's forward renderer loops over EVERY light for every pixel, so
   * leaving them all lit tanks the frame rate. Gating to the focused room
   * keeps ~10 lights and a single shadow pass live at a time.
   * `activeRoom === null` is the admin overview (all room lights off, lit by
   * the flat hemisphere inspection light instead).
   */
  private readonly rooms: Array<{
    update: ((delta: number, elapsed: number) => void) | undefined;
    lights: THREE.Light[];
  }> = [];
  private activeRoom: number | null = null;

  constructor(readonly id: DimensionId) {
    this.theme = DIMENSION_THEME[id];
    this.scene.background = new THREE.Color(this.theme.background);
    this.scene.fog = new THREE.FogExp2(this.theme.background, this.theme.fogDensity);
  }

  /** Construct the full facility for this dimension. */
  build(): this {
    this.addBaseLighting();
    for (const room of FACILITY) {
      const group = new THREE.Group();
      group.position.set(room.center.x, room.center.y, room.center.z);
      group.name = `room:${room.id}`;
      // A hand-dressed detailed room replaces the generic blockout entirely.
      const detail = this.buildRoomDetail(room);
      if (detail) {
        group.add(detail.object);
        if (detail.interactables) this.interactables.push(...detail.interactables);
        this.registerRoom(group, detail.update);
        this.scene.add(group);
        continue;
      }
      this.buildRoomShell(room, group);
      for (const slot of room.props) {
        const prop = this.buildProp(room, slot);
        if (prop) {
          prop.position.set(
            slot.position.x - room.center.x,
            slot.position.y - room.center.y,
            slot.position.z - room.center.z,
          );
          if (slot.rotationY) prop.rotation.y = slot.rotationY;
          prop.userData.slotId = slot.id;
          group.add(prop);
        }
      }
      this.registerRoom(group);
      this.scene.add(group);
    }
    return this;
  }

  /** Record a room's per-frame update + its lights so setActiveRoom can gate them. */
  private registerRoom(
    group: THREE.Group,
    update?: (delta: number, elapsed: number) => void,
  ): void {
    const lights: THREE.Light[] = [];
    group.traverse((obj) => {
      if (obj instanceof THREE.Light) lights.push(obj);
    });
    this.rooms.push({ update, lights });
  }

  /**
   * Focus one room by blueprint index, or pass `null` for the admin overview.
   * Only the focused room's lights stay lit and only its per-frame update runs
   * (see the `rooms` field for why). Called on every room / dimension switch.
   */
  setActiveRoom(index: number | null): void {
    this.activeRoom = index;
    this.rooms.forEach((room, i) => {
      // Overview (null): all room lights off — ViewNavigator's hemisphere
      // inspection light lights the dollhouse. Room mode: focused room only.
      const on = index !== null && i === index;
      for (const light of room.lights) light.visible = on;
    });
  }

  /**
   * Per-frame hook for animated elements. Subclasses override for
   * dimension-wide effects and call `super.update`. Only the focused room's
   * scenery animates (all rooms in overview) — see the `rooms` field.
   */
  update(delta: number, elapsed: number): void {
    if (this.activeRoom === null) {
      for (const room of this.rooms) room.update?.(delta, elapsed);
    } else {
      this.rooms[this.activeRoom]?.update?.(delta, elapsed);
    }
  }

  /**
   * Optional bespoke build for a room (full scenery instead of blockout).
   * Return null to fall back to the generic shell + prop archetypes.
   */
  protected buildRoomDetail(_room: RoomBlueprint): RoomDetail | null {
    return null;
  }

  /** Ambient + key lighting for the dimension. */
  protected abstract addBaseLighting(): void;

  /** Build the walls/floor/ceiling for a single room. */
  protected abstract buildRoomShell(room: RoomBlueprint, group: THREE.Group): void;

  /** Build the visual for one prop slot, or null to leave it empty. */
  protected abstract buildProp(room: RoomBlueprint, slot: RoomBlueprint['props'][number]): THREE.Object3D | null;

  /** Shared helper: a simple box shell (floor + 4 walls) for a room. */
  protected boxShell(room: RoomBlueprint, material: THREE.Material): THREE.Group {
    const { x: w, y: h, z: d } = room.size;
    const g = new THREE.Group();
    const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), material);
    floor.position.y = -0.1;
    g.add(floor);
    const ceiling = floor.clone();
    ceiling.position.y = h;
    ceiling.name = 'ceiling'; // hidden by the admin overview's dollhouse view
    g.add(ceiling);
    const wallGeo = new THREE.BoxGeometry(0.2, h, d);
    const left = new THREE.Mesh(wallGeo, material);
    left.position.set(-w / 2, h / 2, 0);
    g.add(left);
    const right = left.clone();
    right.position.x = w / 2;
    g.add(right);
    const backGeo = new THREE.BoxGeometry(w, h, 0.2);
    const back = new THREE.Mesh(backGeo, material);
    back.position.set(0, h / 2, -d / 2);
    g.add(back);
    return g;
  }

  /**
   * Shared prop geometry keyed on archetype. Both dimensions build the SAME
   * shape at the SAME spot (footprint stays mirrored); subclasses pass their
   * own material so only the look differs. Mesh origin sits on the floor.
   */
  protected makeProp(kind: PropKind, material: THREE.Material): THREE.Group {
    let geo: THREE.BufferGeometry;
    let yOffset: number;
    switch (kind) {
      case 'wall-panel':
        geo = new THREE.BoxGeometry(2.4, 2.4, 0.15);
        yOffset = 0; // positioned by its slot (already at wall height)
        break;
      case 'terminal':
        geo = new THREE.BoxGeometry(1.4, 1.1, 0.7);
        yOffset = 0.55;
        break;
      case 'floor-unit':
        geo = new THREE.BoxGeometry(1.0, 1.3, 0.8);
        yOffset = 0.65;
        break;
      case 'field':
        geo = new THREE.BoxGeometry(0.3, 3.6, 12);
        yOffset = 1.8;
        break;
      case 'pit-core':
        geo = new THREE.CylinderGeometry(2.2, 2.6, 6, 12);
        yOffset = 3;
        break;
      case 'lever':
        geo = new THREE.BoxGeometry(0.2, 1.4, 0.2);
        yOffset = 0.7;
        break;
      case 'debris':
      default:
        geo = new THREE.BoxGeometry(1.0, 0.8, 1.0);
        yOffset = 0.4;
        break;
    }
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.y = yOffset;
    // Wrap so the caller can position the group from the blueprint without
    // clobbering the mesh's floor offset.
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  static defaultCameraStart(): THREE.Vector3 {
    return new THREE.Vector3(0, RENDER.near + 1.6, 2.5);
  }
}
