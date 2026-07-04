import './menu.css';
import { CATALOG, getGame, type GameCard, type GameId } from './catalog';
import {
  DIFFICULTY_TIMER,
  generateRoomCode,
  launchUrl,
  recallSettings,
  rememberSettings,
  type Difficulty,
  type DimensionChoice,
  type LobbySettings,
} from './settings';

/**
 * The Paradox Lab hub — the front door. Renders the game catalog as selectable
 * cards and a live lobby panel where the host sets up a room (code, timer,
 * difficulty, dimension, dev mode) and launches. All state is a single
 * LobbySettings object; the panel re-renders from it, and launching just
 * serialises it into the chosen game's URL (see settings.launchUrl).
 */

const app = document.getElementById('app');
if (!app) throw new Error('#app container not found');

const state: LobbySettings = recallSettings();
if (!state.roomCode) state.roomCode = generateRoomCode();

app.innerHTML = `
  <div class="wrap">
    <header class="masthead">
      <div class="brand">
        <span class="kicker">Paradox Lab</span>
        <h1>Escape Rooms</h1>
        <span class="sub">Pick a room, set up a session, and drop in.</span>
      </div>
      <div class="status">
        <div>${CATALOG.length} rooms online</div>
        <div>Networked play: <b>coming soon</b> · local session ready</div>
      </div>
    </header>

    <div class="layout">
      <section>
        <h2 class="section-label">Choose your room</h2>
        <div class="cards" id="cards"></div>
      </section>

      <aside class="lobby" id="lobby"></aside>
    </div>

    <footer class="footer">
      Rooms run in your browser. Room codes and multiplayer are stubbed locally today —
      when the co-op server ships, these same rooms become shared sessions.
      See <a href="https://threejs.org" target="_blank" rel="noreferrer">Three.js</a>-powered scenes under the hood.
    </footer>
  </div>
`;

const cardsEl = document.getElementById('cards') as HTMLDivElement;
const lobbyEl = document.getElementById('lobby') as HTMLElement;

// ---- Cards ------------------------------------------------------------------

function cardHtml(game: GameCard): string {
  const coopTag = game.coop ? '<span class="tag coop">CO-OP</span>' : '';
  return `
    <article class="card" data-game="${game.id}" role="button" tabindex="0"
      style="--from:${game.art.from};--to:${game.art.to};--card-accent:${game.art.accent};--card-accent2:${game.art.accent2 ?? game.art.accent}">
      <div class="check">✓</div>
      <div class="emblem">${game.art.emblem}</div>
      <div class="body">
        <h3>${game.title}</h3>
        <p class="tagline">${game.tagline}</p>
        <div class="tags">
          ${coopTag}
          <span class="tag">${game.players}</span>
          <span class="tag">${game.length}</span>
          <span class="tag">${game.vibe}</span>
        </div>
      </div>
    </article>`;
}

cardsEl.innerHTML = CATALOG.map(cardHtml).join('');

function selectGame(id: GameId): void {
  state.game = id;
  const game = getGame(id);
  // Reset dimension when leaving the co-op game so stale state can't launch.
  if (!game.coop) state.dimension = 'auto';
  for (const el of cardsEl.querySelectorAll<HTMLElement>('.card')) {
    el.classList.toggle('selected', el.dataset.game === id);
  }
  renderLobby();
}

for (const el of cardsEl.querySelectorAll<HTMLElement>('.card')) {
  const id = el.dataset.game as GameId;
  el.addEventListener('click', () => selectGame(id));
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectGame(id);
    }
  });
}

// ---- Lobby panel ------------------------------------------------------------

function segments(
  current: string,
  opts: ReadonlyArray<{ value: string; label: string }>,
  attr: string,
): string {
  return `<div class="segments">${opts
    .map(
      (o) =>
        `<button data-${attr}="${o.value}" class="${o.value === current ? 'on' : ''}">${o.label}</button>`,
    )
    .join('')}</div>`;
}

function timerLabel(minutes: number): string {
  return minutes === 0 ? 'Untimed' : `${minutes} min`;
}

