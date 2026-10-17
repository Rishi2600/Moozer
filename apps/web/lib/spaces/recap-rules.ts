// The night in a few lines, from the songs that played.
export type PlayedSong = {
  id: string;
  title: string;
  thumbnailUrl: string;
  finalVotes: number; // votes (boosts included) when it started
  boosts: number;
  startedAt: Date;
  addedBy: { id: string; name: string };
};

const earliest = (a: PlayedSong, b: PlayedSong) => a.startedAt.getTime() - b.startedAt.getTime();

// The song with the most votes when it played; a tie goes to the earlier one.
export function topSong(played: PlayedSong[]) {
  return [...played].sort((a, b) => b.finalVotes - a.finalVotes || earliest(a, b))[0] ?? null;
}

// The most boosted song, if anything was boosted.
export function mostBoosted(played: PlayedSong[]) {
  const top = [...played].sort((a, b) => b.boosts - a.boosts || earliest(a, b))[0];
  return top && top.boosts > 0 ? top : null;
}

// Whose songs the room voted for most (added up); ties go to whoever got
// more songs played. None if nobody's songs got a vote.
export function crowdFavourite(played: PlayedSong[]) {
  const people = new Map<string, { id: string; name: string; votes: number; songs: number }>();
  for (const song of played) {
    const person = people.get(song.addedBy.id) ?? { ...song.addedBy, votes: 0, songs: 0 };
    person.votes += song.finalVotes;
    person.songs += 1;
    people.set(person.id, person);
  }
  const top = [...people.values()].sort((a, b) => b.votes - a.votes || b.songs - a.songs)[0];
  return top && top.votes > 0 ? top : null;
}

// "3h 12m", "45m", "Under a minute" (or "<1m" where space is tight).
export function nightLength(startMs: number, endMs: number, short = false) {
  const minutes = Math.max(0, Math.round((endMs - startMs) / 60_000));
  if (minutes < 1) return short ? "<1m" : "Under a minute";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}h ${String(rest).padStart(2, "0")}m` : `${rest}m`;
}
