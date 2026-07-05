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

export type GameId =
  | 'quantum'
  | 'pharaoh'
  | 'blackout'
  | 'manor'
  | 'leviathan'
  | 'galleon'
  | 'frost'
  | 'vault'
  | 'relay';

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
  {
    id: 'manor',
    title: 'The Hollow Manor',
    tagline: 'The house is dead, but it is not empty. Three rooms until the night air.',
    blurb:
      'A gothic manor swallows you room by room: a drawing room ruled by a stopped grandfather clock, a library with a bookcase that is also a door, and a séance chamber where the board must be told what haunts the halls. Wind the clock, play the organ, and name the thing in the dark.',
    players: '1 player',
    coop: false,
    length: '~1 hour · 3 stages',
    vibe: 'Gothic horror',
    entry: 'rooms.html',
    launchParam: 'adventure',
    launchValue: 'manor',
    art: {
      from: '#241830',
      to: '#0c0812',
      accent: '#a06bff',
      accent2: '#ff8a3a', // candle-flame warmth
      emblem: '🕯',
    },
  },
  {
    id: 'leviathan',
    title: 'The Brass Leviathan',
    tagline: 'The airship is falling. Three decks of brass and steam to save her.',
    blurb:
      'A steampunk dirigible loses altitude with you aboard. Balance the boiler’s pressure gauges on the boiler deck, tap out a distress call on the telegraph, then mesh the bridge’s cog train and throw the ascent lever before the Leviathan meets the ground.',
    players: '1 player',
    coop: false,
    length: '~1 hour · 3 stages',
    vibe: 'Steampunk',
    entry: 'rooms.html',
    launchParam: 'adventure',
    launchValue: 'leviathan',
    art: {
      from: '#2a1e0c',
      to: '#0e0a04',
      accent: '#e0a838', // brass
      accent2: '#5fe6c8', // verdigris
      emblem: '⚙',
    },
  },
  {
    id: 'galleon',
    title: 'The Drowned Galleon',
    tagline: 'She’s taking on water and the fog is closing. Steer, pump, and signal.',
    blurb:
      'A foundering galleon in a dead calm. Steer the helm to the logged heading, work the bilge-pump faders to drain the flooded hold, then set the astrolabe to your star fix and fire a flare before the sea takes her.',
    players: '1 player',
    coop: false,
    length: '~1 hour · 3 stages',
    vibe: 'Nautical',
    entry: 'rooms.html',
    launchParam: 'adventure',
    launchValue: 'galleon',
    art: {
      from: '#0c2830',
      to: '#041014',
      accent: '#39f0a0', // phosphor sea-green
      accent2: '#6fd8d0',
      emblem: '⚓',
    },
  },
  {
    id: 'frost',
    title: 'The Frost Station',
    tagline: 'The polar base went dark. Restore power, run the lab, and signal rescue.',
    blurb:
      'An abandoned research station buried in the ice. Cold-start the generator in the right order, weigh an ice core against the correct standard in the lab, then dial the observatory dome to the rescue azimuth and open it to the aurora.',
    players: '1 player',
    coop: false,
    length: '~1 hour · 3 stages',
    vibe: 'Winter survival',
    entry: 'rooms.html',
    launchParam: 'adventure',
    launchValue: 'frost',
    art: {
      from: '#16303e',
      to: '#060e16',
      accent: '#66d9ff', // glacial blue
      accent2: '#eaf6ff',
      emblem: '❄',
    },
  },
  {
    id: 'vault',
    title: 'The Cipher Vault',
    tagline: 'Three interlocking mechanisms stand between you and the door.',
    blurb:
      'A high-security vault of pure machinery. Decode the cipher wheel to arm a powered panel, rotate a pipe grid to route real flow to the sluice, then solve a sliding-tile tumbler lock. Each door needs several things true at once — in any order.',
    players: '1 player',
    coop: false,
    length: '~1 hour · 3 stages',
    vibe: 'Logic / mechanisms',
    entry: 'rooms.html',
    launchParam: 'adventure',
    launchValue: 'vault',
    art: {
      from: '#141a24',
      to: '#05070b',
      accent: '#1fd1ff',
      accent2: '#2bff88',
      emblem: '🔐',
    },
  },
  {
    id: 'relay',
    title: 'The Relay Station',
    tagline: 'Every run rolls a new code. Boot the panel, route the beam, light the array.',
    blurb:
      'A remote signal relay you must bring back online — and its puzzles are generated fresh from your room code, so no two rooms are the same. Key the seed-derived access code, route the laser to its sensor with rotating mirrors, then solve the lights-out signal array and send the call.',
    players: '1 player',
    coop: false,
    length: '~1 hour · 3 stages · replayable',
    vibe: 'Sci-fi / procedural',
    entry: 'rooms.html',
    launchParam: 'adventure',
    launchValue: 'relay',
    art: {
      from: '#0a1626',
      to: '#04070d',
      accent: '#1fd1ff',
      accent2: '#e344c4',
      emblem: '📡',
    },
  },
];

export function getGame(id: GameId): GameCard {
  const game = CATALOG.find((g) => g.id === id);
  if (!game) throw new Error(`Unknown game id: ${id}`);
  return game;
}
