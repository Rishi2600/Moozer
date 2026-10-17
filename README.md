# Moozer

Let the room pick the music. A host starts a space and plays it on a laptop, TV or speaker;
everyone else joins from their phone with a link or QR code, adds YouTube songs and upvotes
them. The song with the most votes plays next, and the queue updates live for everyone.

## Repository

| Path | What it is |
|---|---|
| `apps/web` | Next.js 16 app (pages, API routes, auth) |
| `apps/realtime` | Node WebSocket server for live votes and presence |
| `packages/protocol` | Realtime message types and connection tickets, shared by both apps |
| `packages/db` | Prisma 7 schema, migrations and the shared database client |

## Run it locally

Needs Node 20.19+ and Docker.

```bash
cp .env.example .env                       # one env file for every app
docker compose up -d                       # Postgres 17 on localhost:5433
npm install
npm run migrate --workspace=@moozer/db     # apply migrations, generate the client
npm run dev                                # web on http://localhost:3000 + realtime on :8080
```

`npm run verify` runs lint, typecheck and a production build across the workspace.
