# Code & Doc Conventions

Keep the codebase legible as it grows. These are the rules; the tooling
(`tsconfig`, ESLint, Prettier) enforces most of them.

## TypeScript

- **Strict everywhere.** `strict`, `noUnusedLocals`, `noUnusedParameters`,
  `noImplicitReturns`, `exactOptionalPropertyTypes` are all on. Don't loosen
  them to make an error go away — fix the type.
- **No `any`.** Prefer `unknown` + narrowing, or a real type. If you genuinely
  must, isolate it and comment why.
- **Prefix intentionally-unused params with `_`** (e.g. `_delta`) — required by
  the base-class hook signatures.
- **Imports use the `@/` alias** for anything under `src/` (not `../../..`).
- **`import type`** for type-only imports (`verbatimModuleSyntax` is on).

## Naming

- **Files:** `PascalCase.ts` for classes (`Engine.ts`, `AlphaDimension.ts`),
  `camelCase.ts` for modules/utilities (`facility.ts`, `devHud.ts`).
- **Types & classes:** `PascalCase`. **Functions & vars:** `camelCase`.
  **Constants:** `SCREAMING_SNAKE_CASE` for true module-level constants
  (`FACILITY`, `RENDER`).
- **Domain vocabulary is fixed** — use `Dimension`, `Alpha`/`Beta`, `RoomId`,
  `PropSlot`, "footprint" consistently. Don't invent synonyms.

## Structure

- **The footprint is sacred.** Layout/positions live only in `config/facility.ts`.
  Never hard-code prop coordinates inside a dimension — read them from the
  blueprint so Alpha and Beta stay mirrored.
- **Dimensions own visuals, not layout.** A dimension decides how a slot *looks*,
  never *where* it is.
- **Engine stays game-agnostic.** Nothing in `core/` should know about the
  Quantum Split specifically.
- **Dispose Three.js resources** (`geometry.dispose()`, `material.dispose()`,
  `renderer.dispose()`) when tearing objects down — GPU memory isn't GC'd.

## Comments

- Explain **why**, not what. The signature says what; the comment says the
  reasoning, the invariant, or the gotcha.
- Mark unfinished work with `// TODO:` / `// NOTE:` and keep it honest —
  placeholder blockout code says so.

## Commits (once git history starts)

- Imperative mood, scoped: `feat(alpha): pulsing bioluminescence`,
  `fix(engine): cap pixel ratio on hi-DPI`.
- Keep `DESIGN.md` / `ARCHITECTURE.md` updated in the same commit as the change
  they describe.

## Commands

```bash
npm run dev        # Vite dev server (opens browser)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # typecheck + production build
npm run format     # prettier write
```
