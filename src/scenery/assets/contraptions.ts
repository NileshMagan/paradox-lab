import * as THREE from 'three';
import type { Palette } from '@/scenery/palettes';
import type { Rng } from '@/scenery/rng';

/**
 * Contraptions — analog puzzle mechanisms (pairs best with the 'brass' /
 * 'rustbelt' palettes but works in any). Each returns moving handles with a
 * documented axis, plus the *targets* the game needs, so the visible state and
 * the win condition can never drift apart:
 *   pressureGauges → needles (rotate about z) + targets[] + tolerance
 *   valveManifold  → wheels (rotate about z)
 *   telegraphKey   → dotPaddle / dashPaddle (dip about x)
 *   cogTrain       → cogs (rotate about z) + step (one tooth) — meshed, so the
 *                    game counter-rotates neighbours for a real gear puzzle.
 * Origins on the floor; gauges/telegraph sit on their own stands.
 */

/**
 * Bank of round pressure gauges on a stand. Each face carries a green target
 * band; `targets[i]` is the needle rotation.z that centres in that band, within
 * `tolerance` radians. `needles[i]` rotates about z (0 = pointing up).
 */
export function pressureGauges(
  rng: Rng,
  pal: Palette,
  opts: { count?: number } = {},
): { group: THREE.Group; needles: THREE.Group[]; targets: number[]; tolerance: number } {
  const count = Math.min(opts.count ?? 3, 5);
  const group = new THREE.Group();
  const tolerance = 0.42;
  const panel = new THREE.Mesh(new THREE.BoxGeometry(count * 0.6 + 0.2, 0.7, 0.12), pal.body);
  panel.position.set(0, 1.5, 0);
  panel.castShadow = true;
  group.add(panel);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.15, 10), pal.metal);
  stand.position.y = 0.575;
  group.add(stand);
  const needles: THREE.Group[] = [];
  const targets: number[] = [];
  for (let i = 0; i < count; i++) {
    const cx = (i - (count - 1) / 2) * 0.6;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), pal.soft);
    face.position.set(cx, 1.5, 0.062);
    group.add(face);
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.02, 8, 24), pal.metal);
    bezel.position.set(cx, 1.5, 0.066);
    group.add(bezel);
    for (let t = 0; t < 12; t++) {
      const a = (t / 12) * Math.PI * 2;
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.006), pal.trim);
      tick.position.set(cx + Math.sin(a) * 0.18, 1.5 + Math.cos(a) * 0.18, 0.07);
      tick.rotation.z = -a;
      group.add(tick);
    }
    // Seeded target: a green band the needle must land in.
    const target = rng.range(-2.1, 2.1);
    targets.push(target);
    const phi = Math.PI / 2 + target; // math angle (from +X) of the needle at rotation=target
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.17, 0.022, 6, 16, tolerance * 2),
      pal.glow(0x2bff88),
    );
    band.position.set(cx, 1.5, 0.068);
    band.rotation.z = phi - tolerance; // arc starts here, spans 2*tolerance
    group.add(band);
    // Needle: pivot at centre, box points +Y.
    const needle = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.19, 0.01).translate(0, 0.08, 0), pal.glow(0xff6a2a));
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 10), pal.metal);
    hub.rotation.x = Math.PI / 2;
    needle.add(arm, hub);
    needle.position.set(cx, 1.5, 0.08);
    needle.rotation.z = rng.range(-2.8, 2.8); // starts off-target
    group.add(needle);
    needles.push(needle);
  }
  return { group, needles, targets, tolerance };
}

/**
 * Row of pipe valve wheels on a manifold. `wheels[i]` rotates about z (face the
 * viewer, +Z). Turning them is how a game drives the pressure gauges.
 */
