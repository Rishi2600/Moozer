"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

// Phones: the share sheet with the recap image (WhatsApp, Instagram...).
// Desktops (or anything that can't share files): the image downloads.
export function ShareRecapButton({ slug, spaceName }: { slug: string; spaceName: string }) {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");

  async function share() {
    setState("busy");
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch(`/s/${slug}/recap/image?tz=${encodeURIComponent(tz)}`);
      if (!response.ok) throw new Error(String(response.status));
      const file = new File([await response.blob()], `moozer-recap-${slug}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${spaceName} on Moozer`, text: `Our night on Moozer: ${spaceName}` }).catch(() => {});
      } else {
        const url = URL.createObjectURL(file);
        const link = Object.assign(document.createElement("a"), { href: url, download: file.name });
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setState("idle");
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button onClick={share} disabled={state === "busy"}>
        <Share2 aria-hidden />
        {state === "busy" ? "Making the card…" : "Share the recap"}
      </Button>
      {state === "failed" && <p className="text-body-sm text-destructive">Couldn&apos;t make the card. Try again.</p>}
    </div>
  );
}
