/**
 * The playable-game catalog — the single source of truth the landing page and
 * the lobby read from. Each entry describes one experience: what it is, how it
 * launches, and the art direction its card uses. Adding a game here makes it
 * appear on the menu; nothing else needs to change.
 *
 * `entry` is the HTML page that boots the game (see vite.config.ts inputs).
 * `launchParam`/`launchValue` is an extra query param appended at launch when a
 * single entry hosts more than one game (the two adventures share rooms.html).
 */

export type GameId = 'quantum' | 'pharaoh' | 'blackout';

export interface GameCard {
  id: GameId;
  title: string;
  /** One-line hook shown under the title. */
  tagline: string;
  /** Two or three sentences for the card body / lobby summary. */
  blurb: string;
  /** Player-count label, e.g. "2 players · co-op" or "1 player". */
  players: string;
  /** Whether this game is the networked cross-dimension co-op. */
  coop: boolean;
  /** Rough length label. */
  length: string;
  /** Difficulty baseline label. */
  vibe: string;
  /** HTML page that boots the game. */
  entry: string;
  /** Extra launch param when the entry hosts multiple games. */
  launchParam?: string;
  launchValue?: string;
  /** Card art: CSS gradient stops + an accent used across the card + emblem. */
  art: {
    from: string;
    to: string;
    accent: string;
    /** Second accent for the split card. */
    accent2?: string;
    emblem: string;
  };
}

export const CATALOG: readonly GameCard[] = [
  {
    id: 'quantum',
    title: 'The Quantum Split',
    tagline: 'One lab, two dimensions, two players who must talk each other out.',
    blurb:
      'A temporal experiment tears the lab into a parallel past and future. You and a partner are trapped one in each — the layout is identical, but you see completely different worlds. Describe what you see, and solve eight interlocking puzzles across the divide.',
    players: '2 players · asymmetric co-op',
    coop: true,
    length: '~45 min',
    vibe: 'Blind co-operation',
    entry: 'quantum.html',
    art: {
      from: '#160b2e',
      to: '#031420',
      accent: '#ff3fb0', // Alpha bioluminescence
      accent2: '#1fd1ff', // Beta holographics
      emblem: '⟠',
    },
  },
  {
    id: 'pharaoh',
    title: "The Pharaoh's Curse",
    tagline: 'Sealed in the tomb. Three chambers between you and the desert sky.',
    blurb:
      'Torch-lit sandstone, rotary glyph rings, a sarcophagus that does not want to open. A three-stage descent through antechamber, hall, and burial vault — carry the right relics forward or the tomb keeps you.',
    players: '1 player',
    coop: false,
    length: '~1 hour · 3 stages',
    vibe: 'Classic escape',
    entry: 'rooms.html',
    launchParam: 'adventure',
    launchValue: 'pharaoh',
    art: {
      from: '#2c1c07',
      to: '#120a02',
      accent: '#ffb063',
      emblem: '𓂀',
    },
  },
  {
    id: 'blackout',
    title: 'Operation Blackout',
    tagline: 'Bureau 13 is compromised. Crack the vault before the sweep finds you.',
    blurb:
      'A cold-war field office: evidence strung across a corkboard, a frozen clock, a keypad, a laser corridor, and a vault wheel. Three stages of tradecraft — read the room, disarm the tripwires, get out clean.',
    players: '1 player',
    coop: false,
    length: '~1 hour · 3 stages',
    vibe: 'Spy thriller',
    entry: 'rooms.html',
    launchParam: 'adventure',
    launchValue: 'blackout',
    art: {
      from: '#0c1620',
      to: '#04080d',
      accent: '#4aa8ff',
      accent2: '#ff4a4a', // vault danger wash
      emblem: '⌖',
    },
  },
];

export function getGame(id: GameId): GameCard {
  const game = CATALOG.find((g) => g.id === id);
  if (!game) throw new Error(`Unknown game id: ${id}`);
  return game;
}
