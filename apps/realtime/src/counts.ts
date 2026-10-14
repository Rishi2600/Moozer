// Writes each space's listener count to the database for Spaces home and
// Discover. Arrivals and departures come in bursts, so a space's count is
// written at most once per `delayMs`, and only when it changed.
export class CountWriter {
  private pending = new Map<string, number>();
  private written = new Map<string, number>();
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private write: (counts: Map<string, number>) => Promise<void>,
    private delayMs = 1000
  ) {}

  set(spaceId: string, here: number) {
    this.pending.set(spaceId, here);
    this.timer ??= setTimeout(() => void this.flush(), this.delayMs);
  }

  async flush() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const changed = new Map([...this.pending].filter(([id, n]) => (this.written.get(id) ?? 0) !== n));
    this.pending.clear();
    if (changed.size === 0) return;
    try {
      await this.write(changed);
      for (const [id, n] of changed) {
        if (n === 0) this.written.delete(id);
        else this.written.set(id, n);
      }
    } catch (err) {
      // Not fatal: the next arrival or departure writes the count again.
      console.error("realtime: couldn't save listener counts", (err as Error).message);
    }
  }
}
