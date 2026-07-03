import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Animated characters — procedurally driven creatures and machines that make
 * a room feel inhabited. Every builder returns `{ group, update }` (same
 * convention as the weather FX); paths and timing are seeded, so all clients
 * see the same patrols. These are ambience, not NPCs — no AI, no interaction.
 */

export interface AnimatedChar {
  group: THREE.Group;
  update: (delta: number, elapsed: number) => void;
}

/** Wheeled patrol robot trundling a seeded oval, head scanning. */
export function patrolBot(rng: Rng, pal: Palette, opts: { radius?: number } = {}): AnimatedChar {
  const radius = opts.radius ?? 1;
  const group = new THREE.Group();
  const bot = new THREE.Group();
  const chassis = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.35, 10), pal.body);
  chassis.position.y = 0.32;
  chassis.castShadow = true;
  bot.add(chassis);
  for (const side of [-1, 1]) {
    const tread = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.34), pal.trim);
    tread.position.set(side * 0.18, 0.1, 0);
    bot.add(tread);
  }
  const head = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), pal.metal);
  head.add(dome);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), pal.glow(0xff2b3a));
  eye.position.set(0, 0.05, 0.11);
  head.add(eye);
  head.position.y = 0.5;
  bot.add(head);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), pal.glow(0xffb347));
  lamp.position.set(0, 0.55, -0.05);
  bot.add(lamp);
  group.add(bot);
  const phase = rng.angle();
  const speed = rng.range(0.25, 0.4);
  const squash = rng.range(0.6, 0.9);
  return {
    group,
    update: (_delta, elapsed) => {
      const t = elapsed * speed + phase;
      bot.position.set(Math.cos(t) * radius, 0, Math.sin(t) * radius * squash);
      bot.rotation.y = -t; // face along the path tangent (near enough)
      head.rotation.y = Math.sin(elapsed * 1.7) * 0.9; // scanning
    },
  };
}

/** Hover drone bobbing on station, running lights blinking. */
export function hoverDrone(rng: Rng, pal: Palette, opts: { height?: number } = {}): AnimatedChar {
  const height = opts.height ?? 1.6;
  const group = new THREE.Group();
  const craft = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), pal.body);
  hull.scale.y = 0.6;
  hull.castShadow = true;
  craft.add(hull);
  for (const [ax, az] of [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ]) {
    const rotorRing = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 5, 10), pal.trim);
    rotorRing.rotation.x = Math.PI / 2;
    rotorRing.position.set(ax * 0.17, 0.03, az * 0.17);
    craft.add(rotorRing);
  }
  const eyeMat = pal.glow(0xff2b3a).clone();
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), eyeMat);
  eye.position.set(0, -0.03, 0.12);
  eye.userData.disposeMaterial = true;
  craft.add(eye);
  craft.position.y = height;
  group.add(craft);
  const phase = rng.angle();
  return {
    group,
    update: (_delta, elapsed) => {
      craft.position.y = height + Math.sin(elapsed * 1.6 + phase) * 0.08;
      craft.rotation.z = Math.sin(elapsed * 1.1 + phase) * 0.06;
      craft.rotation.y += 0.002;
      eyeMat.emissiveIntensity = Math.sin(elapsed * 5 + phase) > 0.4 ? 2.2 : 0.4; // blink
    },
  };
}

/** Translucent ghost wisp drifting a slow figure-eight, breathing in and out. */
export function ghostWisp(rng: Rng, _pal: Palette, opts: { height?: number } = {}): AnimatedChar {
  const height = opts.height ?? 1.1;
  const group = new THREE.Group();
  const spirit = new THREE.Group();
  const shroudMat = new THREE.MeshStandardMaterial({
    color: 0xcfe0ea,
    transparent: true,
    opacity: 0.28,
    roughness: 1,
    depthWrite: false,
  });
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.8, 10, 1, true), shroudMat);
  body.userData.disposeMaterial = true;
  body.position.y = 0.4;
  spirit.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), shroudMat);
  head.position.y = 0.85;
  spirit.add(head);
  // Two darker eye hollows.
  for (const side of [-0.05, 0.05]) {
    const hollow = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0x0a0d12, transparent: true, opacity: 0.7 }),
    );
    hollow.userData.disposeMaterial = side < 0;
    hollow.position.set(side, 0.87, 0.12);
    spirit.add(hollow);
  }
  spirit.position.y = height;
  group.add(spirit);
  const phase = rng.angle();
  return {
    group,
    update: (_delta, elapsed) => {
      const t = elapsed * 0.35 + phase;
      spirit.position.set(Math.sin(t) * 0.5, height + Math.sin(elapsed * 0.9 + phase) * 0.12, Math.sin(t * 2) * 0.28);
      spirit.rotation.y = Math.cos(t) * 0.6;
      shroudMat.opacity = 0.2 + Math.sin(elapsed * 0.7 + phase) * 0.1;
    },
  };
}

