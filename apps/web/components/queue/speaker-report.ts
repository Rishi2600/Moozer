"use client";

import type { Device } from "@moozer/protocol/messages";
import { useEffect } from "react";

import { useLive } from "@/components/space/live";

function thisDevice(): Device {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "phone" : "laptop";
}

// Tells the room this screen is playing the music with sound (shown on the
// host's Speakers card, and counted so an empty room pauses).
export function useSpeakerReport(active: boolean) {
  const { setSpeaker } = useLive();
  useEffect(() => {
    setSpeaker(active ? thisDevice() : null);
  }, [active, setSpeaker]);
  useEffect(() => () => setSpeaker(null), [setSpeaker]);
}
