// Spaces home's Filter options (?show=). A plain module, since the server
// page and the client dropdown both need it.
export const SPACE_FILTERS = [
  { value: "all", label: "All spaces" },
  { value: "live", label: "Live" },
  { value: "paused", label: "Paused" },
  { value: "scheduled", label: "Scheduled" },
  { value: "ended", label: "Ended" },
] as const;

export type SpaceFilter = (typeof SPACE_FILTERS)[number]["value"];
