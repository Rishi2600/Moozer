"use client"

import { CircleCheck } from "lucide-react"
import { useEffect } from "react"

// One short message above the bottom edge, optionally with an action ("Undo").
export function Toast({
  message,
  action,
  onDismiss,
}: {
  message: string
  action?: { label: string; onClick: () => void }
  onDismiss: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center gap-3 rounded-full bg-inverse-surface px-5 py-3 text-inverse-on-surface shadow-sunlit md:bottom-6 animate-in fade-in-0 slide-in-from-bottom-2"
    >
      <CircleCheck className="size-5 shrink-0 text-primary" aria-hidden />
      <span className="flex-1 text-label-md">{message}</span>
      {action && (
        <button type="button" onClick={action.onClick} className="text-label-md text-primary-fixed-dim hover:text-white">
          {action.label}
        </button>
      )}
    </div>
  )
}
