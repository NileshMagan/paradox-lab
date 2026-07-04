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

**Two shipped ADVENTURES** (`src/scenery/rooms/`) — three stages each, an
inventory (`carry`) travelling between stages, every chain verified solvable
end-to-end by scripted playthrough:

| Adventure | Stages (7-8 beats each) |
|---|---|
| The Pharaoh's Curse | 1. **Antechamber** — glyph halves → rings 3·5·2 → sarcophagus → gear → chest → *scarab* → pillar bands → plate. 2. **Hall of Judgement** — judgement panel → canopic jars → the third weight → balance the scale → chime triad → *ankh*. 3. **Burial Vault** — ankh lights the braziers → bearing wall → aim two mirrors → rune ring ×5 → death mask → crown the guardian. |
| Operation Blackout | 1. **Bureau 13** — evidence board → dead clock 4:35 → keypad → lasers drop → safe → *keycard* → gate → briefcase → vault ×3. 2. **The Archives** — patient file → reel tape → patch 2-into-5 → power → x-ray shows 7 → dial → *microfilm* → freight gate (needs keycard). 3. **Server Vault** — microfilm on holo table → breakers 2·4·1 → robot arm fetches core → monitor decodes → buttons 1·3·2 → pneumatic chip → blast door. |

## Viewers (Vite pages — plain static servers can't serve them)

- `/gallery.html` — 36 aisles, every builder. `[1-9]`+`[`/`]` navigate,
  `[R]` reseed, `[T]` light moods.
- `/rooms.html` — playable rooms. Click props to play; `[1]/[2]` rooms,
  `[V]` cameras, `[C]` ceiling, `[R]` restart. E2E bridge:
  `window.__composedRooms.click(id)`.

## Expected challenge duration (honest estimate)

Each adventure is 3 rooms × 7-8 gated beats ≈ 22 beats with search +
deduction + cross-stage inventory. For a real group at a screen:
**~50–70 minutes per adventure**, hint-free — each theme is now a full
hour-long experience on its own. Remaining knobs: countdown timer, hints,
red herrings.

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