function renderLobby(): void {
  const game = getGame(state.game);
  lobbyEl.className = `lobby${game.coop ? ' is-quantum' : ''}`;
  lobbyEl.style.setProperty('--from', game.art.from);
  lobbyEl.style.setProperty('--to', game.art.to);
  lobbyEl.style.setProperty('--card-accent', game.art.accent);
  lobbyEl.style.setProperty('--card-accent2', game.art.accent2 ?? game.art.accent);

  lobbyEl.innerHTML = `
    <div class="lobby-head">
      <div class="eyebrow">Create a room</div>
      <h2>${game.title}</h2>
      <p>${game.blurb}</p>
    </div>
    <div class="lobby-body">
      <div class="field">
        <label>Room code</label>
        <div class="roomcode">
          <div class="code" id="roomcode">${state.roomCode}</div>
          <button class="icon-btn" id="regen" title="New code">⟳</button>
          <button class="icon-btn" id="copy" title="Copy invite link">⧉</button>
        </div>
      </div>

      <div class="field">
        <label>Difficulty</label>
        ${segments(state.difficulty, [
          { value: 'casual', label: 'Casual' },
          { value: 'standard', label: 'Standard' },
          { value: 'expert', label: 'Expert' },
        ], 'diff')}
      </div>

      <div class="field">
        <label>Time limit</label>
        <div class="timer-row">
          <input type="range" id="timer" min="0" max="90" step="5" value="${state.timerMinutes}" />
          <span class="timer-val" id="timerval">${timerLabel(state.timerMinutes)}</span>
        </div>
      </div>

      <div class="field only-quantum">
        <label style="width:100%">Your dimension</label>
        ${segments(state.dimension, [
          { value: 'auto', label: 'Auto' },
          { value: 'alpha', label: 'Alpha' },
          { value: 'beta', label: 'Beta' },
        ], 'dim')}
      </div>

      <div class="toggle" id="hints">
        <div class="meta"><span class="t">Hints</span><span class="d">Nudges when a puzzle stalls</span></div>
        <div class="switch ${state.hints ? 'on' : ''}"></div>
      </div>

      <div class="toggle" id="dev">
        <div class="meta"><span class="t">Developer mode</span><span class="d">Debug HUD + scene inspector</span></div>
        <div class="switch ${state.dev ? 'on' : ''}"></div>
      </div>

      <button class="launch" id="launch">Create room &amp; enter →</button>
      <div class="hint-line">${
        game.coop
          ? 'Share the code with your partner — for now both players open the room on their own machine.'
          : 'Solo room — the code is yours to resume or share a run.'
      }</div>
    </div>
  `;

  wireLobby();
}

function wireLobby(): void {
  const game = getGame(state.game);

  lobbyEl.querySelector('#regen')?.addEventListener('click', () => {
    state.roomCode = generateRoomCode();
    const el = lobbyEl.querySelector('#roomcode');
    if (el) el.textContent = state.roomCode;
  });

  lobbyEl.querySelector('#copy')?.addEventListener('click', async () => {
    const url = new URL(launchUrl(state), window.location.href).toString();
    try {
      await navigator.clipboard.writeText(url);
      const btn = lobbyEl.querySelector('#copy');
      if (btn) {
        btn.textContent = '✓';
        setTimeout(() => (btn.textContent = '⧉'), 1200);
      }
    } catch {
      window.prompt('Copy invite link:', url);
    }
  });

  for (const btn of lobbyEl.querySelectorAll<HTMLElement>('[data-diff]')) {
    btn.addEventListener('click', () => {
      state.difficulty = btn.dataset.diff as Difficulty;
      // Difficulty resets the timer to its baseline (host can still slide it).
      state.timerMinutes = DIFFICULTY_TIMER[state.difficulty];
      renderLobby();
    });
  }

  for (const btn of lobbyEl.querySelectorAll<HTMLElement>('[data-dim]')) {
    btn.addEventListener('click', () => {
      state.dimension = btn.dataset.dim as DimensionChoice;
      renderLobby();
    });
  }

  const timer = lobbyEl.querySelector<HTMLInputElement>('#timer');
  const timerVal = lobbyEl.querySelector('#timerval');
  timer?.addEventListener('input', () => {
    state.timerMinutes = Number(timer.value);
    if (timerVal) timerVal.textContent = timerLabel(state.timerMinutes);
  });

  lobbyEl.querySelector('#hints')?.addEventListener('click', () => {
    state.hints = !state.hints;
    lobbyEl.querySelector('#hints .switch')?.classList.toggle('on', state.hints);
  });

  lobbyEl.querySelector('#dev')?.addEventListener('click', () => {
    state.dev = !state.dev;
    lobbyEl.querySelector('#dev .switch')?.classList.toggle('on', state.dev);
  });

  lobbyEl.querySelector('#launch')?.addEventListener('click', () => {
    if (!game.coop) state.dimension = 'auto';
    rememberSettings(state);
    window.location.href = launchUrl(state);
  });
}

selectGame(state.game);
