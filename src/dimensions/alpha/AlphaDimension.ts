import * as THREE from 'three';
import { Dimension } from '@/dimensions/Dimension';
import { buildSyncChamberAlpha } from '@/rooms/sync/SyncChamberAlpha';
import type { RoomDetail } from '@/rooms/types';
import { DimensionId, RoomId, type RoomBlueprint } from '@/types';

/**
 * Dimension Alpha — "The Overgrown Past".
 * Dead power, hazy golden sun shafts through cracked concrete, and pulsing
 * bioluminescent moss in the corners. Everything analog, rusted, damp.
 *
 * NOTE: this is a blockout — materials are flat placeholders. Real concrete /
 * ivy / moss assets and volumetric light shafts come once art lands.
 */
export class AlphaDimension extends Dimension {
  private readonly glowLights: THREE.PointLight[] = [];

  constructor() {
    super(DimensionId.Alpha);
  }

  protected override buildRoomDetail(room: RoomBlueprint): RoomDetail | null {
    if (room.id === RoomId.SyncChamber) return buildSyncChamberAlpha();
    return null;
  }

  protected addBaseLighting(): void {
    // Faint ambient so the dark isn't pure black.
    this.scene.add(new THREE.AmbientLight(0x20301a, 0.4));

    // Golden sun shaft piercing the ceiling — a steep directional key light.
    const sun = new THREE.DirectionalLight(this.theme.keyLight.color, this.theme.keyLight.intensity);
    sun.position.set(6, 20, -10);
    this.scene.add(sun);
  }

  protected buildRoomShell(room: RoomBlueprint, group: THREE.Group): void {
    const concrete = new THREE.MeshStandardMaterial({
      color: 0x3a3d33,
      roughness: 0.95,
      metalness: 0.0,
    });
    group.add(this.boxShell(room, concrete));

    // Bioluminescent accent glow in a corner of the room.
    const glow = new THREE.PointLight(this.theme.accent, 3, 8, 2);
    glow.position.set(-room.size.x / 2 + 1, 1.5, -room.size.z / 2 + 1);
    group.add(glow);
    this.glowLights.push(glow);
  }

  protected buildProp(_room: RoomBlueprint, slot: RoomBlueprint['props'][number]): THREE.Object3D | null {
    // Alpha palette: rusted iron, mossy stone, damp organic matter. The `field`
    // slot is the glowing mutated vine wall, so it emits the bioluminescent hue.
    const isFlora = slot.kind === 'field';
    const material = new THREE.MeshStandardMaterial({
      color: isFlora ? 0x1c3a2a : 0x6b4a2f,
      roughness: 1,
      metalness: slot.kind === 'lever' || slot.kind === 'terminal' ? 0.4 : 0.1,
      emissive: new THREE.Color(this.theme.accent),
      emissiveIntensity: isFlora ? 0.5 : 0,
    });
    return this.makeProp(slot.kind, material);
  }

  override update(delta: number, elapsed: number): void {
    super.update(delta, elapsed); // detailed rooms (Sync Chamber scenery)
    // Slow, organic pulse of the blockout rooms' bioluminescence.
    const pulse = 2.5 + Math.sin(elapsed * 1.3) * 1.2;
    for (const light of this.glowLights) light.intensity = pulse;
  }
}
