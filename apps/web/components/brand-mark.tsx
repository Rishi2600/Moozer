import { WAVEFORM_PATH } from "@/lib/brand";

// The waveform as plain SVG, usable inside next/og images (no lucide there).
export function WaveformSvg({ size, strokeWidth = 2.5 }: { size: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={WAVEFORM_PATH} />
    </svg>
  );
}
