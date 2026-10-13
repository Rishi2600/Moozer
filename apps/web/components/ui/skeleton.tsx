import { cn } from "@/lib/utils"

// Placeholder block in the shape of content that's still loading.
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-lg bg-surface-container-high/70", className)} />
}
