// A boost is worth 3 votes. Boosts come from each person's wallet
// (lib/boosts): a free one that comes back 5.5 hours after use, plus any bought.
export const BOOST_VOTES = 3;
// Undo (from the toast) works for a minute; after that the boost is spent.
export const BOOST_UNDO_MS = 60 * 1000;

// The number on the ballot: people's votes plus what boosts add.
export function ballotVotes(votes: number, boosts: number) {
  return votes + BOOST_VOTES * boosts;
}
