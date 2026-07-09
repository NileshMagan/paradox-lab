# CLAUDE.md — The Quantum Split

Guidance for Claude Code working in this repo.

## What this is

A co-operative digital escape room in **Three.js + TypeScript** (Vite). One lab
splits into two dimensions — **Alpha** (overgrown past) and **Beta** (neon
future) — that share one physical layout but look completely different. Read
`docs/DESIGN.md` for the concept before making game-logic changes.

## The one rule that shapes everything

**The mirrored footprint.** Both dimensions share the exact same physical
blueprint, defined once in `src/config/facility.ts`. Layout/positions live only
there. Dimensions (`src/dimensions/alpha`, `.../beta`) decide how things _look_,
never _where they are_. Never hard-code prop coordinates inside a dimension.

## Conventions

Follow `docs/CONVENTIONS.md`. In short: strict TypeScript (no `any`, no loosening
tsconfig), `@/` alias for `src/` imports, `import type` for types, `_`-prefix
unused params, dispose Three.js GPU resources, comments explain _why_.

## Before you finish a change

```bash
npm run typecheck   # must pass
npm run lint        # must pass
npm run build       # must pass for anything non-trivial
```

If you change runtime behaviour, verify it actually renders (`npm run dev`),
don't just trust the typecheck.

## Architecture pointer

The Quantum Split has an initial WebSocket multiplayer scaffold; WebRTC voice is
still future work. See `docs/ARCHITECTURE.md` → _Multiplayer_. Keep moving
cross-dimension puzzle authority toward the server; don't build new
cross-dimension puzzle logic into only one client.
