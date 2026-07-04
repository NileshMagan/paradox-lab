import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';

/**
 * Local multiplayer room server — the authoritative stand-in described in
 * docs/ARCHITECTURE.md, scaffolded so `npm run dev` gets real shared rooms.
 *
 * Authority today: it owns each room's roster (who holds which dimension) and
 * the set of solved puzzles, and broadcasts changes. It does NOT yet validate
 * the dependency graph (clients do that locally) or replicate mid-puzzle
 * session channels — those are the next increments. Deliberately dependency-
 * light (only `ws`) and stateless across restarts; production hosting is a
 * separate decision (Pages can't run this).
 *
 * Protocol mirrors src/net/protocol.ts exactly.
 */

const PORT = Number(process.env.MP_PORT ?? 8787);

/** code -> { players: Map<ws, PlayerInfo>, solved: Set<string>, session: object } */
const rooms = new Map();

function roomFor(code) {
  let room = rooms.get(code);
  if (!room) {
    room = { players: new Map(), solved: new Set(), session: {} };
    rooms.set(code, room);
  }
  return room;
}

/** First seat is alpha, second is beta, everyone after watches. */
function assignRole(room) {
  const taken = new Set([...room.players.values()].map((p) => p.role));
  if (!taken.has('alpha')) return 'alpha';
  if (!taken.has('beta')) return 'beta';
  return 'spectator';
}

function roster(room) {
  return [...room.players.values()];
}

function send(ws, msg) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(room, msg, except) {
  for (const ws of room.players.keys()) {
    if (ws !== except) send(ws, msg);
  }
}

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  let joinedCode = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return send(ws, { t: 'error', message: 'malformed message' });
    }

    if (msg.t === 'join') {
      const code = String(msg.code || '').trim();
      if (!code) return send(ws, { t: 'error', message: 'missing room code' });
      const room = roomFor(code);
      const info = {
        id: randomUUID().slice(0, 8),
        name: String(msg.name || 'Player').slice(0, 24),
        role: assignRole(room),
      };
      room.players.set(ws, info);
      joinedCode = code;
      send(ws, {
        t: 'welcome',
        you: info,
        code,
        players: roster(room),
        solved: [...room.solved],
        session: room.session,
      });
      broadcast(room, { t: 'presence', players: roster(room) }, ws);
      console.log(`[room ${code}] ${info.name} joined as ${info.role} (${room.players.size} in room)`);
      return;
    }

    if (msg.t === 'solve') {
      if (!joinedCode) return;
      const room = rooms.get(joinedCode);
      if (!room) return;
      const id = String(msg.id || '');
      if (!id || room.solved.has(id)) return;
      room.solved.add(id);
      broadcast(room, { t: 'solved', id }); // to everyone, sender included (idempotent)
      console.log(`[room ${joinedCode}] solved ${id} (${room.solved.size} total)`);
      return;
    }

    if (msg.t === 'session') {
      if (!joinedCode) return;
      const room = rooms.get(joinedCode);
      if (!room || !msg.patch || typeof msg.patch !== 'object') return;
      Object.assign(room.session, msg.patch); // last-writer-wins merge
      broadcast(room, { t: 'session', patch: msg.patch }, ws); // to others only
      return;
    }
  });

  ws.on('close', () => {
    if (!joinedCode) return;
    const room = rooms.get(joinedCode);
    if (!room) return;
    const info = room.players.get(ws);
    room.players.delete(ws);
    if (room.players.size === 0) {
      rooms.delete(joinedCode);
      console.log(`[room ${joinedCode}] empty — closed`);
    } else {
      broadcast(room, { t: 'presence', players: roster(room) });
      console.log(`[room ${joinedCode}] ${info?.name ?? 'someone'} left (${room.players.size} remain)`);
    }
  });
});

console.log(`Paradox Lab multiplayer server listening on ws://localhost:${PORT}`);
