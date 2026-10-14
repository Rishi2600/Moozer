import { AudioWaveform } from "lucide-react"

import { cn } from "@/lib/utils"

// Brand mark: a waveform on an orange tile, "Moozer", tagline "Social Queue".
export function Logo({
  showTagline = true,
  className,
}: {
  showTagline?: boolean
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-space-sm", className)}>
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sunlit">
        <AudioWaveform className="size-5" strokeWidth={2.5} aria-hidden />
      </span>
      <span className="flex flex-col">
        <span className="text-headline-md text-foreground">Moozer</span>
        {showTagline && (
          <span className="text-body-sm text-muted-foreground">Social Queue</span>
        )}
      </span>
    </span>
  )
}
