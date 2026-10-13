import { createServer } from "node:http";

import { CLOSE, type ServerMessage } from "@moozer/protocol/messages";
import { verifyTicket } from "@moozer/protocol/ticket";
import { WebSocketServer, type WebSocket } from "ws";

import { listenForChanges } from "./listen";
import { Rooms, type Member } from "./rooms";

const port = Number(process.env.REALTIME_PORT ?? 8080);
const secret = process.env.REALTIME_SECRET;
const databaseUrl = process.env.DATABASE_URL;
// Only pages from the website may connect.
const allowedOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(",").map((o) => o.trim());
if (!secret || secret.length < 32) throw new Error("REALTIME_SECRET must be set (32+ characters). See .env.example.");
if (!databaseUrl) throw new Error("DATABASE_URL is not set. See .env.example.");

const rooms = new Rooms();

// Plain HTTP for health checks; WebSocket connections upgrade on the same port.
const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, ...rooms.stats() }));
    return;
  }
  res.writeHead(404).end();
});

const wss = new WebSocketServer({ noServer: true });
const alive = new WeakSet<WebSocket>();

server.on("upgrade", (req, socket, head) => {
  if (!allowedOrigins.includes(req.headers.origin ?? "")) {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    const token = new URL(req.url ?? "/", "http://realtime").searchParams.get("ticket") ?? "";
    const ticket = verifyTicket(token, secret);
    if (!ticket) {
      ws.close(CLOSE.badTicket, "ticket expired or invalid");
      return;
    }
    const member: Member = {
      userId: ticket.userId,
      name: ticket.name,
      send: (message: ServerMessage) => ws.readyState === ws.OPEN && ws.send(JSON.stringify(message)),
    };
    alive.add(ws);
    ws.on("pong", () => alive.add(ws));
    ws.on("error", (err) => console.error("realtime: socket error", err.message));
    ws.on("close", () => rooms.leave(ticket.spaceId, member));
    rooms.join(ticket.spaceId, member);
  });
});

// Drop connections that stop answering, so "N here" stays honest.
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!alive.has(ws)) {
      ws.terminate();
      continue;
    }
    alive.delete(ws);
    ws.ping();
  }
}, 30_000);

const stopListening = listenForChanges(databaseUrl, ({ spaceId, slug, status }) => rooms.changed(spaceId, { slug, status }));

server.listen(port, () => console.log(`realtime: listening on :${port}`));

// On shutdown, close every connection with 1012 ("service restart") so
// browsers reconnect at once; wss.close() alone leaves open sockets running.
function shutdown() {
  clearInterval(heartbeat);
  void stopListening();
  for (const ws of wss.clients) ws.close(1012, "restarting");
  wss.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
