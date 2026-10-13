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
