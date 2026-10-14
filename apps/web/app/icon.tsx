import { ImageResponse } from "next/og";

import { WaveformSvg } from "@/components/brand-mark";
import { BRAND_ORANGE } from "@/lib/brand";

// Browser tab icon: the waveform on an orange tile.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND_ORANGE, borderRadius: 8 }}>
        <WaveformSvg size={20} strokeWidth={3} />
      </div>
    ),
    size
  );
}
