import { ImageResponse } from "next/og";

import { WaveformSvg } from "@/components/brand-mark";
import { getSession } from "@/lib/session";
import { inSpace, openSpace } from "@/lib/spaces/data";
import { getRecap } from "@/lib/spaces/recap";

// The shareable recap card: a 1080x1350 portrait image (the shape stories and
// chats show best). Members only, and only once the space has ended. The
// date uses the sharer's time zone (?tz=), so a 1 am night isn't dated the
// day before.
const INK = "#1f140e";
const MUTED = "#6e5d53";
const ORANGE = "#ff6200";

export async function GET(request: Request, { params }: RouteContext<"/s/[slug]/recap/image">) {
  const { slug } = await params;
  const session = await getSession();
  if (!session) return new Response("Sign in to see this recap.", { status: 401 });
  const opened = await openSpace(slug, session.user.id);
  if (!inSpace(opened) || opened.space.status !== "ended") return new Response("No recap here.", { status: 404 });
  const recap = await getRecap(opened.space.id, session.user.id);

  const tz = new URL(request.url).searchParams.get("tz") ?? "UTC";
  let date: string;
  try {
    date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: tz }).format(recap.space.endedAt ?? new Date());
  } catch {
    date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(recap.space.endedAt ?? new Date());
  }

  const stat = (value: string, label: string) => (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "24px 32px", borderRadius: 32, background: "#ffffff" }}>
      <span style={{ fontSize: 64, fontWeight: 800, color: INK }}>{value}</span>
      <span style={{ fontSize: 30, color: MUTED }}>{label}</span>
    </div>
  );
  const line = (label: string, value: string) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 28, color: ORANGE, fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 40, color: INK, fontWeight: 700, lineClamp: 1 }}>{value}</span>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 36, padding: "72px 80px", background: "#fff8f6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 76, height: 76, borderRadius: 20, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <WaveformSvg size={44} />
          </div>
          <span style={{ fontSize: 44, fontWeight: 800, color: INK }}>Moozer</span>
          <span style={{ marginLeft: "auto", fontSize: 30, color: ORANGE, fontWeight: 700, padding: "10px 24px", borderRadius: 999, background: "#ffe9d2" }}>Night recap</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 84, fontWeight: 800, color: INK, letterSpacing: -2, lineHeight: 1.05, lineClamp: 2 }}>{recap.space.name}</span>
          <span style={{ fontSize: 34, color: MUTED }}>
            {date} · hosted by {recap.space.host.name}
          </span>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {stat(String(recap.songsPlayed), recap.songsPlayed === 1 ? "song played" : "songs played")}
          {stat(String(recap.people), recap.people === 1 ? "person" : "people")}
          {stat(recap.shortLength, "of music")}
        </div>

        {recap.top && (
          <div style={{ display: "flex", alignItems: "center", gap: 32, padding: 28, borderRadius: 32, background: "#ffffff" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- rendered into a PNG, not a page */}
            <img src={recap.top.thumbnailUrl} width={320} height={180} style={{ borderRadius: 20, objectFit: "cover" }} alt="" />
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 }}>
              <span style={{ fontSize: 28, color: ORANGE, fontWeight: 700 }}>Top song of the night</span>
              <span style={{ fontSize: 40, color: INK, fontWeight: 800, lineClamp: 2, lineHeight: 1.15 }}>{recap.top.title}</span>
              <span style={{ fontSize: 30, color: MUTED }}>
                {recap.top.finalVotes} {recap.top.finalVotes === 1 ? "vote" : "votes"} · added by {recap.top.addedBy.name}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {recap.favourite && line("Crowd favourite", `${recap.favourite.name} · ${recap.favourite.votes} votes`)}
          {recap.boosted && line("Most boosted", `${recap.boosted.title} · ${recap.boosted.boosts}×`)}
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", height: 12, width: "100%", borderRadius: 999, background: "#ffe9d2" }}>
            <div style={{ display: "flex", width: "100%", borderRadius: 999, background: "linear-gradient(90deg, #fe9d19, #ff6200)" }} />
          </div>
          <span style={{ fontSize: 30, color: MUTED }}>Made with Moozer · let the room pick the music</span>
        </div>
      </div>
    ),
    { width: 1080, height: 1350, headers: { "cache-control": "private, max-age=300" } }
  );
}
