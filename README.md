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

**Room 1 (Sync Chambers) is fully dressed in both dimensions**, matching the
reference art: Alpha has god-rays through a cracked skylight, drifting dust
motes, the carved zodiac mural, rusted gears, the drip-and-bucket, pulsing
bioluminescent flora, ivy, rubble and puddles; Beta has the LED ceiling,
glowing cyan floor web, an animated holographic audio analyzer, the artifact
pedestal, star-map console, octagonal R2 door with blinking lockdown bar and a
sweeping amber beacon. All scenery is procedural (canvas textures + primitive
geometry) — no external assets. Orbit controls let you look around.

R2/R3 are still blockout with puzzle prop slots placed from the finalized
design. Not yet built: puzzle logic, audio, and the multiplayer/voice
networking layer (see ARCHITECTURE.md).

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
