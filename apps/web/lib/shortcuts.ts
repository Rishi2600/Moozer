// The host's playback keys. Play next needs Shift so a stray key can't skip
// a song for the whole room (YouTube uses Shift+N too).
export type HostShortcut = "toggle" | "back" | "forward" | "next" | "help";

type Key = { key: string; shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; altKey: boolean; repeat: boolean };
// Where the key was pressed: typing in a field or inside a menu/dialog/tab
// list owns its own keys; a focused button already answers Space.
type Target = { editable: boolean; inWidget: boolean; isControl: boolean };

export function hostShortcut(event: Key, target: Target): HostShortcut | null {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return null;
  if (target.editable || target.inWidget) return null;
  switch (event.key) {
    case " ":
      return target.isControl ? null : "toggle";
    case "k":
    case "K":
      return event.shiftKey ? null : "toggle";
    case "ArrowLeft":
    case "j":
      return "back";
    case "ArrowRight":
    case "l":
      return "forward";
    case "N":
      return "next";
    case "?":
      return "help";
    default:
      return null;
  }
}

export function describeTarget(element: EventTarget | null): Target {
  if (!(element instanceof HTMLElement)) return { editable: false, inWidget: false, isControl: false };
  return {
    editable: element.isContentEditable || element.matches("input, textarea, select"),
    inWidget: element.closest('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tablist"], [role="slider"]') !== null,
    isControl: element.matches('button, a[href], summary, [role="button"], [role="switch"], [role="checkbox"]'),
  };
}

export const HOST_SHORTCUTS = [
  { keys: ["Space", "K"], does: "Pause or play" },
  { keys: ["←", "J"], does: "Back 10 seconds" },
  { keys: ["→", "L"], does: "Forward 10 seconds" },
  { keys: ["Shift", "N"], does: "Play next", together: true },
  { keys: ["?"], does: "Show these shortcuts" },
] as const;
