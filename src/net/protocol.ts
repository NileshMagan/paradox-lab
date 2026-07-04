/**
 * Wire protocol for the local multiplayer scaffold. The server is plain JS
 * (server/room-server.mjs) but speaks exactly these shapes, so this file is the
 * single source of truth for both sides. Keep messages small and flat — they're
 * JSON over a WebSocket.
 *
 * Scope: presence, dimension assignment, puzzle-solve replication, and the
 * continuous mid-puzzle session channels (laser colour, bloom zone, valves,
 * mirrors). Lever timing stays local for now — a simultaneous cross-machine
 * pull needs server-authoritative clocks (see docs/ARCHITECTURE.md).
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

/**
 * The replicated continuous session state — the mid-puzzle channels both
 * dimensions read every frame. A message may carry any subset (a patch); the
 * server merges it. Strings/numbers only so it stays trivially JSON-mergeable.
 */
export interface SessionState {
  /** Colour Beta's laser grid emits; Alpha's flora mirrors it. */
  laserColor?: string;
  /** Maze zones Beta has crossed. */
  bloomZone?: number;
  /** Coolant valves Alpha has opened. */
  valvesOpen?: number;
  /** Indices of Alpha's mirrors currently aligned. */
  mirrors?: number[];
}

export interface SessionMsg {
  t: 'session';
  patch: SessionState;
}

export type ClientMsg = JoinMsg | SolveMsg | SessionMsg;

// ── Server → Client ──────────────────────────────────────────────────────────

export interface WelcomeMsg {
  t: 'welcome';
  you: PlayerInfo;
  code: string;
  players: PlayerInfo[];
  /** Puzzles already solved in this room, so a late joiner catches up. */
  solved: string[];
  /** Current session channels, so a late joiner sees mid-puzzle state. */
  session: SessionState;
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

export type ServerMsg = WelcomeMsg | PresenceMsg | SolvedMsg | SessionMsg | ErrorMsg;
