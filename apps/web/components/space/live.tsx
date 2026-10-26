"use client";

import { Bucket, REACTION_LIMIT } from "@moozer/protocol/limit";
import {
  CLOSE,
  type ClientMessage,
  type Device,
  type Person,
  type Reaction,
  type ServerMessage,
  type Speaker,
  type SpeakerAnswer,
  type SpeakerRequest,
} from "@moozer/protocol/messages";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { realtimeTicketAction } from "@/app/(app)/s/[slug]/actions";
import { applyClockSample, bestSample, clockSample, type ClockSample } from "@/lib/clock";

export type ReactionEvent = { emoji: Reaction; from: Person | null }; // null: this screen's own
type Live = {
  status: "connecting" | "live" | "offline";
  here: number | null;
  people: Person[];
  reconnect: () => void;
  react: (emoji: Reaction) => void;
  // Reactions arrive as events, not state, so they don't re-render the page.
  onReaction: (listener: (event: ReactionEvent) => void) => () => void;
  // Guest speakers. The host's screens get requests and who's playing; a
  // guest gets the answer to their request (at: when it arrived, so the same
  // answer twice still shows).
  speakerRequests: SpeakerRequest[];
  speakers: Speaker[];
  speakerAnswer: { answer: SpeakerAnswer; retryAt?: number; at: number } | null;
  askToSpeak: () => boolean;
  answerSpeaker: (userId: string, allow: boolean) => void;
  // This screen started (device) or stopped (null) playing with sound.
  setSpeaker: (device: Device | null) => void;
};

const LiveContext = createContext<Live>({
  status: "connecting",
  here: null,
  people: [],
  reconnect: () => {},
  react: () => {},
  onReaction: () => () => {},
  speakerRequests: [],
  speakers: [],
  speakerAnswer: null,
  askToSpeak: () => false,
  answerSpeaker: () => {},
  setSpeaker: () => {},
});
export const useLive = () => useContext(LiveContext);

const URL_BASE = process.env.NEXT_PUBLIC_REALTIME_URL;

// Clock pings: a burst when connecting, again every minute and when the page
// comes back into view (docs/SYNC.md, B2).
const CLOCK_BURST = 5;
const CLOCK_GAP_MS = 200;
const CLOCK_EVERY_MS = 60_000;

