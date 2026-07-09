# The Quantum Split

A co-operative digital escape room built with **Three.js + TypeScript**. A
temporal experiment splits one laboratory into two parallel dimensions —
**Alpha** (an overgrown, decaying past) and **Beta** (a sterile neon future).
Two players are trapped one in each, share the _same physical layout_ but see
completely different worlds, and must talk each other through it to escape.

> Full concept in [`docs/DESIGN.md`](docs/DESIGN.md).

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173 → the Paradox Lab hub (landing page)
```

### Pages

| Page                                      | What it is                                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `/` (`index.html`)                        | **The hub / lobby** — pick a room, configure a session (timer, difficulty, dimension, dev mode), and launch. See `src/lobby/`. |
| `/quantum.html`                           | **The Quantum Split** — the 2-player cross-dimension co-op game (`src/main.ts`).                                               |
| `/rooms.html?adventure=pharaoh\|blackout` | **The solo adventures** — _The Pharaoh's Curse_ and _Operation Blackout_ (`src/scenery/rooms`).                                |
| `/gallery.html`                           | Scenery showroom (dev) — see `src/scenery/README.md`.                                                                          |

The lobby launches games with settings in the query string (`?code=` `?name=`
`?timer=` `?difficulty=` `?hints=` `?dim=` `?mp=` `?ws=` `?dev=`), so any game
page can also be deep-linked directly.

### Dev controls (Quantum Split — launch with **Developer mode** on / `?dev=1`)

| Key           | Does                                                                                    |
| ------------- | --------------------------------------------------------------------------------------- |
| `1` / `2`     | Switch dimension: Alpha / Beta (dev stand-in for per-player assignment)                 |
| `Q` / `E`     | Previous / next room (Sync Chambers → Grid → Paradox Core)                              |
| `0`           | Toggle **admin overview** — bird's-eye dollhouse of the whole facility, ceilings hidden |
| Drag / scroll | Orbit and zoom (no collision — it's a dev camera, not the gameplay camera)              |

URL params for deep links: `?dim=alpha|beta`, `?room=1..3`, `?view=overview`.

### Networked co-op (local scaffold)

The Quantum Split has a **local multiplayer scaffold** — real shared rooms over
a WebSocket server, gated behind `?mp=1` so normal single-client play is
untouched.

```bash
npm run dev:mp     # runs Vite + the room server together
```

Then open the hub, pick **The Quantum Split**, flip on **Networked co-op**, and
launch — or open `quantum.html?mp=1&code=SOMECODE` in two tabs. The server
(`server/room-server.mjs`) assigns the first player Alpha, the second Beta, and
replicates puzzle solves across both. A presence panel shows who's in the room.

For hosted/static play, deploy `server/room-server.mjs` somewhere that supports
WebSockets, then set the repo variable `MP_URL` to its `wss://...` URL so the
Pages build bakes it in as `VITE_MP_URL`. You can also test any hosted server
without rebuilding by launching with `?mp=1&ws=wss://...`.

This is still a scaffold: room state, presence, solved puzzles, live session
channels, and final lever timing are shared, but most puzzle validation still
happens client-side. See `docs/ARCHITECTURE.md` → _Multiplayer_ for the next
authority steps.

## Scripts

| Command               | Does                                                                  |
| --------------------- | --------------------------------------------------------------------- |
| `npm run dev`         | Vite dev server (auto-opens browser)                                  |
| `npm run server`      | Local multiplayer room server (`ws://localhost:8787`)                 |
| `npm run dev:mp`      | Dev server **and** room server together (for networked co-op)         |
| `npm run build`       | Typecheck + production build to `dist/`                               |
| `npm run typecheck`   | `tsc --noEmit`                                                        |
| `npm run lint`        | ESLint over `src/`                                                    |
| `npm run format`      | Prettier write                                                        |
| `npm run test:e2e`    | Headless playthrough of **all 8 puzzles**, asserts each solves        |
| `npm run walkthrough` | Same playthrough, cinematically paced, records `docs/walkthrough.mp4` |

## Project docs

- [`docs/DESIGN.md`](docs/DESIGN.md) — game design document (the concept)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — code structure + multiplayer
- [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) — code & doc conventions
- [`docs/ASSET_PROMPTS.md`](docs/ASSET_PROMPTS.md) — AI concept-art prompts

