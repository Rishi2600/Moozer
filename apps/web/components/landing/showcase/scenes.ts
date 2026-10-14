// The landing film: five scenes that loop. Each scene draws itself from its
// progress p (0 to 1), so the whole film is deterministic and seekable.
export const SCENES = [
  { id: "start", chapter: "Start", caption: "Start a space in seconds.", seconds: 4.5 },
  { id: "share", chapter: "Share", caption: "Everyone joins with a link or a QR code. No app.", seconds: 5 },
  { id: "add", chapter: "Add", caption: "Anyone adds a song from YouTube.", seconds: 5.5 },
  { id: "vote", chapter: "Vote", caption: "The room votes. The queue re-sorts live.", seconds: 6 },
  { id: "play", chapter: "Play", caption: "The top song plays next, by itself.", seconds: 5 },
] as const;

export type SceneId = (typeof SCENES)[number]["id"];

const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

// Sample room. Real YouTube thumbnails, made-up people and votes.
export const SPACE_NAME = "Friday at the studio";
export const NOW_PLAYING = { title: "Queen – Bohemian Rhapsody", by: "Maya Chen", thumb: thumb("fJ9rUzIMcZQ"), seconds: 359 };
export const QUEUE = [
  { id: "dreams", title: "Fleetwood Mac – Dreams", by: "Arjun Mehta", thumb: thumb("mrZRURcb1cM"), votes: 6 },
  { id: "mgmt", title: "MGMT – Electric Feel", by: "Maya Chen", thumb: thumb("MmZexg8sxyk"), votes: 4 },
  { id: "m83", title: "M83 – Midnight City", by: "Priya Raman", thumb: thumb("dX3k_QDnzHE"), votes: 3 },
];
// The song the phone adds in scene 3, which then climbs the ballot.
export const ADDED = { id: "daft", title: "Daft Punk – Get Lucky", by: "Leo Okafor", thumb: thumb("5NV6Rdv1a3I"), votes: 1 };
export const PEOPLE = ["Priya Raman", "Maya Chen", "Arjun Mehta", "Leo Okafor", "Sam Torres"];

// Ease a 0..1 value in and out.
export const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
// Progress of a sub-step inside a scene: 0 before `from`, 1 after `to`.
export const step = (p: number, from: number, to: number) => Math.min(1, Math.max(0, (p - from) / (to - from)));

export type PhoneView = "invite" | "scan" | "joined" | "sheet" | "ballot";

// Everything both screens show at a moment of the film. Pure, so it's
// testable and the film can be paused or sought anywhere.
export function filmState(scene: SceneId, p: number) {
  const at = SCENES.findIndex((s) => s.id === scene);
  const after = (id: SceneId) => at > SCENES.findIndex((s) => s.id === id);
  const during = (id: SceneId) => scene === id;

  const typed = during("start") ? SPACE_NAME.slice(0, Math.round(step(p, 0.08, 0.6) * SPACE_NAME.length)) : SPACE_NAME;
  const live = !during("start") || p > 0.8;
  const here = during("start") ? 1 : during("share") ? 1 + Math.round(step(p, 0.4, 0.9) * (PEOPLE.length - 1)) : PEOPLE.length;
  const added = after("add") || (during("add") && p > 0.7);

  // Votes: the added song climbs from 1 to the top during the vote scene.
  const climb = during("vote") ? step(p, 0.1, 0.85) : after("vote") ? 1 : 0;
  const songs = [...QUEUE, ...(added ? [ADDED] : [])].map((s) => ({
    ...s,
    votes: s.id === ADDED.id ? s.votes + Math.round(climb * 7) : s.id === "dreams" ? s.votes + Math.round(climb * 1) : s.votes,
    hasVoted: s.id === ADDED.id,
  }));
  // Ties go to the song added first (here: the order of QUEUE, then ADDED).
  const order = [...QUEUE.map((s) => s.id), ADDED.id];
  songs.sort((a, b) => b.votes - a.votes || order.indexOf(a.id) - order.indexOf(b.id));

  // Play: the current song finishes, then the leader starts by itself.
  const switched = during("play") && p > 0.55;
  const playing = switched ? { ...songs[0], seconds: 248 } : NOW_PLAYING;
  const queue = switched ? songs.slice(1) : songs;
  const elapsed = during("play") ? (switched ? step(p, 0.55, 1) * 22 : 300 + step(p, 0, 0.5) * (NOW_PLAYING.seconds - 300)) : 161 + at * 11 + p * 5;

  const phone: PhoneView = during("start")
    ? "invite"
    : during("share")
      ? p < 0.4 ? "scan" : "joined"
      : during("add")
        ? "sheet"
        : "ballot";
  const pasted = during("add") ? "youtu.be/5NV6Rdv1a3I".slice(0, Math.round(step(p, 0.08, 0.38) * 20)) : "";

  return {
    typed,
    dialogOpen: during("start") && p < 0.8,
    live,
    here,
    people: PEOPLE.slice(0, here),
    added,
    justAdded: during("add") && p > 0.7,
    queue,
    playing,
    elapsed,
    phone,
    pasted,
    previewReady: during("add") && p > 0.42,
    tapAdd: during("add") && p > 0.62 && p < 0.72,
    tapVote: during("vote") && p > 0.08 && p < 0.16,
  };
}
