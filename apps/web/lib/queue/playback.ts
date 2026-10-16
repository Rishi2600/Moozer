// Where the playing song is, from what every screen shares: playing ->
// now - anchorAt; paused -> the frozen position.
export type PlaybackState = { anchorAt: Date | null; pausedAtMs: number | null };

export function positionMs(state: PlaybackState, now = Date.now()) {
  if (state.pausedAtMs !== null) return state.pausedAtMs;
  if (!state.anchorAt) return 0;
  return Math.max(0, now - state.anchorAt.getTime());
}

export function isPaused(state: PlaybackState) {
  return state.pausedAtMs !== null;
}

// On resume the anchor moves forward so the position carries on from the pause.
export function resumedAnchor(pausedAtMs: number, now = Date.now()) {
  return new Date(now - pausedAtMs);
}

// Jumping forward or back moves the anchor (or the frozen position) so every
// screen lands on the same spot. Stays within the song: not before 0, and
// not past its last second when the length is known.
export function seekedState(state: PlaybackState, deltaMs: number, durationSeconds: number | null, now = Date.now()) {
  const end = durationSeconds !== null ? Math.max(0, durationSeconds * 1000 - 1000) : Infinity;
  const target = Math.round(Math.min(end, Math.max(0, positionMs(state, now) + deltaMs)));
  return state.pausedAtMs !== null ? { anchorAt: state.anchorAt, pausedAtMs: target } : { anchorAt: new Date(now - target), pausedAtMs: null };
}
