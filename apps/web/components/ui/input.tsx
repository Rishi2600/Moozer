import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Text is 16px below sm so iOS doesn't zoom into the field.
const inputVariants = cva(
  "w-full min-w-0 text-base text-foreground transition-[background-color,border-color,box-shadow] outline-none placeholder:text-faint-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:text-body-md",
  {
    variants: {
      variant: {
        // DESIGN.md: 44px, 1.5px warm border, orange border plus soft ring on focus
        default:
          "h-11 rounded-lg border-[1.5px] border-input bg-card px-4 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15",
        // Sign-in screens: filled cream field that turns white on focus
        filled:
          "h-10 rounded-[10px] bg-cream-subtle px-3.5 focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-primary/15 aria-invalid:bg-error-container",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & VariantProps<typeof inputVariants>
>(({ className, type, variant, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(inputVariants({ variant }), className)}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input, inputVariants }
