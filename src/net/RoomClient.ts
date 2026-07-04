import type { ClientMsg, PlayerInfo, ServerMsg } from './protocol';

/**
 * Browser-side room connection. A thin, typed wrapper over a WebSocket that
 * speaks src/net/protocol.ts: join a room, learn your role, hear presence, and
 * relay puzzle solves. It holds no game logic — callers wire its events to the
 * game (see src/net/netBoot.ts). Auto-reconnects with backoff so a dev-server
 * restart doesn't kill the session.
 */

export interface RoomClientEvents {
  onWelcome(you: PlayerInfo, players: PlayerInfo[], solved: string[]): void;
  onPresence(players: PlayerInfo[]): void;
  onSolved(id: string): void;
  onStatus(status: 'connecting' | 'open' | 'closed'): void;
}

export class RoomClient {
  private ws: WebSocket | null = null;
  private reconnectDelay = 500;
  private closedByUs = false;

  constructor(
    private readonly url: string,
    private readonly code: string,
    private readonly name: string,
    private readonly events: Partial<RoomClientEvents> = {},
  ) {}

  connect(): void {
    this.closedByUs = false;
    this.events.onStatus?.('connecting');
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.addEventListener('open', () => {
      this.reconnectDelay = 500;
      this.events.onStatus?.('open');
      this.send({ t: 'join', code: this.code, name: this.name });
    });

    ws.addEventListener('message', (ev) => {
      let msg: ServerMsg;
      try {
        msg = JSON.parse(ev.data as string) as ServerMsg;
      } catch {
        return;
      }
      switch (msg.t) {
        case 'welcome':
          this.events.onWelcome?.(msg.you, msg.players, msg.solved);
          break;
        case 'presence':
          this.events.onPresence?.(msg.players);
          break;
        case 'solved':
          this.events.onSolved?.(msg.id);
          break;
        case 'error':
          console.warn('[room] server error:', msg.message);
          break;
      }
    });

    ws.addEventListener('close', () => {
      this.events.onStatus?.('closed');
      if (this.closedByUs) return;
      // Reconnect with capped backoff.
      setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 8000);
    });
  }

  /** Tell the room a puzzle solved locally. */
  solve(id: string): void {
    this.send({ t: 'solve', id });
  }

  disconnect(): void {
    this.closedByUs = true;
    this.ws?.close();
  }

  private send(msg: ClientMsg): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }
}
