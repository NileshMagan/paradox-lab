import * as THREE from 'three';
import { Dimension } from '@/dimensions/Dimension';
import { buildCoreBeta } from '@/rooms/core/CoreBeta';
import { buildGridBeta } from '@/rooms/grid/GridBeta';
import { buildSyncChamberBeta } from '@/rooms/sync/SyncChamberBeta';
import type { RoomDetail } from '@/rooms/types';
import { DimensionId, RoomId, type RoomBlueprint } from '@/types';

/**
 * Dimension Beta — "The Neon Future".
 * Stark, shadowless LED panels; seamless brushed steel and white resin floors.
 * On lockdown it drops to emergency amber + electric-blue holographics.
 * All three rooms are fully dressed; the generic blockout path remains as the
 * fallback for any future rooms.
 */
export class BetaDimension extends Dimension {
  constructor() {
    super(DimensionId.Beta);
  }

  protected override buildRoomDetail(room: RoomBlueprint): RoomDetail | null {
    switch (room.id) {
      case RoomId.SyncChamber:
        return buildSyncChamberBeta();
      case RoomId.Grid:
        return buildGridBeta();
      case RoomId.ParadoxCore:
        return buildCoreBeta();
      default:
        return null;
    }
  }

  protected addBaseLighting(): void {
    // Bright, near-shadowless fill to sell the sterile clinical feel —
    // kept below full blast so the cyan trim and holographics still pop.
    this.scene.add(new THREE.AmbientLight(0xdfe9ff, 0.7));
  }

  protected buildRoomShell(room: RoomBlueprint, group: THREE.Group): void {
    const resin = new THREE.MeshStandardMaterial({
      color: 0xe8eef5,
      roughness: 0.15,
      metalness: 0.6,
    });
    group.add(this.boxShell(room, resin));

    // Electric-blue holographic accent line.
    const holo = new THREE.PointLight(this.theme.accent, 2, 10, 2);
    holo.position.set(room.size.x / 2 - 1, 2, -room.size.z / 2 + 1);
    group.add(holo);
  }

  protected buildProp(_room: RoomBlueprint, slot: RoomBlueprint['props'][number]): THREE.Object3D | null {
    // Beta palette: obsidian glass + brushed steel, electric-blue emissive. The
    // `field` slot is the deadly laser grid; the `pit-core` is the live reactor.
    const isHazard = slot.kind === 'field';
    const isCore = slot.kind === 'pit-core';
    const material = new THREE.MeshStandardMaterial({
      color: isHazard ? 0x220008 : 0x0b0e14,
      roughness: 0.1,
      metalness: 0.9,
      emissive: new THREE.Color(isHazard ? 0xff2b3a : this.theme.accent),
      emissiveIntensity: isHazard ? 0.9 : isCore ? 1.4 : slot.interactive ? 0.35 : 0,
    });
    return this.makeProp(slot.kind, material);
  }

}
