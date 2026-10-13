export type SongLink =
  | { kind: "youtube"; videoId: string }
  | { kind: "spotify" } // recognised, playback comes later
  | { kind: "unsupported" };

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"]);

// What someone pasted into "Add a song". Returns null for empty input.
export function parseSongLink(input: string): SongLink | null {
  const value = input.trim();
  if (!value) return null;
  if (/^spotify:/i.test(value)) return { kind: "spotify" };

  let url: URL;
  try {
    url = new URL(/^[a-z]+:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return { kind: "unsupported" };
  }
  const host = url.hostname.toLowerCase();

  if (host === "open.spotify.com" || host === "spotify.link") return { kind: "spotify" };

  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    const [, first, second] = url.pathname.split("/");
    if (first === "watch") id = url.searchParams.get("v");
    else if (["shorts", "embed", "live", "v"].includes(first)) id = second ?? null;
  }
  return id && VIDEO_ID.test(id) ? { kind: "youtube", videoId: id } : { kind: "unsupported" };
}

// YouTube's ISO 8601 durations: "PT3M39S" -> 219, "PT1H2M5S" -> 3725.
export function parseIsoDuration(iso: string) {
  const match = iso.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!match) return null;
  const [, d, h, m, s] = match.map((part) => Number(part ?? 0));
  return d * 86400 + h * 3600 + m * 60 + s;
}

// 219 -> "3:39", 3725 -> "1:02:05"
export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = String(s % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}