export function valveManifold(
  rng: Rng,
  pal: Palette,
  opts: { count?: number } = {},
): { group: THREE.Group; wheels: THREE.Group[] } {
  const count = Math.min(opts.count ?? 3, 5);
  const group = new THREE.Group();
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, count * 0.6 + 0.3, 14), pal.metal);
  pipe.rotation.z = Math.PI / 2;
  pipe.position.y = 1.0;
  group.add(pipe);
  const wheels: THREE.Group[] = [];
  for (let i = 0; i < count; i++) {
    const cx = (i - (count - 1) / 2) * 0.6;
    const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 10), pal.body);
    boss.rotation.x = Math.PI / 2;
    boss.position.set(cx, 1.0, 0.14);
    group.add(boss);
    const wheel = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.022, 8, 20), pal.trim);
    wheel.add(rim);
    for (let s = 0; s < 4; s++) {
      const a = (s / 4) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.28, 0.024), pal.trim);
      spoke.rotation.z = a;
      wheel.add(spoke);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 10), pal.metal);
    hub.rotation.x = Math.PI / 2;
    wheel.add(hub);
    wheel.position.set(cx, 1.0, 0.24);
    wheel.rotation.z = rng.angle();
    group.add(wheel);
    wheels.push(wheel);
  }
  // Feet.
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.12), pal.body);
    leg.position.set((side * (count * 0.6)) / 2, 0.5, 0);
    group.add(leg);
  }
  return { group, wheels };
}

/**
 * Telegraph on a stand with an iambic pair: `dotPaddle` (left) and `dashPaddle`
 * (right), each dipping about x at its rear hinge. A brass sounder sits behind.
 */
export function telegraphKey(
  rng: Rng,
  pal: Palette,
): { group: THREE.Group; dotPaddle: THREE.Group; dashPaddle: THREE.Group } {
  const group = new THREE.Group();
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.85, 10), pal.body);
  pedestal.position.y = 0.425;
  pedestal.castShadow = true;
  group.add(pedestal);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 14), pal.trim);
  deck.position.y = 0.88;
  group.add(deck);
  // Sounder: a little resonator box behind the paddles.
  const sounder = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.1), pal.metal);
  sounder.position.set(0, 0.97, -0.16);
  group.add(sounder);
  const makePaddle = (x: number, tint: number): THREE.Group => {
    const paddle = new THREE.Group();
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.22).translate(0, 0, 0.11), pal.metal);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 14), pal.glow(tint));
    knob.rotation.x = Math.PI / 2;
    knob.position.set(0, 0.01, 0.22);
    const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 8), pal.trim);
    pivot.rotation.z = Math.PI / 2;
    paddle.add(lever, knob, pivot);
    paddle.position.set(x, 0.94, -0.05); // hinge at the rear
    group.add(paddle);
    return paddle;
  };
  const dotPaddle = makePaddle(-0.12, 0x2bff88);
  const dashPaddle = makePaddle(0.12, 0xffb347);
  dotPaddle.rotation.x = rng.jitter(0.02);
  dashPaddle.rotation.x = rng.jitter(0.02);
  return { group, dotPaddle, dashPaddle };
}

/**
 * A meshed row of gears on a backplate. `cogs[i]` rotates about z; each carries
 * one glowing notch tooth (up = aligned when rotation ≡ 0). Because real gears
 * mesh, a game should counter-rotate neighbours by `step` when one is turned.
 */
export function cogTrain(
  rng: Rng,
  pal: Palette,
  opts: { count?: number } = {},
): { group: THREE.Group; cogs: THREE.Group[]; step: number } {
  const count = Math.min(opts.count ?? 3, 5);
  const teeth = 8;
  const step = (Math.PI * 2) / teeth;
  const group = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(count * 0.52 + 0.2, 0.9, 0.08), pal.body);
  plate.position.set(0, 1.4, -0.08);
  plate.castShadow = true;
  group.add(plate);
  const cogs: THREE.Group[] = [];
  const r = 0.26;
  for (let i = 0; i < count; i++) {
    const cx = (i - (count - 1) / 2) * 0.52;
    const cog = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.08, 20), pal.metal);
    disc.rotation.x = Math.PI / 2;
    cog.add(disc);
    for (let t = 0; t < teeth; t++) {
      const a = (t / teeth) * Math.PI * 2;
      const notch = t === 0; // the marker tooth
      const tooth = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.09, 0.09),
        notch ? pal.glow(pal.accent) : pal.trim,
      );
      tooth.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
      tooth.rotation.z = a;
      cog.add(tooth);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12), pal.trim);
    hub.rotation.x = Math.PI / 2;
    cog.add(hub);
    cog.position.set(cx, 1.4, 0.02);
    // Start scrambled to a random tooth position (still a multiple of step so
    // it's solvable to exactly up).
    cog.rotation.z = step * (1 + rng.int(teeth - 1));
    group.add(cog);
    cogs.push(cog);
  }
  return { group, cogs, step };
}
