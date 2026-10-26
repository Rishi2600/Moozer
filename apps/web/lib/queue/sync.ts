// Keeping a sounding player within about half a second of the shared clock
// (docs/SYNC.md, B3). Pure, so it can be tested; the player calls syncTick
// once a second with its error and seeks when told to.

export const SYNC = {
  sampleMs: 1000, // how often a playing player checks itself
  threshold: 0.5, // seconds off (median) before it corrects
  cooldownMs: 2500, // after a seek, let buffering settle before measuring
  maxLead: 1.5, // seconds a seek may aim ahead to make up for buffering
  samples: 3,
} as const;

export type SyncState = { samples: number[]; lead: number; justSeeked: boolean; cooldownUntil: number };

export const initialSync = (): SyncState => ({ samples: [], lead: 0, justSeeked: false, cooldownUntil: 0 });

export function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// error: the player's position minus the shared position, in seconds
// (positive: ahead). seek: jump to the shared position plus state.lead.
export function syncTick(state: SyncState, error: number, now: number): { state: SyncState; seek: boolean; median: number | null } {
  if (now < state.cooldownUntil) return { state, seek: false, median: null };
  const samples = [...state.samples, error].slice(-SYNC.samples);
  if (samples.length < SYNC.samples) return { state: { ...state, samples }, seek: false, median: null };
  const e = median(samples);
  // The first full reading after a seek says how far it fell short: aim
  // further ahead next time. Halved so one slow seek doesn't overshoot.
  const lead = state.justSeeked ? clamp(state.lead - e * 0.5, 0, SYNC.maxLead) : state.lead;
  if (Math.abs(e) > SYNC.threshold) {
    return { state: { samples: [], lead, justSeeked: true, cooldownUntil: now + SYNC.cooldownMs }, seek: true, median: e };
  }
  return { state: { samples, lead, justSeeked: false, cooldownUntil: 0 }, seek: false, median: e };
}

// A jump the player made itself (a new song, pause/resume, ±10 s): start
// measuring afresh once it settles, and learn from where it lands.
export function afterJump(state: SyncState, now: number): SyncState {
  return { samples: [], lead: state.lead, justSeeked: true, cooldownUntil: now + SYNC.cooldownMs };
}