/** A rat scurrying a seeded loop: dart, pause, dart. */
export function ratScurrier(rng: Rng, pal: Palette, opts: { radius?: number } = {}): AnimatedChar {
  const radius = opts.radius ?? 0.9;
  const group = new THREE.Group();
  const rat = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 1 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), fur);
  body.userData.disposeMaterial = true;
  body.scale.set(0.8, 0.7, 1.4);
  body.position.y = 0.05;
  rat.add(body);
  const headBead = new THREE.Mesh(new THREE.SphereGeometry(0.04, 7, 5), fur);
  headBead.position.set(0, 0.05, 0.1);
  headBead.scale.z = 1.3;
  rat.add(headBead);
  for (const side of [-0.025, 0.025]) {
    const ear = new THREE.Mesh(new THREE.CircleGeometry(0.015, 6), fur);
    ear.position.set(side, 0.085, 0.09);
    rat.add(ear);
  }
  const tail = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.04, -0.09),
        new THREE.Vector3(rng.jitter(0.03), 0.03, -0.2),
        new THREE.Vector3(rng.jitter(0.06), 0.015, -0.3),
      ]),
      8,
      0.008,
      4,
    ),
    pal.soft,
  );
  rat.add(tail);
  group.add(rat);
  const phase = rng.angle();
  return {
    group,
    update: (_delta, elapsed) => {
      // Stop-start motion: fast bursts with frozen pauses (classic rat).
      const cycle = (elapsed * 0.5 + phase) % 1;
      const burst = cycle < 0.35 ? cycle / 0.35 : 1; // move during the first 35%, then hold
      const t = (Math.floor(elapsed * 0.5 + phase) + burst) * 1.7;
      rat.position.set(Math.cos(t) * radius, 0, Math.sin(t) * radius * 0.7);
      rat.rotation.y = -t + Math.PI / 2;
      rat.scale.y = cycle < 0.35 ? 1 + Math.sin(elapsed * 30) * 0.08 : 1; // scamper jiggle
    },
  };
}

/** Two butterflies fluttering seeded loops around a point. */
export function butterflies(rng: Rng, pal: Palette, opts: { height?: number } = {}): AnimatedChar {
  const height = opts.height ?? 1.2;
  const group = new THREE.Group();
  const colors = [0xe344c4, 0xffd23f, 0x66d9ff];
  const flyers: Array<{ pivot: THREE.Group; wings: THREE.Mesh[]; phase: number; r: number }> = [];
  for (let b = 0; b < 2; b++) {
    const pivot = new THREE.Group();
    const wings: THREE.Mesh[] = [];
    const mat = pal.glow(colors[rng.int(colors.length)]).clone();
    mat.emissiveIntensity = 0.7;
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.CircleGeometry(0.045, 6), mat);
      wing.userData.disposeMaterial = side === -1;
      wing.geometry.translate(side * 0.045, 0, 0);
      pivot.add(wing);
      wings.push(wing);
    }
    group.add(pivot);
    flyers.push({ pivot, wings, phase: rng.angle(), r: rng.range(0.35, 0.6) });
  }
  return {
    group,
    update: (_delta, elapsed) => {
      for (const f of flyers) {
        const t = elapsed * 0.7 + f.phase;
        f.pivot.position.set(
          Math.cos(t) * f.r,
          height + Math.sin(t * 2.3) * 0.25,
          Math.sin(t * 1.4) * f.r,
        );
        f.pivot.rotation.y = -t;
        const flap = Math.sin(elapsed * 14 + f.phase) * 0.9;
        f.wings[0].rotation.y = flap;
        f.wings[1].rotation.y = -flap;
      }
    },
  };
}

/** A school of small fish darting inside a volume (pair with waterSurface). */
export function fishSchool(rng: Rng, pal: Palette, opts: { radius?: number; count?: number } = {}): AnimatedChar {
  const radius = opts.radius ?? 0.9;
  const count = opts.count ?? 8;
  const group = new THREE.Group();
  const fishMat = pal.glow(0x9fd8ff).clone();
  fishMat.emissiveIntensity = 0.5;
  const school: Array<{ mesh: THREE.Mesh; phase: number; depth: number }> = [];
  for (let i = 0; i < count; i++) {
    const fish = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.09, 5), fishMat);
    fish.userData.disposeMaterial = i === 0;
    fish.rotation.x = Math.PI / 2; // nose forward along +z
    group.add(fish);
    school.push({ mesh: fish, phase: rng.angle(), depth: rng.range(-0.35, -0.1) });
  }
  return {
    group,
    update: (_delta, elapsed) => {
      school.forEach((f, i) => {
        const t = elapsed * (0.5 + (i % 3) * 0.12) + f.phase;
        const x = Math.cos(t) * radius * 0.8;
        const z = Math.sin(t * 1.3) * radius * 0.6;
        f.mesh.position.set(x, f.depth + Math.sin(t * 2) * 0.04, z);
        f.mesh.rotation.y = Math.atan2(-Math.sin(t) * 0.8, Math.cos(t * 1.3) * 1.3 * 0.6);
      });
    },
  };
}

/** Wall sentry turret tracking back and forth, laser sight on. */
export function sentryTurret(rng: Rng, pal: Palette): AnimatedChar {
  const group = new THREE.Group();
  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.16), pal.trim);
  mount.position.set(0, 2.05, 0.05);
  group.add(mount);
  const yoke = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), pal.body);
  shell.scale.z = 1.3;
  yoke.add(shell);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.22, 8), pal.metal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.2;
  yoke.add(barrel);
  const sightMat = pal.glow(0xff2b3a).clone();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.8, 4), sightMat);
  beam.rotation.x = Math.PI / 2;
  beam.position.z = 1.2;
  beam.userData.disposeMaterial = true;
  yoke.add(beam);
  yoke.position.set(0, 1.95, 0.1);
  yoke.rotation.x = 0.35;
  group.add(yoke);
  const phase = rng.angle();
  const arc = rng.range(0.5, 0.8);
  return {
    group,
    update: (_delta, elapsed) => {
      yoke.rotation.y = Math.sin(elapsed * 0.6 + phase) * arc;
      // The sight flares when the sweep reverses — a tell players can time.
      const turn = Math.abs(Math.cos(elapsed * 0.6 + phase));
      sightMat.emissiveIntensity = 1 + (turn < 0.12 ? 1.6 : 0);
    },
  };
}
