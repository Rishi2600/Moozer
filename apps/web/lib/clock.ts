// The server's clock as seen from this device. Playback positions are worked
// out from anchors the server writes with its own clock, so a device whose
// clock is off would play early or late by that much. The realtime socket
// measures the gap NTP-style; positions use serverNow() instead of Date.now().
// See docs/SYNC.md (B2).

export type ClockSample = { offset: number; rtt: number };

// One ping: sent at t0 (this device), the server read its clock, back at t1.
// Assumes the trip each way took half the round trip.
export function clockSample(t0: number, server: number, t1: number): ClockSample {
  return { offset: server - (t0 + t1) / 2, rtt: t1 - t0 };
}

// The quickest round trip leaves the least room for uneven delays.
export function bestSample(samples: ClockSample[]): ClockSample | null {
  let best: ClockSample | null = null;
  for (const s of samples) if (s.rtt >= 0 && (!best || s.rtt < best.rtt)) best = s;
  return best;
}

// Smooth small changes; take a jump over a second at once (the device's
// clock was changed).
export function nextOffset(previous: number | null, sample: ClockSample) {
  if (previous === null || Math.abs(sample.offset - previous) > 1000) return Math.round(sample.offset);
  return Math.round(previous * 0.8 + sample.offset * 0.2);
}

let offset: number | null = null;

export const serverNow = () => Date.now() + (offset ?? 0);
export const clockOffset = () => offset;
export function applyClockSample(sample: ClockSample) {
  offset = nextOffset(offset, sample);
}
