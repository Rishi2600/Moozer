// A boost is worth 3 votes. Everyone gets one per space, back 5.5 hours
// after they use it.
export const BOOST_VOTES = 3;
export const BOOST_COOLDOWN_MS = 5.5 * 60 * 60 * 1000;
// Undo (from the toast) works for a minute; after that the boost is spent.
export const BOOST_UNDO_MS = 60 * 1000;

// The number on the ballot: people's votes plus what boosts add.
export function ballotVotes(votes: number, boosts: number) {
  return votes + BOOST_VOTES * boosts;
}

// When the viewer's boost is back, from their latest boost in this space.
// Null means it's ready now.
export function boostReadyAt(lastBoostAt: Date | null, now = Date.now()) {
  if (!lastBoostAt) return null;
  const readyAt = lastBoostAt.getTime() + BOOST_COOLDOWN_MS;
  return readyAt > now ? new Date(readyAt) : null;
}
