import { RoomClient } from '@/net/RoomClient';
import { puzzleState, type PuzzleId } from '@/systems/puzzle/state';
import { DimensionId } from '@/types';
import type { PlayerInfo, Role } from './protocol';

/**
 * Multiplayer bootstrap for The Quantum Split, layered over the game the same
 * way the lobby overlay is (a separate <script> in quantum.html) so it needs no
 * edits to the game's own bootstrap. Active only with ?mp=1.
 *
 * It bridges the room server to the game through two existing seams:
 *   • the `window.__qs` dev bridge → apply the server-assigned dimension
 *   • the shared `puzzleState` singleton → replicate solves both ways
 * This is exactly the migration docs/ARCHITECTURE.md anticipated: solve() still
 * runs locally, but now it also travels to the room and back.
 */

interface QsBridge {
  activate?: (id: DimensionId) => void;
}

const params = new URLSearchParams(window.location.search);
if (params.get('mp') === '1') {
  const code = params.get('code') ?? 'SOLO';
  const name = params.get('name') ?? 'Player';
  const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const url = `${wsProto}://${window.location.host}/ws`;

  const panel = mountPanel(code);
  let applyingRemote = false;

  const client = new RoomClient(url, code, name, {
    onStatus: (status) => panel.setStatus(status),
    onWelcome: (you, players, solved) => {
      panel.setYou(you);
      panel.setPlayers(players);
      applyRole(you.role);
      // Catch up on anything already solved in the room.
      applyingRemote = true;
      for (const id of solved) puzzleState.solve(id as PuzzleId);
      applyingRemote = false;
    },
    onPresence: (players) => panel.setPlayers(players),
    onSolved: (id) => {
      applyingRemote = true;
      puzzleState.solve(id as PuzzleId);
      applyingRemote = false;
    },
  });

  // Local solves travel to the room (but not the ones we just applied FROM it).
  puzzleState.onSolved((id) => {
    if (!applyingRemote) client.solve(id);
  });

  client.connect();
  window.addEventListener('beforeunload', () => client.disconnect());
}

/** Apply the server-assigned dimension via the game's existing bridge. */
function applyRole(role: Role): void {
  const bridge = (window as unknown as { __qs?: QsBridge }).__qs;
  const dim = role === 'beta' ? DimensionId.Beta : role === 'alpha' ? DimensionId.Alpha : null;
  if (!dim) return; // spectators keep whatever view they loaded
  // The game may still be booting; retry until the bridge exists.
  if (bridge?.activate) bridge.activate(dim);
  else setTimeout(() => applyRole(role), 100);
}

// ── Presence panel (self-contained DOM) ──────────────────────────────────────

function mountPanel(code: string): {
  setStatus(s: 'connecting' | 'open' | 'closed'): void;
  setYou(you: PlayerInfo): void;
  setPlayers(players: PlayerInfo[]): void;
} {
  const style = document.createElement('style');
  style.textContent = `
    .qs-mp { position: fixed; top: 54px; left: 16px; z-index: 31;
      font: 12px/1.5 ui-monospace, monospace; color: #cfe0f2;
      background: rgba(8,12,18,0.78); border: 1px solid rgba(120,150,180,0.24);
      border-radius: 10px; padding: 10px 12px; min-width: 172px; }
    .qs-mp .hd { display: flex; align-items: center; gap: 7px; color: #9fb6cc;
      letter-spacing: .08em; text-transform: uppercase; font-size: 10px; margin-bottom: 7px; }
    .qs-mp .dot { width: 8px; height: 8px; border-radius: 50%; background: #f5a; transition: background .2s; }
    .qs-mp .dot.open { background: #4be08a; } .qs-mp .dot.closed { background: #ff6b6b; }
    .qs-mp .row { display: flex; justify-content: space-between; gap: 12px; }
    .qs-mp .role { font-weight: 700; }
    .qs-mp .role.alpha { color: #ff6ec7; } .qs-mp .role.beta { color: #46d4ff; }
    .qs-mp .role.spectator { color: #8aa; }
    .qs-mp .me { color: #fff; } .qs-mp .empty { color: #61758c; }
  `;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.className = 'qs-mp';
  el.innerHTML = `
    <div class="hd"><span class="dot"></span><span>Room ${code}</span></div>
    <div class="body"><div class="empty">connecting…</div></div>`;
  document.body.appendChild(el);

  const dot = el.querySelector('.dot') as HTMLElement;
  const body = el.querySelector('.body') as HTMLElement;
  let youId = '';

  function render(players: PlayerInfo[]): void {
    if (!players.length) {
      body.innerHTML = `<div class="empty">waiting for players…</div>`;
      return;
    }
    body.innerHTML = players
      .map((p) => {
        const me = p.id === youId ? ' me' : '';
        const label = p.id === youId ? `${p.name} (you)` : p.name;
        return `<div class="row"><span class="${me}">${label}</span><span class="role ${p.role}">${p.role}</span></div>`;
      })
      .join('');
  }

  return {
    setStatus: (s) => {
      dot.classList.toggle('open', s === 'open');
      dot.classList.toggle('closed', s === 'closed');
    },
    setYou: (you) => {
      youId = you.id;
    },
    setPlayers: render,
  };
}
