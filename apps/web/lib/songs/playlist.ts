// "Open as YouTube playlist": YouTube turns a list of video ids into a
// temporary playlist (which you can then save to your account). The link
// isn't documented by YouTube and takes at most 50 videos, so long lists are
// split into parts, and a plain song list is offered as a fallback.
export const PLAYLIST_MAX = 50;

export function youtubePlaylistLinks(videoIds: string[]) {
  const unique = [...new Set(videoIds)];
  const links: string[] = [];
  for (let i = 0; i < unique.length; i += PLAYLIST_MAX) {
    links.push(`https://www.youtube.com/watch_videos?video_ids=${unique.slice(i, i + PLAYLIST_MAX).join(",")}`);
  }
  return links;
}

// One "title: link" line per song, for pasting anywhere.
export function songListText(songs: { title: string; videoId: string }[]) {
  return songs.map((song) => `${song.title}: https://youtu.be/${song.videoId}`).join("\n");
}
