// What the queue looked like to one person, for "your song is up next" toasts.
type Song = { id: string; addedById: string; title: string };
export type QueueSnapshot = { playing: Song | null; leader: Song | null; queuedIds: string[] };

// A toast when the viewer's song starts playing, or climbs into the
// "Plays next" spot. Not for a song that lands on top the moment it's added
// (the "Added to queue" toast already covers that) or on the first look.
export function nudgeFor(before: QueueSnapshot | null, after: QueueSnapshot, viewerId: string): string | null {
  if (!before) return null;
  const { playing, leader } = after;
  if (playing && playing.addedById === viewerId && playing.id !== before.playing?.id) {
    return `Your song is playing: ${playing.title}`;
  }
  if (leader && leader.addedById === viewerId && leader.id !== before.leader?.id && before.queuedIds.includes(leader.id)) {
    return `Your song is up next: ${leader.title}`;
  }
  return null;
}
