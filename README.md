# The Quantum Split

A co-operative digital escape room built with **Three.js + TypeScript**. A
temporal experiment splits one laboratory into two parallel dimensions —
**Alpha** (an overgrown, decaying past) and **Beta** (a sterile neon future).
Two players are trapped one in each, share the *same physical layout* but see
completely different worlds, and must talk each other through it to escape.

> Full concept in [`docs/DESIGN.md`](docs/DESIGN.md).

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

### Dev controls

| Key | Does |
|-----|------|
| `1` / `2` | Switch dimension: Alpha / Beta (dev stand-in for per-player assignment) |
| `Q` / `E` | Previous / next room (Sync Chambers → Grid → Paradox Core) |
| `0` | Toggle **admin overview** — bird's-eye dollhouse of the whole facility, ceilings hidden |
| Drag / scroll | Orbit and zoom (no collision — it's a dev camera, not the gameplay camera) |

URL params for deep links: `?dim=alpha|beta`, `?room=1..3`, `?view=overview`.

## Scripts

| Command | Does |
|---------|------|
| `npm run dev` | Vite dev server (auto-opens browser) |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over `src/` |
| `npm run format` | Prettier write |

## Project docs

- [`docs/DESIGN.md`](docs/DESIGN.md) — game design document (the concept)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — code structure + multiplayer plan
- [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) — code & doc conventions
- [`docs/ASSET_PROMPTS.md`](docs/ASSET_PROMPTS.md) — AI concept-art prompts

## Status

**The full set is dressed — all three rooms, both dimensions**, matching the
reference art in `docs/reference/`. All scenery is procedural (canvas textures
+ primitive geometry), no external assets:

- **R1 Sync Chambers** — Alpha: god-rays, dust motes, zodiac stone mural,
  rusted gears, drip-and-bucket, bioluminescent flora. Beta: LED ceiling, cyan
  floor web, animated holo audio analyzer, artifact pedestal, star-map
  console, lockdown door, amber beacon.
- **R2 Botanical/Cyber Grid** — Alpha: greenhouse gable roof, mutated flora
  wall, soil/pH bench with test strips, rusted pipes + valves, overgrown
  server cabinets, hanging CRTs, floor roots. Beta: laser-grid maze
  (crimson/blue, animated), server racks with LED faces, chemical analyzer
  kiosk, patrolling ceiling-track drones with red scan cones.
- **R3 Paradox Core** — Alpha: ruined dome with oculus god-rays over the
  black-abyss pit, suspended reactor cage, whiteboard equations, heavy mirrors
  on tracks, rusted manual lever. Beta: live reactor beam holding the same
  cage, time-dilation charts with a 2× countdown, Core Control Terminal,
  sleek lever, orbiting drones.

**The first puzzle loop is playable** (single-client, using the `1`/`2`
dimension toggle to act as both players):

1. **Alpha** — the bucket drips a rhythm (short · short · long · short), with
   sound. Click the bucket for a hint.
2. **Beta** (`2`) — click the **Audio Analyzer** to arm it, then tap the
   rhythm on it (5 taps, any tempo — intervals are matched scale-free).
   Success decrypts the **Star Map**: *SECTOR LEO*.
3. **Alpha** (`1`) — the mural rings unjam. Click the **Stone Mural** to
   rotate; align **♌ Leo** under the notch.
4. Both R1 doors release — Alpha's hatch wheel spins and creaks open, Beta's
   lockdown bar turns green and the leaf slides up.

Hover anything glowing for a label; toasts narrate progress. Dev param
`?solve=sync.frequency,sync.starmap` pre-solves for testing.

Not yet built: puzzles for R2/R3 (props are dressed and labelled, logic
pending), full ambient audio, and the multiplayer/voice networking layer —
puzzle state currently lives in a client-side store shaped to move
server-side (see ARCHITECTURE.md).

## Current structure

```
src/
├── main.ts            bootstrap + dev dimension toggle
├── core/Engine.ts     renderer, camera, resize, loop
├── config/            constants (art direction) + facility.ts (the footprint)
├── dimensions/        Dimension base + alpha/ + beta/ renderers
├── systems/           audio · interaction · puzzle (planned)
├── net/               multiplayer (planned)
├── ui/devHud.ts       dev overlay
└── types/             shared domain types
```
