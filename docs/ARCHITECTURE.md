# Architecture

How the code is organised and why. Read [DESIGN.md](./DESIGN.md) first for the
game concept, and [CONVENTIONS.md](./CONVENTIONS.md) for code style.

## Guiding idea: one blueprint, two renderers

The whole codebase is shaped by the **mirrored footprint** rule: the lab's
physical layout exists once as data, and each dimension is a renderer over that
data. Geometry *positions* come from the blueprint; *materials and lighting*
come from the dimension. This makes the "same place, different reality"
invariant structural rather than something we have to remember to maintain.

## Directory layout

```
src/
├── main.ts                 # bootstrap: engine + dimensions + orbit controls + dev toggle
├── core/                   # engine-level, game-agnostic
│   ├── Engine.ts           # renderer, camera, resize, animation loop, shadows
│   └── textures.ts         # procedural canvas textures (concrete, steel, mural, holo…)
├── config/
│   ├── constants.ts        # render tuning + per-dimension art direction
│   └── facility.ts         # THE MIRRORED FOOTPRINT (single source of truth) + slotLocal()
├── dimensions/
│   ├── Dimension.ts        # abstract base: builds scene from the footprint;
│   │                       #   buildRoomDetail() hook swaps blockout → dressed room
│   ├── alpha/              # "The Overgrown Past" renderer
│   └── beta/               # "The Neon Future" renderer
├── rooms/
│   ├── types.ts            # RoomDetail contract (object + per-frame update)
│   └── sync/               # Room 1 fully dressed for both dimensions
│       ├── octagonShell.ts # shared octagon geometry (mirrored by construction)
│       ├── SyncChamberAlpha.ts
│       └── SyncChamberBeta.ts
├── entities/              # (planned) props, interactables, the player
├── systems/                # cross-cutting runtime systems
│   ├── audio/              # (planned) per-dimension soundscapes
│   ├── interaction/        # (planned) raycast pick / use
│   └── puzzle/             # (planned) puzzle graph + cross-dimension effects
├── net/                    # (planned) multiplayer — see below
├── ui/
│   └── devHud.ts           # dev-only overlay
└── types/
    └── index.ts            # shared domain types (DimensionId, RoomBlueprint…)
```

### Detailed rooms vs. blockout

A dimension can hand-dress a room by overriding `buildRoomDetail(room)` and
returning a `RoomDetail` (a fully built scene graph + optional per-frame
`update`). Rooms without a detail builder fall back to the generic shell +
prop-archetype blockout. Room builders MUST take puzzle-prop positions from
`slotLocal()` (never hard-code them) so Alpha and Beta stay mirrored — the
octagon shell itself is shared code called with different materials, which
makes the mirroring structural. The Sync Chamber (R1) is fully dressed in both
dimensions; R2/R3 are still blockout.

`@/` is aliased to `src/` (see `tsconfig.json` + `vite.config.ts`).

## Runtime flow (current)

1. `main.ts` creates the `Engine` (renderer + camera + loop).
2. It builds both `Dimension`s from `FACILITY`. Each `.build()` walks the
   blueprint, creates a room `Group` per room, and delegates shell + prop
   visuals to the subclass hooks.
3. A dev toggle (`[1]`/`[2]`) swaps which dimension's scene is rendered. In the
   real game the networking layer assigns exactly one dimension per player.
4. `engine.onUpdate` drives the active dimension's `update(delta, elapsed)` for
   animated elements (bioluminescence pulse, drones, sirens…).

## Extending it

- **New prop visual:** add a `PropSlot` to the room in `facility.ts` (once, for
  both dimensions), then handle its `slot.id` in each dimension's `buildProp`.
- **New room:** add a `RoomBlueprint` to `FACILITY`.
- **New animated behaviour:** drive it from the dimension's `update`.

## Multiplayer plan (not yet built)

The client is deliberately scaffolded first. When we add networking, the shape
is expected to be:

- **Transport:** a lightweight authoritative **WebSocket game server** (`net/`
  + a sibling `server/` package) holding shared session state — which player is
  in which dimension, and the puzzle graph state that spans both.
- **Cross-dimension effects:** a player's interaction sends an intent to the
  server; the server mutates shared state and broadcasts deltas; each client
  applies the delta to *its* dimension. This is what makes "turn the valve in
  Alpha → power reroutes in Beta" work.
- **Voice:** peer-to-peer **WebRTC audio** with the game server (or a small
  signalling service) as the signalling channel. STUN for dev, TURN for prod
  NAT traversal. Config stubs already in `.env.example`.
- **Authority:** server-authoritative for puzzle state to prevent desync and
  cheating; clients are renderers + input.

Keeping puzzle state server-side (not in either client) is the key decision —
it's the only place both dimensions genuinely coexist.
