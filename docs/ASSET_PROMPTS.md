# Concept Art Prompts

> **Locked reference art already exists** in [`docs/reference/`](./reference/)
> (the facility map + all six room views). Those are the canonical look. The
> prompts below are for regenerating variants, extra angles, or texture refs —
> match them to the reference, don't diverge.

Ready-to-paste prompts for generating concept art for The Quantum Split. Save
new generations under `public/assets/concept/` (gitignored — regenerate from
here). Each pair uses the **same camera and composition** so the two dimensions
read as the same room, honouring the mirrored-footprint rule.

> Tip: generate the Alpha and Beta variant of a room with the **same seed** and
> the same lens/angle wording so the geometry lines up between dimensions.

---

## Grid Room — Dimension Alpha ("The Overgrown Past")

```
Cinematic wide interior of a long rectangular Soviet-era brutalist laboratory
corridor abandoned for a thousand years and reclaimed by nature. Cracked
water-stained concrete walls choked with thick twisting ivy, floor covered in
dirt, shattered glass and stagnant puddles. Power is dead: illumination is
thick hazy beams of golden sunlight piercing massive cracks in the concrete
ceiling, heavy dust motes drifting in the light shafts. Mutated bioluminescent
moss and mushrooms cling to the walls casting a soft pulsing toxic-magenta and
cyan glow in the dark corners. A human skeleton in a rotting 1970s lab coat
slumped against the right wall clutching a leather-bound journal, tree roots
grown through its ribcage. Rusted iron wheels, a chalkboard of faded frantic
scribbles, filing cabinets rusted shut, thick braided copper cables hanging
like dead snakes. Eerie, damp, earthy, melancholic. Volumetric light,
photorealistic, 35mm, moody colour grade. --ar 16:9
```

## Grid Room — Dimension Beta ("The Neon Future")

```
Cinematic wide interior of the SAME long rectangular laboratory corridor, same
camera angle and proportions, but as a sterile hyper-advanced cyberpunk
facility running flawlessly long after humanity vanished. Seamless brushed
steel walls, matte-black carbon-fibre panelling, spotless white resin floor
mirroring the lights. Stark shadowless daylight-balanced LED panels line the
ceiling, overwhelmingly bright and clinical. Sleek obsidian glass desk slabs
glowing with holographic data, glowing fibre-optic streams running under
transparent floor tiles, electric-blue holographic interfaces floating in air.
An automated scanner drone on a ceiling track sweeping a harsh red laser. On
the right wall, in the exact spot the skeleton occupies in the other timeline,
an inert docked maintenance drone. Oppressive, clinical, electric, high-tension.
Photorealistic, 35mm, cool colour grade. --ar 16:9
```

---

## Paradox Core — Dimension Alpha

```
Cinematic interior of a massive cavernous domed reactor chamber, ancient
brutalist concrete overgrown by nature, a central circular reactor pit choked
with roots and glowing bioluminescent fungus, golden god-rays stabbing down
through cracks in the vast dome, dust and spores in the air, dead and silent.
Awe and decay. Photorealistic, ultra-wide, volumetric light. --ar 16:9
```

## Paradox Core — Dimension Beta

```
Cinematic interior of the SAME massive domed reactor chamber, same proportions,
as a pristine active high-tech reactor: a glowing central reactor pit of
electric-blue energy, concentric rings of holographic readouts, seamless steel
and white resin, emergency-amber warning lights rotating on lockdown. The
beating heart of a hostile AI. Photorealistic, ultra-wide, cool colour grade.
--ar 16:9
```

---

## Key art / title (optional)

```
Dramatic split-composition key art: a single laboratory room torn down the
middle. Left half overgrown ancient concrete ruin lit by golden sun shafts and
magenta bioluminescence; right half sterile neon-blue cyberpunk lab under stark
LED light. A glowing seam of temporal energy fractures down the centre where
the two halves meet. Title space at bottom. Cinematic, high contrast, moody.
--ar 16:9
```

## Notes for whichever generator you use

- **Midjourney:** `--ar 16:9`, add `--style raw` for less stylisation; reuse
  `--seed N` across an Alpha/Beta pair.
- **DALL·E / SD / Ideogram:** drop the `--ar`/`--seed` flags and set aspect
  ratio / seed in the UI.
- The palette lives in code at `src/config/constants.ts` (`DIMENSION_THEME`) —
  keep generated art and in-engine colours roughly aligned.
```
