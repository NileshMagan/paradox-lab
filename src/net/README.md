# net/ — Multiplayer

Client-side networking for The Quantum Split.

- `RoomClient.ts` wraps the WebSocket protocol.
- `netBoot.ts` activates only with `?mp=1`, joins the room server, applies the
  assigned Alpha/Beta role, replicates solved puzzles, and syncs live session
  channels such as laser colour, valves, mirrors, and lever timing.
- `protocol.ts` is the shared message contract used by `server/room-server.mjs`.

Voice is still future work. See `docs/ARCHITECTURE.md`.
