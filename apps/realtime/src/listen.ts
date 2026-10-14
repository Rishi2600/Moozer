import type { SpaceStatus } from "@moozer/protocol/messages";
import pg from "pg";

type Notice = { spaceId: string; slug?: string; status?: SpaceStatus };

// LISTEN on "space_changes" (sent by database triggers), reconnecting with
// back-off if the connection drops.
export function listenForChanges(connectionString: string, onChange: (notice: Notice) => void) {
  let delay = 1000;
  let stopped = false;
  let client: pg.Client | null = null;

  async function connect() {
    client = new pg.Client({ connectionString });
    client.on("notification", (msg) => {
      try {
        const notice = JSON.parse(msg.payload ?? "{}") as Notice;
        if (notice.spaceId) onChange(notice);
      } catch {
        console.error("realtime: unreadable notification", msg.payload);
      }
    });
    client.on("error", (err) => console.error("realtime: database connection error", err.message));
    client.on("end", () => {
      if (stopped) return;
      console.warn(`realtime: database connection closed, retrying in ${delay}ms`);
      setTimeout(connect, delay);
      delay = Math.min(delay * 2, 30_000);
    });
    try {
      await client.connect();
      await client.query("LISTEN space_changes");
      delay = 1000;
      console.log("realtime: listening for space changes");
    } catch (err) {
      console.error("realtime: couldn't listen for changes", (err as Error).message);
      client.end().catch(() => {}); // triggers the retry above
    }
  }

  void connect();
  return () => {
    stopped = true;
    return client?.end();
  };
}
