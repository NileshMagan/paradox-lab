import * as S from '@/scenery';
import type { RoomSpec } from '@/scenery/compose';

/**
 * "Bureau 13" — a secret-agent / detective escape room composed from the
 * library. Puzzle chain the handles support:
 *   evidence board (string tour) + wall clock (frozen time) + dossiers →
 *   keypad code → laser corridor disarm → vault wheel → escape.
 * Handles: 'keypad', 'tripwires', 'vault', 'safe', 'clock', 'gate'.
 */

const W = 9;
const H = 3.4;
const D = 13;

export const agencyBureau: RoomSpec = {
  name: 'Bureau 13',
  paletteName: 'agency',
  seed: 'bureau:v1',
  size: { w: W, h: H, d: D },
  shell: { floor: 0x1b232b, walls: 0x2a3944, ceiling: 0x141b22 },
  lighting: {
    ambient: { color: 0xbfd4e8, intensity: 0.5 },
    points: [
      { x: 0, y: 2.9, z: 2.5, color: 0xdfe9ff, intensity: 12 },
      { x: 0, y: 2.9, z: -2.5, color: 0xdfe9ff, intensity: 12 },
      // Red wash over the vault end — danger reads before the lasers do.
      { x: 0, y: 2.4, z: -5.6, color: 0xff4a4a, intensity: 8, distance: 7 },
      // Warm pool over the detective's desk.
      { x: 2.2, y: 2.2, z: 3.4, color: 0xffd9a0, intensity: 9, distance: 6 },
    ],
  },
  pieces: [
    // ── The case: desk, evidence, dossiers ─────────────────────────────────
    { at: [2.2, 3.4], rotY: -0.5, clearRadius: 1.6, build: (rng, pal) => S.dossierTable(rng, pal) },
    { at: [1.3, 2.5], rotY: 2.4, build: (rng, pal) => S.swivelChair(rng, pal) },
    { at: [2.4, 3.2], y: 0.78, rotY: -0.6, clearRadius: 0, build: (_rng, pal) => S.deskPhoto(pal).group },
    { id: 'board', at: [-W / 2 + 0.15, 3.5], rotY: Math.PI / 2, build: (rng, pal) => S.evidenceBoard(rng, pal) },
    { at: [-W / 2 + 0.15, 1.2], rotY: Math.PI / 2, build: (rng, pal) => S.mapTable(rng, pal) },
    { id: 'briefcase', at: [3.4, 1.6], rotY: 0.8, build: (rng, pal) => S.briefcase(rng, pal) },
    { at: [-3.5, 5.2], rotY: 1.2, build: (rng, pal) => S.listeningPost(rng, pal) },
    { at: [3.8, 4.9], rotY: -Math.PI / 2, build: (rng, pal) => S.disguiseRack(rng, pal) },
    // ── Records wall ───────────────────────────────────────────────────────
    { at: [W / 2 - 0.5, 2.6], rotY: -Math.PI / 2, build: (rng, pal) => S.filingCabinet(rng, pal) },
    { at: [W / 2 - 0.5, 1.4], rotY: -Math.PI / 2, build: (rng, pal) => S.filingCabinet(rng, pal) },
    { at: [W / 2 - 0.6, 0.1], rotY: -Math.PI / 2, build: (rng, pal) => S.archiveShelf(rng, pal) },
    { at: [W / 2 - 0.35, -1.6], y: 1.35, rotY: -Math.PI / 2, clearRadius: 0, build: (rng, pal) => S.radioSet(rng, pal) },
    // ── The clock frozen at the crucial minute (clue) ─────────────────────
    {
      id: 'clock',
      at: [0, D / 2 - 0.15],
      rotY: Math.PI,
      clearRadius: 0,
      build: (_rng, pal) => {
        const clock = S.wallClock(pal);
        clock.hourHand.rotation.z = -((4 + 35 / 60) / 12) * Math.PI * 2; // 4:35 — the code is 435
        clock.minuteHand.rotation.z = -(35 / 60) * Math.PI * 2;
        return clock;
      },
    },
    // ── Security gauntlet: keypad → lasers → vault ─────────────────────────
    { id: 'keypad', at: [-W / 2 + 0.15, -3.3], rotY: Math.PI / 2, clearRadius: 0.8, build: (rng, pal) => S.keypad(rng, pal) },
    { id: 'tripwires', at: [0, -3.4], clearRadius: 1.6, build: (rng, pal) => S.laserTripwires(rng, pal, { span: W - 2.4, beams: 5 }) },
    { id: 'vault', at: [0, -D / 2 + 0.4], clearRadius: 2, build: (rng, pal) => S.vaultDoor(rng, pal) },
    { id: 'safe', at: [-3.6, -1.4], rotY: Math.PI / 2 - 0.3, build: (rng, pal) => S.safeBox(rng, pal) },
    { id: 'gate', at: [2.6, -2.2], rotY: Math.PI / 2, build: (rng, pal) => S.keycardGate(rng, pal) },
    // ── Surveillance & security dressing ───────────────────────────────────
    { at: [-W / 2 + 0.2, -4.8], rotY: Math.PI / 2, build: (rng, pal) => S.sentryTurret(rng, pal) },
    { at: [W / 2 - 0.2, 5.8], rotY: -Math.PI / 2 - 0.5, build: (rng, pal) => S.surveillanceCamera(rng, pal).group },
    { at: [-1.5, 0.5], clearRadius: 0, build: (rng, pal) => S.hoverDrone(rng, pal, { height: 2.3 }) },
    { at: [-3.9, -3.9], build: (rng, pal) => S.serverTotem(rng, pal) },
    { at: [3.9, -4.4], build: (rng, pal) => S.gasCylinders(rng, pal, { count: 3 }) },
    // ── The city outside: rain-lashed windows + neon glow ─────────────────
    { at: [-W / 2 + 0.12, 5.0], rotY: Math.PI / 2, clearRadius: 0.6, build: (rng, pal) => S.windowVista(rng, pal, { kind: 'city-night' }) },
    { at: [W / 2 - 0.12, 3.6], rotY: -Math.PI / 2, clearRadius: 0.6, build: (rng, pal) => S.windowVista(rng, pal, { kind: 'city-night' }) },
    { at: [1.8, D / 2 - 0.15], rotY: Math.PI, build: (rng, pal) => S.neonSign(rng, pal, { color: 0xff2b3a }) },
    // ── Noir atmosphere ────────────────────────────────────────────────────
    { at: [0, 0], clearRadius: 0, build: (rng) => S.fogBank(rng, { width: W - 1, depth: D - 1, color: 0x8a94a2 }) },
    { at: [0, 3.4], clearRadius: 0, build: (rng, pal) => S.lightFixture(rng, pal, { drop: 1, color: 0xffd9a0 }), y: H },
    { at: [0, -1.2], clearRadius: 0, build: (rng, pal) => S.lightFixture(rng, pal, { drop: 1, color: 0xffd9a0 }), y: H },
    { at: [-2.8, 2.0], clearRadius: 0, build: () => S.soundMarker('bureau:rain', { color: 0x9fd8ff }) },
    { at: [0, -5.5], clearRadius: 0, build: () => S.soundMarker('bureau:vault-hum', { color: 0xff2b3a }) },
  ],
  scatter: [
    { count: 4, minSpacing: 1.4, build: (rng, pal) => S.paperScatter(rng, pal, { radius: 0.5, count: 7 }) },
    { count: 2, build: (rng, pal) => S.cableCoil(rng, pal) },
    { count: 2, build: (rng, pal) => S.bookRow(rng, pal, { length: 0.6 }) },
  ],
};
