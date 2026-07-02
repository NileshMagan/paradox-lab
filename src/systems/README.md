# systems/ — Runtime systems

Cross-cutting systems that run every frame or on events:
- `interaction/` — pointer raycast hover/click on room-registered hotspots
  (`Interactable` in `rooms/types.ts`). Clicks that drag the camera don't fire.
- `puzzle/` — the puzzle dependency graph + solved-state store. Currently a
  module singleton; it is the local stand-in for the server-authoritative
  store (see docs/ARCHITECTURE.md → Multiplayer plan).
- `audio/` — (planned) full per-dimension soundscapes. Small synth cues
  currently live in `core/audio.ts`.
