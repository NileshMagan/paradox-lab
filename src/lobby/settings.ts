import type { GameId } from './catalog';
import { getGame } from './catalog';

/**
 * Lobby settings — the room configuration a host picks before launching, and
 * the contract each game entry reads on boot. Today it all travels in the URL
 * (and is remembered in localStorage between visits); when the multiplayer
 * server lands, `roomCode` becomes a real server room and these same fields
 * become its authoritative config. Nothing else about the shape needs to
 * change — that's the point of routing everything through here.
 */

export type Difficulty = 'casual' | 'standard' | 'expert';
export type DimensionChoice = 'auto' | 'alpha' | 'beta';

export interface LobbySettings {
  game: GameId;
  /** Shareable room code — client-generated today, server-issued later. */
  roomCode: string;
  /** Display name sent to the multiplayer room server. */
  playerName: string;
  /** Countdown length in minutes; 0 = untimed (no clock). */
  timerMinutes: number;
  difficulty: Difficulty;
  hints: boolean;
  /** Which dimension the host plays — only meaningful for the co-op game. */
  dimension: DimensionChoice;
  /** Networked co-op via the local room server (co-op game only). */
  mp: boolean;
  /** Optional WebSocket server override for static/hosted multiplayer. */
  wsUrl: string;
  /** Developer mode: re-enables debug HUD / bridges in the games. */
  dev: boolean;
}

/** Timer defaults per difficulty (minutes). 0 stays 0 (host chose untimed). */
export const DIFFICULTY_TIMER: Record<Difficulty, number> = {
  casual: 75,
  standard: 60,
  expert: 45,
};

export const DEFAULT_SETTINGS: LobbySettings = {
  game: 'quantum',
  roomCode: '',
  playerName: '',
  timerMinutes: DIFFICULTY_TIMER.standard,
  difficulty: 'standard',
  hints: true,
  dimension: 'auto',
  mp: false,
  wsUrl: '',
  dev: false,
};

/** Unambiguous alphabet (no O/0, I/1) for human-readable room codes. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    if (i === 2) code += '-';
  }
  return code;
}

const STORAGE_KEY = 'quantum-split:lobby';

/** Persist the host's last choices so the lobby reopens where they left off. */
export function rememberSettings(settings: LobbySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private mode / storage disabled — non-fatal, we just don't persist.
  }
}

export function recallSettings(): LobbySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<LobbySettings>) };
  } catch {
    // Corrupt / unavailable — fall through to defaults.
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Serialize settings into the query string the game entry launches with.
 * We intentionally emit the game's own long-standing params (`?dim=`) too, so
 * the existing game bootstrap keeps working unchanged.
 */
interface LaunchParamOptions {
  /** Invite links should not force the recipient to inherit the host's name. */
  includePlayerName?: boolean;
}

export function toLaunchParams(
  settings: LobbySettings,
  options: LaunchParamOptions = {},
): URLSearchParams {
  const params = new URLSearchParams();
  // `code` = the shareable room code. Distinct from the Quantum game's own
  // `?room=1..3` dev deep-link (room number), so the two never collide.
  params.set('code', settings.roomCode);
  params.set('timer', String(settings.timerMinutes));
  params.set('difficulty', settings.difficulty);
  params.set('hints', settings.hints ? '1' : '0');
  const playerName = settings.playerName.trim();
  if (playerName && options.includePlayerName !== false) params.set('name', playerName);
  if (settings.dev) params.set('dev', '1');
  if (settings.game === 'quantum' && settings.dimension !== 'auto') {
    params.set('dim', settings.dimension);
  }
  if (settings.game === 'quantum' && settings.mp) {
    params.set('mp', '1');
    const wsUrl = settings.wsUrl.trim();
    if (wsUrl) params.set('ws', wsUrl);
  }
  const game = getGame(settings.game);
  if (game.launchParam && game.launchValue) {
    params.set(game.launchParam, game.launchValue);
  }
  return params;
}

/** Build the full launch URL for the chosen game. */
export function launchUrl(settings: LobbySettings): string {
  const game = getGame(settings.game);
  return `${game.entry}?${toLaunchParams(settings).toString()}`;
}

/** Shareable join URL for another player. Keeps room/server settings, omits name. */
export function inviteUrl(settings: LobbySettings): string {
  const game = getGame(settings.game);
  return `${game.entry}?${toLaunchParams(settings, { includePlayerName: false }).toString()}`;
}

const LAUNCH_KEY = 'quantum-split:lastLaunch';

export interface LastLaunch {
  game: GameId;
  roomCode: string;
  url: string;
  at: number;
}

/** Record the most recent launch so the hub can offer a one-click resume. */
export function rememberLaunch(settings: LobbySettings): void {
  try {
    const record: LastLaunch = {
      game: settings.game,
      roomCode: settings.roomCode,
      url: launchUrl(settings),
      at: Date.now(),
    };
    localStorage.setItem(LAUNCH_KEY, JSON.stringify(record));
  } catch {
    // Non-fatal — resume is a convenience, not required.
  }
}

export function recallLaunch(): LastLaunch | null {
  try {
    const raw = localStorage.getItem(LAUNCH_KEY);
    if (raw) return JSON.parse(raw) as LastLaunch;
  } catch {
    // Ignore corrupt records.
  }
  return null;
}

/**
 * Read whatever launch params a game entry was opened with. Missing values
 * fall back to defaults so a game opened directly (no lobby) still runs.
 */
export function readLaunchParams(search: string = window.location.search): {
  roomCode: string;
  timerMinutes: number;
  difficulty: Difficulty;
  hints: boolean;
  dev: boolean;
} {
  const p = new URLSearchParams(search);
  const timer = Number(p.get('timer'));
  const difficulty = p.get('difficulty');
  return {
    roomCode: p.get('code') ?? '',
    timerMinutes: Number.isFinite(timer) && timer >= 0 ? timer : 0,
    difficulty:
      difficulty === 'casual' || difficulty === 'standard' || difficulty === 'expert'
        ? difficulty
        : 'standard',
    hints: p.get('hints') !== '0',
    dev: p.get('dev') === '1',
  };
}
