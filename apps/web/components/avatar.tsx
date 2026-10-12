import { cn } from "@/lib/utils"

// Initials avatar. Profile photos from Google/GitHub can come later.
export function Avatar({ name, className }: { name: string; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?"
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-cream-container text-label-md text-primary",
        className
      )}
    >
      {initial}
    </span>
  )
}
