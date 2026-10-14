import { ImageResponse } from "next/og";

// The card shown when a Moozer link is shared (WhatsApp, Slack, iMessage...).
export const alt = "Moozer: let the room pick the music";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#fff8f6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 96, height: 96, borderRadius: 24, background: "#ff6200", color: "#fff", fontSize: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
            ♫
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 56, fontWeight: 800, color: "#1f140e" }}>Moozer</span>
            <span style={{ fontSize: 28, color: "#6e5d53" }}>Social Queue</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 88, fontWeight: 800, color: "#1f140e", letterSpacing: -3, lineHeight: 1.05 }}>Let the room pick the music.</span>
          <span style={{ fontSize: 34, color: "#6e5d53" }}>Add songs from YouTube, vote from your phone. The top song plays next.</span>
        </div>
        <div style={{ display: "flex", height: 12, width: "100%", borderRadius: 999, background: "#ffe9d2" }}>
          <div style={{ display: "flex", width: "52%", borderRadius: 999, background: "linear-gradient(90deg, #fe9d19, #ff6200)" }} />
        </div>
      </div>
    ),
    size
  );
}
