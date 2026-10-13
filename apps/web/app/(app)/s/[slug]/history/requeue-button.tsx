"use client";

import { RotateCcw } from "lucide-react";
import { useCallback, useState, useTransition } from "react";

import { requeueAction } from "@/app/(app)/s/[slug]/actions";
import { Toast } from "@/components/ui/toast";

export function RequeueButton({ itemId, title }: { itemId: string; title: string }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const dismiss = useCallback(() => setMessage(null), []);
  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => {
          const result = await requeueAction(itemId);
          setMessage(result.ok ? "Added to queue" : result.error);
        })}
        aria-label={`Add ${title} to the queue again`}
        title="Add to queue again"
        className="flex size-8 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-surface-container-high hover:text-primary disabled:opacity-50"
      >
        <RotateCcw className="size-4" aria-hidden />
      </button>
      {message && <Toast message={message} onDismiss={dismiss} />}
    </>
  );
}
