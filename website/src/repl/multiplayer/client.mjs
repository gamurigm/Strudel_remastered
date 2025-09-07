// Lightweight multiplayer client for Strudel multi-channel REPL
// Provides pub/sub for code updates per local session (channel)

const DEFAULT_URL = (typeof window !== 'undefined' && (window.STRUDEL_MP_URL || `ws://${location.hostname}:32123`));

export class StrudelMPClient {
  constructor({ url = DEFAULT_URL, room = 'default', throttleMs = 400 } = {}) {
    this.url = url;
    this.room = room;
    this.throttleMs = throttleMs;
    this.ws = null;
    this.listeners = new Set();
    this.queue = [];
    this._lastSend = 0;
    this._connect();
  }
  _connect() {
    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      console.warn('[mp] websocket failed', e);
      return;
    }
    this.ws.addEventListener('open', () => {
      this._sendRaw({ type: 'join', room: this.room });
    });
    this.ws.addEventListener('message', (ev) => {
      let msg; try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.type === 'code-update' || msg.type === 'channel-meta') {
        this.listeners.forEach((fn) => fn(msg));
      }
    });
    this.ws.addEventListener('close', () => {
      setTimeout(() => this._connect(), 1500);
    });
  }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  _sendRaw(obj) {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(obj));
    }
  }
  sendCode(channelId, code) {
    const now = Date.now();
    if (now - this._lastSend < this.throttleMs) {
      this.queue = [{ channelId, code, ts: now }];
      if (!this._flushHandle) this._flushHandle = setTimeout(() => this._flush(), this.throttleMs);
      return;
    }
    this._lastSend = now;
    this._sendRaw({ type: 'code-update', channelId, code, ts: now });
  }
  _flush() {
    if (this.queue.length) {
      const { channelId, code, ts } = this.queue.pop();
      this._sendRaw({ type: 'code-update', channelId, code, ts });
      this.queue = [];
      this._lastSend = Date.now();
    }
    clearTimeout(this._flushHandle); this._flushHandle = null;
  }
}
