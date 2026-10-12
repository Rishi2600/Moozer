import { createServer } from "node:http";
import { WebSocketServer } from "ws";

const port = Number(process.env.REALTIME_PORT ?? 8080);

// Plain HTTP for health checks; WebSocket connections upgrade on the same port.
const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, connections: wss.clients.size }));
    return;
  }
  res.writeHead(404).end();
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
  socket.on("error", (err) => console.error("socket error", err));
});

server.listen(port, () => {
  console.log(`realtime listening on :${port}`);
});
