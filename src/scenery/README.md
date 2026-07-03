# scenery/ — Deterministic set-dressing toolkit

Reusable, parametric scenery builders plus a seeded placement engine. This is
the substrate for dressing rooms quickly without hand-placing every prop, and
for keeping generated worlds **identical across page loads and clients**.

## Why deterministic

Everything here draws randomness from `Rng` (mulberry32, `rng.ts`) — never
`Math.random()`. One seed ⇒ one exact world. The planned multiplayer layer is
server-authoritative, so two clients of the same dimension must agree on every
strand of ivy; a seed string is all the server ever needs to send.

## Layout

| File | What |
|---|---|
| `rng.ts` | Seeded RNG. `fork(label)` derives independent streams from the *original* seed, so features can't perturb each other's draws. |
| `kits.ts` | `createAlphaKit()` / `createBetaKit()` — shared materials per dimension look (few shader programs, one dispose owner) + `disposeSceneryObject`. |
| `palettes.ts` | **The scaling axis.** Role-based `Palette` (body/trim/metal/soft/glass/glow) + 16 stock themes: overgrown, neon, rustbelt, sterile, scorched, abyssal, sandstone (Egyptian), temple, speakeasy, noir, arctic, streets, agency (spy), gothic, saloon, brass (steampunk). Every palette-driven builder renders in every theme; a new room theme is a ~12-line `PaletteSpec`, not a new asset set. |
| `assets/alpha.ts` | Organic builders: roots, vines, moss, ferns, rubble, slabs, stalactites, bio-pods, puddles, dead trees, grime, ivy. |
| `assets/beta.ts` | Tech builders: cable runs, conduits, server racks, vents, holo signs, light strips, catwalks, barriers, manifolds, kiosks, hazard decals, monitor walls. |
| `assets/shared.ts` | Same-silhouette builders (crates, pillars, barrels, gantries) that take explicit materials — build twice from same-label forks and the shape mirrors across dimensions. A `Palette` satisfies `SharedMats`, so these also take palettes directly. |
| `assets/architecture.ts` | Palette-driven bones: door frames, archways, stairs, railings, windows, ceiling beams, daises, floor grates, wall panelling. |
| `assets/furniture.ts` | Palette-driven human layer: desks, chairs, shelving, lockers, stools, bunks, cabinets, notice boards, partitions. |
| `assets/machines.ts` | Palette-driven plant: tanks, generators, console banks, centrifuges, control panels, pumps, gas cylinders, cooling fans. |
| `assets/clutter.ts` | Palette-driven small stuff to scatter liberally: books, bottles, tools, papers, cable coils, pallets, tarp piles, crates, hanging lamps. |
| `assets/wallArt.ts` | Photos & pictures: seeded procedural framed photographs, portraits, posters, polaroid strings, murals, blueprints, settable wall clock, lightbox, mirror, plaques. Built as clue-carriers — same seed ⇒ same picture on every client. |
| `assets/puzzleInputs.ts` | Puzzle input devices, each returning named handles for game wiring: keypad, combination dial, rotary symbol rings, lever bank, Simon buttons, wire fuse panel, crank, slide rail, pressure plate, patch board. |
| `assets/puzzleObjects.ts` | Puzzle mechanisms with handles: locked chest, safe, balance scale, symbol tiles, pivoting track mirror, weight set, glyph pillar, chime rack, rune floor, key relics. |
| `assets/laboratory.ts` | Bench science: microscope, burner rig, specimen jars, fume hood, sample fridge, tube racks, autoclave, petri stacks, scale, chemical shelf. |
| `assets/medical.ts` | Infirmary: gurney, IV stand, med cabinet, surgical light, wheelchair, biohazard bin, defib cart, privacy screen, x-ray viewer (procedural bone film), scanner arch. |
| `assets/industrial.ts` | Plant floor: conveyor, chain hoist, workbench + vice, tool wall (with missing-tool outlines), furnace, anvil, ladder, scaffold, cable reel, pipe bridge. |
| `assets/storage.ts` | Logistics: shipping container, filing cabinet, archive shelf, wire cage, cargo net pile, crate pyramid, hand truck, spool rack, coat rail, drum rack. |
| `assets/lighting.ts` | Fixtures & glow FX (emissive-only, lights strictly opt-in): sconce, floodlight tripod, emergency beacon, neon sign, candles, lantern, string lights, spot rig, glow rope, light panel. |
| `assets/hightech.ts` | Sci-fi instruments: holo table, antenna mast, radar dish, robot arm, charge dock, drone rack, sensor pylon, CCTV, server totem, control lectern. |
| `assets/egyptian.ts` | Tomb theme: obelisk, sarcophagus, hieroglyph panels (seeded glyph code-carriers), canopic jars, pharaoh bust, altar, ankh, sphinx, sand drifts, scarab relief. |
| `assets/temple.ts` | South-Asian temple: carved pillars, lotus fountain, elephant statue, mandala + rangoli floor art (procedural), bell chains, incense, shrine alcove, torana arch, diya rows. |
| `assets/bar.ts` | Bar/speakeasy: counter, lit back-bar, beer taps, pool table, dartboard (seeded darts = readable code), jukebox, booth, glass rack, kegs. |
| `assets/city.ts` | Urban street: street lamps, working traffic light, hydrant, mailbox, dumpster, bus shelter, graffiti tags (procedural), manhole, awning, phone booth. |
| `assets/winter.ts` | Snow/ice: drifts, snowman, icicles, snow pines, frozen pond, log pile, sled, ice-block wall, snowy lamp post, igloo arch. |
| `assets/spy.ts` | Agent thriller: laser tripwires, crackable vault door (door/wheel/bolts handles), evidence board with red string, dossier table, briefcase, reel-to-reel listening post, disguise rack, map table, keycard gate. |
| `assets/gothic.ts` | Dark/crypt: coffin, candelabra, gargoyle, tombstones, iron fence, chandelier, cobwebs, broken mirror, crypt niche, cauldron. |
| `assets/custom.ts` | **Swappable content**: picture frames, gallery walls, posters, TV screens, standees, banners, desk photos, display cases — each returns `ImageSlot`s (`slot.setImage(await loadImageTexture(url))`) so rooms are personalised per group without touching geometry. Plus `textTexture` for arbitrary text and `engravedPlaque(lines)`. |
| `assets/vista.ts` | **The world outside**: `windowVista` (window + glowing seeded panorama — city-night/mountains/desert/forest/ocean), building facades with lit windows, skyline blocks, cabin, guard tower, colonnade, walls with door/window openings. |
| `assets/weather.ts` | **Animated atmosphere** (`{ group, update }` — drive from the room loop): snowfall, rainfall, fog banks, ground mist, dust motes, falling leaves, ember sparks, strobing lightning, drifting clouds, god-rays. Theme-agnostic; colours via opts. |
| `assets/water.ts` | Animated water: rippling surfaces, scrolling waterfalls, spraying fountains, streams, wishing well, lily pads, ceiling drips. |
| `assets/vehicles.ts` | Sedan (+taxi variant), delivery van, forklift (lifting fork handle), bicycle, utility buggy, rowboat, wooden wagon. |
| `assets/figures.ts` | Faceless presences: poseable mannequin, tailor's dummy, suit of armour, skeletal remains, scarecrow, robed statue, empty space suit, antique diving suit. |
| `assets/nautical.ts` | Ship's wheel, anchor, porthole (real sea panorama behind the glass), cannon, sweeping lighthouse beacon, bell, buoy, oar rack. |
| `assets/western.ts` | Swinging saloon doors, wagon wheel, hay bales, saguaro, trough, hitching post, pot-belly stove, flickering campfire. |
| `assets/steampunk.ts` | Meshing gear wall, riveted boiler, brass telescope, orbiting orrery, typewriter, gramophone, spinning airship prop, pneumatic tubes, automaton bust. |
| `dress.ts` | Placement engine: `scatter` (spacing + keep-outs), `alongWall`, `ring` → pure `Placement[]` data, applied with `applyPlacement`. |
| `gallery/` | Dev showroom: `npm run dev` → open `http://localhost:5173/gallery.html`. `[R]` reseeds, `[T]` cycles light moods, `[1-9]` jumps to an aisle, `[`/`]` steps aisles, `[0]` overview. Palette-driven aisles wear the stock palettes in rotation. Must be served by Vite (it compiles the TS entry) — a plain static server (e.g. VS Code Live Server) can't load it. |

