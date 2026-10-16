// A token bucket: up to `burst` at once, then `perSecond` steady. Keeps one
// excited thumb (or a script) from flooding a room with reactions.
export class Bucket {
  private tokens: number;
  private last: number;

  constructor(
    private burst = 6,
    private perSecond = 3,
    now = Date.now()
  ) {
    this.tokens = burst;
    this.last = now;
  }

  take(now = Date.now()) {
    this.tokens = Math.min(this.burst, this.tokens + ((now - this.last) / 1000) * this.perSecond);
    this.last = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

// Reactions per screen: the server enforces it, and the browser holds back
// the same way so nobody sees their own reactions that others never got.
export const REACTION_LIMIT = { burst: 6, perSecond: 3 } as const;
