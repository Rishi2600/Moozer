import { ImageResponse } from "next/og";

import { WaveformSvg } from "@/components/brand-mark";
import { BRAND_ORANGE } from "@/lib/brand";

// Browser home-screen icon (iOS): the waveform on an orange tile.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND_ORANGE, borderRadius: 40 }}>
        <WaveformSvg size={112} strokeWidth={2.5} />
      </div>
    ),
    size
  );
}
