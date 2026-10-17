import { describe, expect, it } from "vitest";

import { songListText, youtubePlaylistLinks } from "./playlist";

describe("YouTube playlist links", () => {
  it("list the videos in order, once each", () => {
    expect(youtubePlaylistLinks(["aaaaaaaaaaa", "bbbbbbbbbbb", "aaaaaaaaaaa"])).toEqual([
      "https://www.youtube.com/watch_videos?video_ids=aaaaaaaaaaa,bbbbbbbbbbb",
    ]);
  });

  it("split into parts of 50", () => {
    const ids = Array.from({ length: 120 }, (_, i) => `v${String(i).padStart(10, "0")}`);
    const links = youtubePlaylistLinks(ids);
    expect(links).toHaveLength(3);
    expect(links[0].split(",")).toHaveLength(50);
    expect(links[2].split(",")).toHaveLength(20);
  });

  it("are empty for nothing played", () => {
    expect(youtubePlaylistLinks([])).toEqual([]);
  });
});

describe("the song list", () => {
  it("has a title and a short link per line", () => {
    expect(songListText([{ title: "Despacito", videoId: "kJQP7kiw5Fk" }, { title: "Golden Hour", videoId: "PEM0Vs8jf1w" }])).toBe(
      "Despacito: https://youtu.be/kJQP7kiw5Fk\nGolden Hour: https://youtu.be/PEM0Vs8jf1w"
    );
  });
});
