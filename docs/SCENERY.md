# Scenery Platform — Status & Roadmap

> **Status (July 2026):** library complete at ~330 builders; room composition
> system live; two playable escape rooms shipped. This document is the
> canonical "where are we" for the scenery workstream — read
> [`src/scenery/README.md`](../src/scenery/README.md) for the API reference.

## What exists

**The library** (`src/scenery/`): a deterministic, palette-driven set of
~330 parametric asset builders across 36 categories, built to compose *many*
future themed rooms (snow, dark, city, spy, bar, Indian, Egyptian, western,
steampunk, nautical, jungle…), not just the current three-room game.

- **Determinism**: every builder draws from a seeded `Rng` — one seed string
  reproduces the identical world on every client (multiplayer-ready).
- **Palettes** (16): role-based material kits (body/trim/metal/soft/glass/
  glow). Any builder renders in any theme; a new theme is a ~12-line spec.
- **Categories**: structure (walls/windows/vistas/buildings), furniture,
  machines, lab, medical, industrial, storage, lighting, high-tech, clutter,
  wall art & seeded photo props, puzzle inputs + puzzle objects (named
  animation handles), customisable media (`ImageSlot` — swap in real photos
  per group), weather & water FX (`{group, update}`), vehicles, figures,
  animated ambient characters, terrain, jungle, sound emitters
  (`userData.soundId` convention), plus bespoke Egyptian / temple / bar /
  city / winter / spy / gothic / nautical / western / steampunk sets.

**The room system** (`src/scenery/compose.ts`): `RoomSpec` recipes
(shell + lighting + named pieces + scatter, one seed) → `composeRoom()` →
`{ group, update, handles, dispose }`.

**The play layer** (`src/scenery/play.ts`): click routing + game context
(objectives, toasts, win). A room becomes playable by pairing its spec with a
`GameFactory` that wires `handles` into a puzzle chain. This is viewer-local
by design — the main game's puzzles stay in `systems/puzzle` and will be
server-authoritative (see ARCHITECTURE.md); a graduated room ports its
GameFactory logic there.

**Two shipped rooms** (`src/scenery/rooms/`), each with an 8-beat puzzle
chain, verified solvable end-to-end by scripted playthrough:

| Room | Theme | Chain |
|---|---|---|
| The Pharaoh's Antechamber | `sandstone` | wall glyphs → rotary rings (3·5·2) → sarcophagus opens → gear → chest → scarab → altar litany → pillar bands (2·4·1) → pressure plate → escape |
| Bureau 13 | `agency`/noir | evidence board → dead clock (4:35) → keypad → lasers power down → safe → keycard → gate → briefcase note → vault wheel ×3 → escape |

## Viewers (Vite pages — plain static servers can't serve them)

- `/gallery.html` — 36 aisles, every builder. `[1-9]`+`[`/`]` navigate,
  `[R]` reseed, `[T]` light moods.
- `/rooms.html` — playable rooms. Click props to play; `[1]/[2]` rooms,
  `[V]` cameras, `[C]` ceiling, `[R]` restart. E2E bridge:
  `window.__composedRooms.click(id)`.

## Expected challenge duration (honest estimate)

Each room has 8 gated beats with search + deduction between them. For a real
group at a screen: **~20–30 min per room, ~45–60 min for both** — hint-free.
Duration knobs when tuning is wanted: longer codes, more red-herring props
(the library has plenty), multi-room chains (an item from the tomb opens the
bureau), and time pressure via the countdown pattern from the main game.

## How to add a room

1. Copy `src/scenery/rooms/egyptianTomb.ts`, change palette/seed/pieces.
2. Copy `tombGame.ts`, wire your `handles` into a chain.
3. Register both in `rooms/main.ts` `ROOMS`.
4. `npm run dev` → `/rooms.html`, then verify with a scripted click-through.

## Boundaries & ownership

This workstream is fully additive: it does not touch `src/rooms/`,
`src/systems/puzzle`, or `main.ts` (another agent iterates those). The only
shared file edited is `vite.config.ts` (extra page entries). Graduating a
composed room into the mirrored-footprint game means: positions →
`config/facility.ts`, game logic → `systems/puzzle` + `Interactor`.

## Roadmap candidates

- Tune both rooms with hint systems + countdown timers.
- First-person walk controls in `/rooms.html` (currently orbit-only).
- More rooms (bar heist, winter cabin, jungle temple — all assets exist).
- Graduate one room into the main game's server-authoritative flow.
