/**
 * Wire protocol for the local multiplayer scaffold. The server is plain JS
 * (server/room-server.mjs) but speaks exactly these shapes, so this file is the
 * single source of truth for both sides. Keep messages small and flat — they're
 * JSON over a WebSocket.
 *
 * Scope today: presence, dimension assignment, and puzzle-solve replication —
 * enough to prove two clients share one authoritative room. Mid-puzzle session
 * channels (laser colour, valves, mirrors, lever timing) are the next increment
 * (see docs/ARCHITECTURE.md → Multiplayer plan).
 */

/** The two playable roles, plus watchers beyond the second seat. */
export type Role = 'alpha' | 'beta' | 'spectator';

export interface PlayerInfo {
  id: string;
  name: string;
  role: Role;
}

// ── Client → Server ──────────────────────────────────────────────────────────

export interface JoinMsg {
  t: 'join';
  code: string;
  name: string;
}

export interface SolveMsg {
  t: 'solve';
  /** A PuzzleId (kept as string here so protocol has no game-type import). */
  id: string;
}

export type ClientMsg = JoinMsg | SolveMsg;

// ── Server → Client ──────────────────────────────────────────────────────────

export interface WelcomeMsg {
  t: 'welcome';
  you: PlayerInfo;
  code: string;
  players: PlayerInfo[];
  /** Puzzles already solved in this room, so a late joiner catches up. */
  solved: string[];
}

export interface PresenceMsg {
  t: 'presence';
  players: PlayerInfo[];
}

export interface SolvedMsg {
  t: 'solved';
  id: string;
}

export interface ErrorMsg {
  t: 'error';
  message: string;
}

export type ServerMsg = WelcomeMsg | PresenceMsg | SolvedMsg | ErrorMsg;
