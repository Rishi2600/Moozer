import "server-only";

import { parseIsoDuration } from "./links";

export type SongDetails = {
  videoId: string;
  title: string;
  channel: string | null;
  thumbnailUrl: string;
  durationSeconds: number | null;
};

export type LookupResult =
  | { ok: true; song: SongDetails }
  | { ok: false; reason: "not-found" | "not-embeddable" | "unavailable" };

// 16:9 thumbnail (320x180); YouTube serves it for every video.
const thumbnail = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
const ONE_DAY = 60 * 60 * 24;

// With YOUTUBE_API_KEY: the Data API (adds duration and the embeddable flag).
// Without a key, or if the API fails: YouTube's public oEmbed endpoint.
export async function lookupYouTube(videoId: string): Promise<LookupResult> {
  const key = process.env.YOUTUBE_API_KEY;
  if (key) {
    const result = await fromDataApi(videoId, key).catch(() => null);
    if (result) return result;
  }
  return fromOEmbed(videoId).catch(() => ({ ok: false as const, reason: "unavailable" as const }));
}

async function fromDataApi(videoId: string, key: string): Promise<LookupResult | null> {
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.search = new URLSearchParams({ part: "snippet,contentDetails,status", id: videoId, key }).toString();
  const res = await fetch(url, { signal: AbortSignal.timeout(5000), next: { revalidate: ONE_DAY } });
  if (!res.ok) return null; // quota or key problem: let oEmbed try
  const data = (await res.json()) as {
    items?: {
      snippet: { title: string; channelTitle: string };
      contentDetails: { duration: string };
      status: { embeddable: boolean };
    }[];
  };
  const video = data.items?.[0];
  if (!video) return { ok: false, reason: "not-found" };
  if (!video.status.embeddable) return { ok: false, reason: "not-embeddable" };
  return {
    ok: true,
    song: {
      videoId,
      title: video.snippet.title,
      channel: video.snippet.channelTitle || null,
      thumbnailUrl: thumbnail(videoId),
      durationSeconds: parseIsoDuration(video.contentDetails.duration),
    },
  };
}

async function fromOEmbed(videoId: string): Promise<LookupResult> {
  const url = new URL("https://www.youtube.com/oembed");
  url.search = new URLSearchParams({ url: `https://www.youtube.com/watch?v=${videoId}`, format: "json" }).toString();
  const res = await fetch(url, { signal: AbortSignal.timeout(5000), next: { revalidate: ONE_DAY } });
  // oEmbed answers 401 for videos that can't be embedded and 404 for missing ones.
  if (res.status === 401 || res.status === 403) return { ok: false, reason: "not-embeddable" };
  if (res.status === 404 || res.status === 400) return { ok: false, reason: "not-found" };
  if (!res.ok) return { ok: false, reason: "unavailable" };
  const data = (await res.json()) as { title: string; author_name?: string };
  return {
    ok: true,
    song: { videoId, title: data.title, channel: data.author_name || null, thumbnailUrl: thumbnail(videoId), durationSeconds: null },
  };
}
