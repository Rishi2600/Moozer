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
