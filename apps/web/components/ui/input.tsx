import * as React from "react"

import { cn } from "@/lib/utils"

// DESIGN.md: 44px tall, 1.5px warm border, orange border plus soft ring on focus.
// Text is 16px below sm so iOS doesn't zoom into the field.
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "h-11 w-full min-w-0 rounded-lg border-[1.5px] border-input bg-card px-4 text-base text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-faint-foreground sm:text-body-md",
          "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15",
          "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
