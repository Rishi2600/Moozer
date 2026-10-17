import { describe, expect, it } from "vitest";

import { formatDuration, looksLikeLink, parseIsoDuration, parseSongLink } from "./links";

const yt = (videoId: string) => ({ kind: "youtube", videoId });

describe("parseSongLink", () => {
  it("reads every common YouTube link shape", () => {
    expect(parseSongLink("https://www.youtube.com/watch?v=O4irXQhgMqg")).toEqual(yt("O4irXQhgMqg"));
    expect(parseSongLink("https://youtube.com/watch?v=O4irXQhgMqg&list=RD123&t=42s")).toEqual(yt("O4irXQhgMqg"));
    expect(parseSongLink("https://youtu.be/O4irXQhgMqg?si=abc")).toEqual(yt("O4irXQhgMqg"));
    expect(parseSongLink("youtu.be/O4irXQhgMqg")).toEqual(yt("O4irXQhgMqg"));
    expect(parseSongLink("https://m.youtube.com/watch?v=O4irXQhgMqg")).toEqual(yt("O4irXQhgMqg"));
    expect(parseSongLink("https://music.youtube.com/watch?v=O4irXQhgMqg&feature=share")).toEqual(yt("O4irXQhgMqg"));
    expect(parseSongLink("https://www.youtube.com/shorts/O4irXQhgMqg")).toEqual(yt("O4irXQhgMqg"));
    expect(parseSongLink("https://www.youtube.com/embed/O4irXQhgMqg")).toEqual(yt("O4irXQhgMqg"));
    expect(parseSongLink("https://www.youtube.com/live/O4irXQhgMqg")).toEqual(yt("O4irXQhgMqg"));
  });

  it("recognises Spotify links so they can be called 'coming soon'", () => {
    expect(parseSongLink("https://open.spotify.com/track/2G40rYm638kK?si=x")).toEqual({ kind: "spotify" });
    expect(parseSongLink("spotify:track:2G40rYm638kK")).toEqual({ kind: "spotify" });
  });

  it("marks everything else unsupported", () => {
    expect(parseSongLink("https://soundcloud.com/indie-mix/session-live-09")).toEqual({ kind: "unsupported" });
    expect(parseSongLink("https://www.youtube.com/watch?v=short")).toEqual({ kind: "unsupported" });
    expect(parseSongLink("https://www.youtube.com/@somechannel")).toEqual({ kind: "unsupported" });
    expect(parseSongLink("https://evil.com/watch?v=O4irXQhgMqg")).toEqual({ kind: "unsupported" });
    expect(parseSongLink("not a link at all")).toEqual({ kind: "unsupported" });
  });

  it("returns null for empty input", () => {
    expect(parseSongLink("   ")).toBeNull();
  });
});

describe("durations", () => {
  it("parse YouTube's ISO 8601 format", () => {
    expect(parseIsoDuration("PT3M39S")).toBe(219);
    expect(parseIsoDuration("PT1H2M5S")).toBe(3725);
    expect(parseIsoDuration("PT45S")).toBe(45);
    expect(parseIsoDuration("P0D")).toBe(0);
    expect(parseIsoDuration("nonsense")).toBeNull();
  });

  it("format as m:ss or h:mm:ss", () => {
    expect(formatDuration(219)).toBe("3:39");
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(3725)).toBe("1:02:05");
  });
});

describe("telling links from searches", () => {
  it("treats links as links", () => {
    for (const link of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "youtu.be/dQw4w9WgXcQ", "youtube.com/shorts/abc", "spotify:track:1", "open.spotify.com/track/1", "example.com/song"]) {
      expect(looksLikeLink(link), link).toBe(true);
    }
  });

  it("treats words as searches", () => {
    for (const words of ["despacito", "despacito remix", "Mr.Brightside", "AC/DC thunderstruck", "  ", "lo-fi beats"]) {
      expect(looksLikeLink(words), words).toBe(false);
    }
  });
});