// Keeps a space's screens current: refreshes when the realtime server says
// something changed, follows a reset link, shares presence and connection
// status, and reconnects with back-off.
export function SpaceLive({ spaceId, slug, ticket, children }: { spaceId: string; slug: string; ticket: string | null; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<Pick<Live, "status" | "here" | "people">>({ status: "connecting", here: null, people: [] });
  const [speakerState, setSpeakerState] = useState<Pick<Live, "speakerRequests" | "speakers" | "speakerAnswer">>({
    speakerRequests: [],
    speakers: [],
    speakerAnswer: null,
  });
  const device = useRef<Device | null>(null); // re-sent after a reconnect
  const latest = useRef({ pathname, slug, ticket });
  const reconnectNow = useRef<() => void>(() => {});
  const sendNow = useRef<(message: ClientMessage) => boolean>(() => false);
  const [listeners] = useState(() => new Set<(event: ReactionEvent) => void>());
  const [reactionBucket] = useState(() => new Bucket(REACTION_LIMIT.burst, REACTION_LIMIT.perSecond));

  useEffect(() => {
    latest.current = { pathname, slug, ticket: latest.current.ticket };
  }, [pathname, slug]);

  useEffect(() => {
    if (!URL_BASE) return;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let offlineTimer: ReturnType<typeof setTimeout> | undefined;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let stopped = false;
    let firstTicket = latest.current.ticket;
    let clockTimers: ReturnType<typeof setTimeout>[] = [];
    let clockSamples: ClockSample[] = [];

    const send = (message: ClientMessage) => {
      if (socket?.readyState !== WebSocket.OPEN) return false;
      socket.send(JSON.stringify(message));
      return true;
    };
    const syncClock = () => {
      clockTimers.forEach(clearTimeout);
      clockSamples = [];
      clockTimers = Array.from({ length: CLOCK_BURST }, (_, i) => setTimeout(() => send({ type: "time", t0: Date.now() }), i * CLOCK_GAP_MS));
      // Settle on the best ping once the burst has had time to come back.
      clockTimers.push(
        setTimeout(() => {
          const best = bestSample(clockSamples);
          if (best) applyClockSample(best);
        }, CLOCK_BURST * CLOCK_GAP_MS + 1000)
      );
    };
    const clockEvery = setInterval(syncClock, CLOCK_EVERY_MS);
    const onVisible = () => document.visibilityState === "visible" && syncClock();

    const refresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => router.refresh(), 150);
    };

    async function connect() {
      clearTimeout(retryTimer);
      const ticket = firstTicket ?? (await realtimeTicketAction(spaceId).catch(() => null));
      firstTicket = null; // tickets live 60s; later connections ask for a new one
      if (stopped) return;
      if (!ticket) return scheduleRetry();
      socket = new WebSocket(`${URL_BASE}?ticket=${encodeURIComponent(ticket)}`);
      socket.onopen = () => {
        clearTimeout(offlineTimer);
        offlineTimer = undefined;
        if (attempt > 0) refresh(); // catch up on anything missed while away
        attempt = 0;
        setState((s) => ({ ...s, status: "live" }));
        syncClock();
        if (device.current) send({ type: "speaker", device: device.current }); // a new connection starts quiet
      };
      socket.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        if (message.type === "reaction") {
          for (const listener of listeners) listener({ emoji: message.emoji, from: message.from });
        } else if (message.type === "time") {
          clockSamples.push(clockSample(message.t0, message.server, Date.now()));
        } else if (message.type === "speaker-requests") {
          setSpeakerState((s) => ({ ...s, speakerRequests: message.requests }));
        } else if (message.type === "speakers") {
          setSpeakerState((s) => ({ ...s, speakers: message.speakers }));
        } else if (message.type === "speaker-answer") {
          setSpeakerState((s) => ({ ...s, speakerAnswer: { answer: message.answer, retryAt: message.retryAt, at: Date.now() } }));
        } else if (message.type === "presence") {
          setState((s) => ({ ...s, here: message.here, people: message.people }));
        } else if (message.slug && message.slug !== latest.current.slug) {
          // The host reset the link: same space, new address.
          router.replace(latest.current.pathname.replace(`/s/${latest.current.slug}`, `/s/${message.slug}`));
        } else {
          refresh();
        }
      };
      socket.onclose = (event) => {
        socket = null;
        if (event.code === CLOSE.removed) {
          // The host removed this person: show why instead of reconnecting.
          stopped = true;
          router.refresh();
          return;
        }
        if (!stopped) scheduleRetry();
      };
    }

    function scheduleRetry() {
      // Only call it offline if it lasts, so a quick blip doesn't flash a banner.
      // Presence is unknown while offline, so drop it until the server reports again.
      offlineTimer ??= setTimeout(() => setState({ status: "offline", here: null, people: [] }), 2000);
      const delay = Math.min(1000 * 2 ** attempt++, 15_000);
      retryTimer = setTimeout(connect, delay);
    }

    sendNow.current = send;
    reconnectNow.current = () => {
      attempt = 0;
      socket?.close();
      if (!socket) void connect();
    };
    const onOnline = () => reconnectNow.current();
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    void connect();

    return () => {
      stopped = true;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(clockEvery);
      clockTimers.forEach(clearTimeout);
      clearTimeout(retryTimer);
      clearTimeout(offlineTimer);
      clearTimeout(refreshTimer);
      socket?.close();
    };
  }, [spaceId, router, listeners]);

  const reconnect = useCallback(() => reconnectNow.current(), []);
  const react = useCallback(
    (emoji: Reaction) => {
      // Shown here at once; the server relays it to everyone else.
      if (reactionBucket.take() && sendNow.current({ type: "react", emoji })) for (const listener of listeners) listener({ emoji, from: null });
    },
    [listeners, reactionBucket]
  );
  const onReaction = useCallback(
    (listener: (event: ReactionEvent) => void) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    [listeners]
  );

  const askToSpeak = useCallback(() => sendNow.current({ type: "speaker-request" }), []);
  const answerSpeaker = useCallback((userId: string, allow: boolean) => void sendNow.current({ type: "speaker-answer", userId, allow }), []);
  const setSpeaker = useCallback((next: Device | null) => {
    if (device.current === next) return;
    device.current = next;
    sendNow.current({ type: "speaker", device: next });
  }, []);

  return (
    <LiveContext.Provider value={{ ...state, ...speakerState, reconnect, react, onReaction, askToSpeak, answerSpeaker, setSpeaker }}>
      {children}
    </LiveContext.Provider>
  );
}