## How the library scales

Don't count assets — count the multiplier: **~300 builders × 16 palettes × unlimited
seeds**, and most builders take shape parameters on top. "How many assets do we
need for a new room?" is usually zero: pick a palette (or write a new spec),
choose ~10–15 builders, and let the dressing kit place them around the puzzle
slots.

## Puzzle-prop handle convention

Builders that game logic animates return `{ group, ...handles }` — e.g.
`keypad` → `{ group, keys, screenMaterial }`, `pivotMirror` →
`{ group, yoke, mirror }`. Every handle's axis and range is documented in the
builder's JSDoc; the gallery's animated exhibits (chasing sequence buttons,
ticking clock, sweeping CCTV) show each handle being driven the way a real
puzzle would.

## Rules

- **Positions still come from the blueprint.** Puzzle props are placed via
  `slotLocal()` as ever; this toolkit is for *dressing around* them. Pass the
  slot positions (and doors/camera spawn) as `scatter`'s keep-out discs.
- **Lights are opt-in.** Builders glow with emissive materials; real
  `THREE.Light`s are added deliberately by the room (they're gated per room —
  see `Dimension.ts`).
- **Dispose via the kit.** Builder output is freed with
  `disposeSceneryObject(root)`; kit materials outlive props and are freed once
  with `kit.dispose()`. Instance-owned materials are flagged
  `userData.disposeMaterial` by their builders.

## Recipe

```ts
const kit = createAlphaKit();
const rng = new Rng('grid-alpha:v1'); // any stable string; version it to reshuffle
const avoid = [
  { ...slotLocal(RoomId.Grid, 'grid.analyzer'), radius: 1.4 },
  { x: 0, z: 8, radius: 1.6 }, // doorway
];
for (const p of scatter({ seed: 'grid-alpha:rubble', area: insetArea(6, 18), count: 5, avoid })) {
  const pile = rubblePile(rng.fork(`rubble:${p.x.toFixed(2)},${p.z.toFixed(2)}`), kit);
  applyPlacement(pile, p);
  root.add(pile);
}
```

For cross-dimension mirrored clutter, compute ONE `Placement[]` from a seed
both room builders share, then map each placement to an Alpha asset in Alpha
and a Beta asset in Beta — silhouettes line up, looks diverge.
