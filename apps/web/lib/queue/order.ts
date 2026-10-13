// The ballot's rules: most votes first; a tie goes to the song added first.
export function sortQueue<T extends { votes: number; addedAt: Date }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.votes - a.votes || a.addedAt.getTime() - b.addedAt.getTime());
}

// How far the top song is ahead of the next one ("Leads by 3"). Null when
// there's no clear leader (empty queue, or tied with the second song).
export function leadMargin(sorted: { votes: number }[]) {
  if (sorted.length === 0) return null;
  const lead = sorted[0].votes - (sorted[1]?.votes ?? 0);
  return lead > 0 ? lead : null;
}
