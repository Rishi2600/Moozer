import { ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"button"> & { voted: boolean; title: string; size?: "md" | "lg" };

// DESIGN.md ballot trigger: soft cream when not voted, solid orange with a
// warm glow when voted. lg (44px) is the touch size.
export function VoteButton({ voted, title, size = "md", className, ...props }: Props) {
  return (
    <button
      type="button"
      aria-pressed={voted}
      aria-label={voted ? `Remove your vote for ${title}` : `Vote for ${title}`}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl transition-[background-color,box-shadow,transform] active:scale-[0.94] disabled:opacity-50",
        size === "lg" ? "size-11" : "size-9",
        voted
          ? "bg-primary text-primary-foreground shadow-voted hover:bg-primary-pressed"
          : "border border-border bg-muted text-primary hover:border-border-strong hover:bg-cream-container",
        className
      )}
      {...props}
    >
      <ChevronUp className="size-5" strokeWidth={2.5} aria-hidden />
    </button>
  );
}
