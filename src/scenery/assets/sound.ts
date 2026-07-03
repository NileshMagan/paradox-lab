import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Sound emitters — the visible half of a room's soundscape, plus the marker
 * convention that ties positions to the audio system.
 *
 * Convention: anything that should emit positional audio carries
 * `object.userData.soundId = '<id>'` — rooms traverse their scene for
 * soundIds and hand positions to `core/audio`. `soundMarker()` creates a
 * dev-only gizmo for invisible emitters (a dripping pipe offscreen, wind at
 * a window); hide it in production by toggling `visible`.
 */

/** Invisible-emitter gizmo: a small wire diamond, dev-visible only. */
export function soundMarker(soundId: string, opts: { color?: number } = {}): THREE.Group {
  const g = new THREE.Group();
  g.userData.soundId = soundId;
  const mat = new THREE.MeshBasicMaterial({
    color: opts.color ?? 0x66d9ff,
    wireframe: true,
    transparent: true,
    opacity: 0.7,
  });
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), mat);
  gem.userData.disposeMaterial = true;
  gem.position.y = 1.2;
  g.add(gem);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.2, 4), mat);
  stem.position.y = 0.6;
  g.add(stem);
  return g;
}

/** Wall PA speaker in a slatted cabinet. */
export function wallSpeaker(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  g.userData.soundId = 'pa';
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.2), pal.body);
  box.position.set(0, 1.9, 0.1);
  box.rotation.x = 0.25; // angled down at the room
  box.castShadow = true;
  g.add(box);
  for (let i = 0; i < 6; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 0.015), pal.trim);
    slat.position.set(0, 2.06 - i * 0.065, 0.21 - i * 0.017);
    slat.rotation.x = 0.25;
    g.add(slat);
  }
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.06), pal.metal);
  bracket.position.set(0, 2.16, 0.02);
  g.add(bracket);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), pal.glow(rng.chance(0.7) ? 0x2bff88 : 0xff2b3a));
  lamp.position.set(0.13, 1.72, 0.19);
  g.add(lamp);
  return g;
}

/** Pole-mounted air-raid style horn loudspeaker (great for facility alarms). */
export function hornSpeaker(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  g.userData.soundId = 'alarm-horn';
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 2.4, 8), pal.metal);
  pole.position.y = 1.2;
  pole.castShadow = true;
  g.add(pole);
  for (const heading of [0, Math.PI * (0.9 + rng.next() * 0.2)]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 10, 1, true), pal.body);
    horn.rotation.z = Math.PI / 2;
    horn.rotation.y = heading;
    horn.position.set(Math.cos(heading) * 0.26, 2.3, Math.sin(heading) * -0.26);
    horn.rotation.x = 0.15;
    g.add(horn);
    const driver = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), pal.trim);
    driver.position.set(Math.cos(heading) * 0.06, 2.32, Math.sin(heading) * -0.06);
    g.add(driver);
  }
  return g;
}

/** Vintage radio set with a glowing dial. Returns the dial for flicker/tuning. */
export function radioSet(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; dialMaterial: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  group.userData.soundId = 'radio';
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.2), pal.body);
  cabinet.position.y = 0.16;
  cabinet.castShadow = true;
  group.add(cabinet);
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.22), pal.soft);
  grille.position.set(-0.11, 0.17, 0.101);
  group.add(grille);
  for (let i = 0; i < 5; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.22, 0.008), pal.trim);
    rib.position.set(-0.18 + i * 0.035, 0.17, 0.105);
    group.add(rib);
  }
  const dialMaterial = pal.glow(0xffe2b0).clone();
  dialMaterial.emissiveIntensity = 1.2;
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.07), dialMaterial);
  dial.position.set(0.12, 0.2, 0.101);
  dial.userData.disposeMaterial = true;
  group.add(dial);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.06, 0.004), pal.trim);
  needle.position.set(0.12 + rng.jitter(0.05), 0.2, 0.105);
  group.add(needle);
  for (const x of [0.05, 0.19]) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.015, 8), pal.metal);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(x, 0.08, 0.105);
    group.add(knob);
  }
  const aerial = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.5, 5), pal.metal);
  aerial.position.set(0.2, 0.55, -0.05);
  aerial.rotation.z = -0.3 + rng.jitter(0.1);
  group.add(aerial);
  return { group, dialMaterial };
}

/** Wall intercom: grille, call button, talk lamp. */
export function intercomPanel(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  g.userData.soundId = 'intercom';
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 0.05), pal.metal);
  plate.position.set(0, 1.45, 0.025);
  g.add(plate);
  // Speaker grille: a dot grid of tiny dark cylinders.
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.008, 6), pal.trim);
      hole.rotation.x = Math.PI / 2;
      hole.position.set(-0.06 + c * 0.04, 1.56 - r * 0.04, 0.052);
      g.add(hole);
    }
  }
  const button = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.02, 10), pal.glow(0xffb347));
  button.rotation.x = Math.PI / 2;
  button.position.set(0, 1.33, 0.055);
  g.add(button);
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 6, 5),
    pal.glow(rng.chance(0.5) ? 0x2bff88 : 0xff2b3a),
  );
  lamp.position.set(0.07, 1.33, 0.052);
  g.add(lamp);
  return g;
}

/** Handheld walkie-talkie left on a surface, channel lamp blinking-ready. */
export function walkieTalkie(rng: Rng, pal: Palette): THREE.Group {
  const g = new THREE.Group();
  g.userData.soundId = 'walkie';
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.04), pal.body);
  body.position.y = 0.08;
  body.rotation.y = rng.angle();
  body.rotation.z = rng.chance(0.4) ? Math.PI / 2 - 0.06 : 0; // sometimes dropped on its side
  if (body.rotation.z !== 0) body.position.y = 0.038;
  g.add(body);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.12, 5), pal.trim);
  antenna.position.set(0.02, 0.2, 0);
  antenna.rotation.copy(body.rotation);
  if (body.rotation.z !== 0) antenna.position.set(0.1, 0.06, 0);
  g.add(antenna);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 5), pal.glow(0x2bff88));
  lamp.position.set(-0.02, body.rotation.z !== 0 ? 0.06 : 0.15, 0.022);
  g.add(lamp);
  return g;
}
