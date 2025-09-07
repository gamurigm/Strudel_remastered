#!/usr/bin/env node
// Simple WebSocket relay server for Strudel multi-channel collaboration
// Not for production use – no auth, minimal state. Run with: pnpm --filter @strudel/website mp-server
import { WebSocketServer } from 'ws';
import http from 'http';

const PORT = process.env.STRUDEL_MP_PORT || 32123;

const server = http.createServer();
const wss = new WebSocketServer({ server });

// roomId => Set<ws>
const rooms = new Map();

function joinRoom(ws, room) {
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room).add(ws);
  ws._room = room;
}

function leaveRoom(ws) {
  const room = ws._room;
  if (!room) return;
  const set = rooms.get(room);
  if (set) {
    set.delete(ws);
    if (!set.size) rooms.delete(room);
  }
}

function broadcast(room, msg, except) {
  const set = rooms.get(room);
  if (!set) return;
  for (const client of set) {
    if (client !== except && client.readyState === 1) {
      client.send(JSON.stringify(msg));
    }
  }
}

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    if (msg.type === 'join') {
      leaveRoom(ws);
      joinRoom(ws, msg.room || 'default');
      ws.send(JSON.stringify({ type: 'joined', room: ws._room }));
      return;
    }
    if (!ws._room) return;

    switch (msg.type) {
      case 'code-update':
        // { channelId, code, ts }
        broadcast(ws._room, { type: 'code-update', ...msg }, ws);
        break;
      case 'channel-meta':
        broadcast(ws._room, { type: 'channel-meta', ...msg }, ws);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', t: Date.now() }));
        break;
    }
  });
  ws.on('close', () => leaveRoom(ws));
});

server.listen(PORT, () => {
  console.log(`[strudel-mp] WebSocket server listening on :${PORT}`);
});