## Status

**The full set is dressed — all three rooms, both dimensions**, matching the
reference art in `docs/reference/`. All scenery is procedural (canvas textures

- primitive geometry), no external assets:

* **R1 Sync Chambers** — Alpha: god-rays, dust motes, zodiac stone mural,
  rusted gears, drip-and-bucket, bioluminescent flora. Beta: LED ceiling, cyan
  floor web, animated holo audio analyzer, artifact pedestal, star-map
  console, lockdown door, amber beacon.
* **R2 Botanical/Cyber Grid** — Alpha: greenhouse gable roof, mutated flora
  wall, soil/pH bench with test strips, rusted pipes + valves, overgrown
  server cabinets, hanging CRTs, floor roots. Beta: laser-grid maze
  (crimson/blue, animated), server racks with LED faces, chemical analyzer
  kiosk, patrolling ceiling-track drones with red scan cones.
* **R3 Paradox Core** — Alpha: ruined dome with oculus god-rays over the
  black-abyss pit, suspended reactor cage, whiteboard equations, heavy mirrors
  on tracks, rusted manual lever. Beta: live reactor beam holding the same
  cage, time-dilation charts with a 2× countdown, Core Control Terminal,
  sleek lever, orbiting drones.

**The whole escape room is playable end-to-end** (single-client, using the
`1`/`2` dimension toggle to act as both players). All 8 puzzles from the
dependency graph in DESIGN.md §7, in order:

1. **`sync.frequency`** — Alpha's bucket drips a rhythm (short · short · long
   · short). Beta arms the **Audio Analyzer** and taps it back (5 taps, any
   tempo — intervals are matched scale-free). Decrypts the **Star Map**.
2. **`sync.starmap`** — Beta reads _SECTOR LEO_; Alpha clicks the **Stone
   Mural** to align **♌** under the notch. Both R1 doors release.
3. **`grid.chemical`** — Alpha runs the **soil bench** strips (pH 1, sulphur…);
   Beta cycles the **Chemical Analyzer** to the matching compound (H₂SO₄).
4. **`grid.bloom`** — Beta clicks the **laser grid** to shift its spectrum;
   Alpha's **flora wall blooms the same colour in real time**. When the blooms
   open, Alpha clicks the wall to wave Beta through — three zones, safe path
   BLUE → CRIMSON → BLUE.
5. **`grid.server`** — Alpha opens 3 **coolant valves**; Beta runs the
   **server-rack hack**. The R3 doors release in both dimensions.
6. **`core.anchor`** — Alpha reads the **whiteboards** (_ANCHOR ≡ 42.7_); Beta
   cycles the **dilation charts** to lock the constant.
7. **`core.mirrors`** — Beta's terminal calls for **mirrors 2 & 5**; Alpha
   winches exactly those two of the five **heavy mirrors** toward the core.
   Energy channels across the pit.
8. **`core.lever`** — both **levers** must be pulled within 6 s of each other
   ("3, 2, 1, PULL!"). A lone pull springs back. Success = the timelines
   merge and the victory card plays.

Hover anything glowing for a label (🔒 = locked); toasts narrate progress.
Dev param `?solve=` pre-solves puzzles in the order listed. The scripted
walkthrough (`npm run walkthrough`) plays all of this and records a video.

Not yet built: full ambient audio beds, WebRTC voice, and server-side validation
for every puzzle intent. The current multiplayer bridge shares room state via
`server/room-server.mjs`, `src/net/RoomClient.ts`, and the client-side stores
(`systems/puzzle/state.ts` + `session.ts`) that are shaped to move further
server-side.

## Current structure

```
src/
├── main.ts            bootstrap + dev dimension toggle + __qs test bridge
├── core/Engine.ts     renderer, camera, resize, loop
├── config/            constants + puzzles.ts (tuning) + facility.ts (the footprint)
├── dimensions/        Dimension base + alpha/ + beta/ renderers
├── rooms/             hand-dressed rooms (shells + props + interactables)
├── systems/           interaction (raycast) · puzzle (graph + live session)
├── net/               multiplayer client bridge
├── ui/                dev overlay · hover/toast HUD · victory ending
└── types/             shared domain types
scripts/walkthrough.mjs  scripted E2E playthrough + video recorder
```
