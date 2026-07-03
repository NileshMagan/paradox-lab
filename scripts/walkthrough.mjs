/**
 * Scripted end-to-end walkthrough of The Quantum Split.
 *
 * Boots the Vite dev server, drives a real browser through the ENTIRE puzzle
 * chain (both dimensions, all three rooms) via the `window.__qs` dev bridge,
 * asserts every puzzle actually solves in dependency order, and records the
 * run as a video (docs/walkthrough.webm).
 *
 *   npm run walkthrough              # full run + video (docs/walkthrough.mp4)
 *   npm run walkthrough -- --fast    # no cosmetic pauses (CI smoke test)
 *
 * Uses the system Chrome (channel: 'chrome') so no browser download is needed.
 * Playwright only records WebM; we transcode to H.264 MP4 (needs `ffmpeg` on
 * PATH) so the result plays anywhere. If ffmpeg is missing the raw WebM is kept.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FAST = process.argv.includes('--fast');
const VIDEO_PATH = resolve(root, 'docs/walkthrough.mp4');

/** Cosmetic pause so the video is watchable; skipped in --fast mode. */
const beat = (ms) => (FAST ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));

const log = (msg) => console.log(`  ${msg}`);

async function main() {
  const server = await createServer({ root, server: { port: 5199, strictPort: true } });
  await server.listen();
  log('vite dev server on :5199');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  // Record into a temp dir; only a finished run's video moves into docs/.
  // --fast is the CI smoke test — no pauses, so the footage is useless: skip it.
  const videoDir = FAST ? null : mkdtempSync(join(tmpdir(), 'qs-walkthrough-'));
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ...(videoDir ? { recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } } } : {}),
  });
  const page = await context.newPage();
  page.on('pageerror', (err) => {
    throw new Error(`page error: ${err.message}`);
  });

  let failed = false;
  try {
    await page.goto('http://localhost:5199/?dim=alpha&room=1');
    await page.waitForFunction(() => Boolean(window.__qs), null, { timeout: 15_000 });
    log('game booted');

    // Helpers that talk to the dev bridge.
    const activate = (dim) => page.evaluate((d) => window.__qs.activate(d), dim);
    const focusRoom = (i) => page.evaluate((n) => window.__qs.focusRoom(n), i);
    const interact = async (label) => {
      const hit = await page.evaluate((l) => window.__qs.interact(l), label);
      if (!hit) {
        const hotspots = await page.evaluate(() => window.__qs.hotspots());
        throw new Error(`no enabled hotspot matching "${label}". Hotspots:\n  ${hotspots.join('\n  ')}`);
      }
    };
    const waitSolved = async (id) => {
      await page.waitForFunction((p) => window.__qs.solved().includes(p), id, { timeout: 10_000 });
      log(`✓ ${id} solved`);
    };

    // ── Room 1 — Sync Chambers ──────────────────────────────────────────────
    log('ROOM 1 — the Sync Chambers');
    await beat(2500); // establish the Alpha ruin
    await interact('bucket'); // Alpha listens to the drip
    await beat(2000);

    await activate('beta');
    await beat(2000);
    // Arm the recorder and tap Alpha's rhythm: gaps of 0.6/0.6/1.2/0.6 s.
    // The whole sequence runs inside the page — driving each tap over the
    // CDP round-trip adds enough jitter to fail the rhythm tolerance.
    await page.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      window.__qs.interact('Audio Analyzer'); // arm
      for (const gap of [0, 600, 600, 1200, 600]) {
        await wait(gap);
        window.__qs.interact('Audio Analyzer');
      }
    });
    await waitSolved('sync.frequency');
    await beat(1200);
    await interact('Star Map'); // Beta reads the decrypted map

    await activate('alpha');
    await beat(1500);
    for (let i = 0; i < 4; i++) {
      await interact('Stone Mural'); // rotate to Leo (glyph index 4)
      await beat(700);
    }
    await waitSolved('sync.starmap');
    await beat(3000); // watch the hatch creak open

    // ── Room 2 — Botanical / Cyber Grid ────────────────────────────────────
    log('ROOM 2 — the Grid');
    await focusRoom(1);
    await beat(2000);
    await interact('Soil'); // Alpha runs the test strips
    await beat(1500);
    await interact('Soil');
    await beat(1500);

    await activate('beta');
    await beat(1500);
    // Cycle the analyzer to H₂SO₄ (4th compound).
    for (let i = 0; i < 4; i++) {
      await interact('Chemical Analyzer');
      await beat(600);
    }
    await waitSolved('grid.chemical');
    await beat(1500);

    // The laser maze: safe path is BLUE → CRIMSON → BLUE; grid starts CRIMSON.
    // Beta shifts the spectrum, Alpha (watching the flora bloom) waves Beta on.
    for (const colour of ['blue', 'crimson', 'blue']) {
      await activate('beta');
      await beat(1000);
      const current = await page.evaluate(() => window.__qs.session.laserColor);
      if (current !== colour) {
        await interact('Laser grid'); // shift the spectrum
        await beat(1200);
      }
      await activate('alpha');
      await beat(1200); // watch the blooms flip colour — the flagship effect
      await interact('Flora wall'); // wave Beta through the zone
      await beat(1000);
    }
    await waitSolved('grid.bloom');
    await beat(1500);

    // Coolant valves (Alpha) then the hack (Beta).
    for (let i = 0; i < 3; i++) {
      await interact('Coolant valves');
      await beat(900);
    }
    await activate('beta');
    await beat(1200);
    await interact('Server rack');
    await waitSolved('grid.server'); // hack takes ~3s of real time
    await beat(2500); // watch the R3 door slide open

    // ── Room 3 — Paradox Core ──────────────────────────────────────────────
    log('ROOM 3 — the Paradox Core');
    await focusRoom(2);
    await beat(2500); // establish the live reactor
    // Beta derives the anchor: cycle candidates to 42.7 (3rd candidate).
    for (let i = 0; i < 3; i++) {
      await interact('Dilation charts');
      await beat(700);
    }
    await waitSolved('core.anchor');
    await beat(1200);
    await interact('Core Control Terminal'); // read the mirror callout

    await activate('alpha');
    await beat(2000);
    await interact('whiteboards'); // Alpha cross-checks: ANCHOR 42.7, mirrors 2 & 5
    await beat(2000);
    await interact('Heavy mirror 2');
    await beat(1800); // the head winches around
    await interact('Heavy mirror 5');
    await waitSolved('core.mirrors');
    await beat(2500); // energy channels across the pit

    // The simultaneous pull: Alpha first, then Beta inside the sync window.
    await interact('Manual Lever');
    await beat(800);
    await activate('beta');
    await beat(800);
    await interact('Manual Lever');
    await waitSolved('core.lever');
    log('✓ ESCAPED — timelines merged');
    await page.waitForSelector('text=TIMELINES MERGED', { timeout: 10_000 });
    await beat(6000); // hold on the victory card

    // Final sanity: the whole dependency chain is solved.
    const solved = await page.evaluate(() => window.__qs.solved());
    if (solved.length !== 8) throw new Error(`expected 8 solved puzzles, got: ${solved.join(', ')}`);
    console.log('\nWALKTHROUGH PASSED — all 8 puzzles solved in order.');
  } catch (err) {
    failed = true;
    console.error('\nWALKTHROUGH FAILED:', err.message ?? err);
  } finally {
    const video = page.video();
    await context.close(); // flushes the recording
    if (video && videoDir) {
      const webm = await video.path();
      mkdirSync(dirname(VIDEO_PATH), { recursive: true });
      const ff = spawnSync(
        'ffmpeg',
        ['-y', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-movflags', '+faststart', VIDEO_PATH],
        { stdio: 'ignore' },
      );
      if (ff.status === 0) {
        console.log(`video: ${VIDEO_PATH}`);
      } else {
        // ffmpeg missing or failed — keep the raw WebM so the run isn't lost.
        const fallback = VIDEO_PATH.replace(/\.mp4$/, '.webm');
        renameSync(webm, fallback);
        console.log(`ffmpeg unavailable — kept raw recording: ${fallback}`);
      }
    }
    if (videoDir) rmSync(videoDir, { recursive: true, force: true });
    await browser.close();
    await server.close();
  }
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
