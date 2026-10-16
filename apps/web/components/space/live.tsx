"use client";

import { CLOSE, type Person, type ServerMessage } from "@moozer/protocol/messages";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import { realtimeTicketAction } from "@/app/(app)/s/[slug]/actions";

type Live = { status: "connecting" | "live" | "offline"; here: number | null; people: Person[]; reconnect: () => void };

const LiveContext = createContext<Live>({ status: "connecting", here: null, people: [], reconnect: () => {} });
export const useLive = () => useContext(LiveContext);

const URL_BASE = process.env.NEXT_PUBLIC_REALTIME_URL;

// Keeps a space's screens current: refreshes when the realtime server says
// something changed, follows a reset link, shares presence and connection
// status, and reconnects with back-off.
export function SpaceLive({ spaceId, slug, ticket, children }: { spaceId: string; slug: string; ticket: string | null; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<Omit<Live, "reconnect">>({ status: "connecting", here: null, people: [] });
  const latest = useRef({ pathname, slug, ticket });
  const reconnectNow = useRef<() => void>(() => {});

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
      };
      socket.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        if (message.type === "presence") {
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

    reconnectNow.current = () => {
      attempt = 0;
      socket?.close();
      if (!socket) void connect();
    };
    const onOnline = () => reconnectNow.current();
    window.addEventListener("online", onOnline);
    void connect();

    return () => {
      stopped = true;
      window.removeEventListener("online", onOnline);
      clearTimeout(retryTimer);
      clearTimeout(offlineTimer);
      clearTimeout(refreshTimer);
      socket?.close();
    };
  }, [spaceId, router]);

  return (
    <LiveContext.Provider value={{ ...state, reconnect: () => reconnectNow.current() }}>{children}</LiveContext.Provider>
  );
}
