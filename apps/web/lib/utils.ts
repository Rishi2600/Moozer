import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Teach tailwind-merge the custom type scale from globals.css. Without this it
// reads text-label-sm as a colour and drops it when a text colour follows.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "headline-hero",
            "headline-hero-mobile",
            "headline-lg",
            "headline-lg-mobile",
            "headline-md",
            "title-sm",
            "body-lg",
            "body-md",
            "body-sm",
            "label-md",
            "label-sm",
            "counter-display",
            "counter-ballot",
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
