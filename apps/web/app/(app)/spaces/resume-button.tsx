"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setBreakAction } from "@/app/(app)/s/[slug]/actions";

// End the break and go back into the space.
export function ResumeButton({ spaceId, slug, className }: { spaceId: string; slug: string; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={() =>
        start(async () => {
          await setBreakAction(spaceId, false);
          router.push(`/s/${slug}`);
        })
      }
    >
      {pending ? "Resuming…" : "Resume"}
    </button>
  );
}
