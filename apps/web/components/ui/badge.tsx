import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// DESIGN.md status pills: fully round, 12px semibold.
const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-label-sm [&_svg]:size-3",
  {
    variants: {
      variant: {
        // Live / active, optionally with <BadgeDot pulse />
        live: "border border-border-strong bg-cream-container text-primary",
        // "Plays next", "Up next"
        next: "bg-muted text-orange-glow",
        // YouTube / Spotify, counts, neutral facts
        neutral: "bg-muted text-muted-foreground",
        ended: "bg-surface-container text-muted-foreground",
        success: "bg-success/10 text-success",
        destructive: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

function BadgeDot({ pulse = false, className }: { pulse?: boolean; className?: string }) {
  return (
    <span className={cn("relative flex size-2", className)} aria-hidden>
      {pulse && (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
      )}
      <span className="relative inline-flex size-2 rounded-full bg-current" />
    </span>
  )
}

export { Badge, BadgeDot, badgeVariants }
