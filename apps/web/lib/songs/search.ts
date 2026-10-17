import "server-only";

import { parseIsoDuration } from "./links";
import type { SongDetails } from "./lookup";
import { cleanQuery, dailyBudget, SEARCH_CACHE_MS, SEARCH_RESULTS } from "./search-rules";

type Cached = { at: number; songs: SongDetails[] };
const cache = new Map<string, Cached>(); // this server's memory, like the other limits
const budget = dailyBudget();

export type SearchResult = { ok: true; songs: SongDetails[] } | { ok: false; reason: "too-short" | "resting" | "unavailable" | "no-key" };

// Songs on YouTube for some words: embeddable videos filed under Music, with
// SafeSearch on. One search (100 units) plus one details call (1 unit) for
// clean titles and lengths. The same words within a day come from the cache.
export async function searchYouTube(input: unknown, now = Date.now()): Promise<SearchResult> {
  const query = cleanQuery(input);
  if (!query) return { ok: false, reason: "too-short" };
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return { ok: false, reason: "no-key" };
  const hit = cache.get(query.key);
  if (hit && now - hit.at < SEARCH_CACHE_MS) return { ok: true, songs: hit.songs };
  if (!budget.take(now)) return { ok: false, reason: "resting" };

  try {
    const search = new URL("https://www.googleapis.com/youtube/v3/search");
    search.search = new URLSearchParams({
      part: "snippet",
      q: query.text,
      type: "video",
      videoEmbeddable: "true",
      videoCategoryId: "10", // Music
      safeSearch: "moderate",
      maxResults: String(SEARCH_RESULTS),
      key,
    }).toString();
    const found = await fetch(search, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!found.ok) return { ok: false, reason: "unavailable" };
    const ids = ((await found.json()) as { items?: { id?: { videoId?: string } }[] }).items?.flatMap((item) => (item.id?.videoId ? [item.id.videoId] : [])) ?? [];
    const songs = ids.length ? await details(ids, key) : [];
    if (!songs) return { ok: false, reason: "unavailable" };
    cache.set(query.key, { at: now, songs });
    if (cache.size > 500) cache.delete(cache.keys().next().value!); // forget the oldest
    return { ok: true, songs };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

// Titles, channels and lengths for the found videos, in search order.
async function details(ids: string[], key: string): Promise<SongDetails[] | null> {
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.search = new URLSearchParams({ part: "snippet,contentDetails", id: ids.join(","), key }).toString();
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6000) });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    items?: { id: string; snippet: { title: string; channelTitle: string }; contentDetails: { duration: string } }[];
  };
  const byId = new Map(data.items?.map((item) => [item.id, item]));
  return ids.flatMap((id) => {
    const video = byId.get(id);
    if (!video) return [];
    return [
      {
        videoId: id,
        title: video.snippet.title,
        channel: video.snippet.channelTitle || null,
        thumbnailUrl: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        durationSeconds: parseIsoDuration(video.contentDetails.duration),
      },
    ];
  });
}
