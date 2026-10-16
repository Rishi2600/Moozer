import { describe, expect, it } from "vitest";

import { hostShortcut } from "./shortcuts";

const key = (k: string, extra: Partial<Parameters<typeof hostShortcut>[0]> = {}) => ({
  key: k,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  repeat: false,
  ...extra,
});
const page = { editable: false, inWidget: false, isControl: false };

describe("host shortcuts", () => {
  it("map the playback keys", () => {
    expect(hostShortcut(key(" "), page)).toBe("toggle");
    expect(hostShortcut(key("k"), page)).toBe("toggle");
    expect(hostShortcut(key("ArrowLeft"), page)).toBe("back");
    expect(hostShortcut(key("j"), page)).toBe("back");
    expect(hostShortcut(key("ArrowRight"), page)).toBe("forward");
    expect(hostShortcut(key("l"), page)).toBe("forward");
    expect(hostShortcut(key("N", { shiftKey: true }), page)).toBe("next");
    expect(hostShortcut(key("?", { shiftKey: true }), page)).toBe("help");
  });

  it("need Shift for Play next", () => {
    expect(hostShortcut(key("n"), page)).toBeNull();
  });

  it("leave typing, menus and dialogs alone", () => {
    expect(hostShortcut(key("k"), { ...page, editable: true })).toBeNull();
    expect(hostShortcut(key("ArrowLeft"), { ...page, inWidget: true })).toBeNull();
  });

  it("let a focused button answer Space itself", () => {
    expect(hostShortcut(key(" "), { ...page, isControl: true })).toBeNull();
    expect(hostShortcut(key("ArrowRight"), { ...page, isControl: true })).toBe("forward");
  });

  it("ignore browser shortcuts and held keys", () => {
    expect(hostShortcut(key("l", { ctrlKey: true }), page)).toBeNull();
    expect(hostShortcut(key("ArrowLeft", { metaKey: true }), page)).toBeNull();
    expect(hostShortcut(key("ArrowRight", { repeat: true }), page)).toBeNull();
  });
});
