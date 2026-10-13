import Image from "next/image";

import { cn } from "@/lib/utils";

// 16:9 YouTube thumbnail with rounded corners.
export function SongThumb({ src, className, sizes = "96px" }: { src: string; className?: string; sizes?: string }) {
  return (
    <span className={cn("relative block aspect-video shrink-0 overflow-hidden rounded-lg border border-border/40 bg-surface-container", className)}>
      <Image src={src} alt="" fill sizes={sizes} className="object-cover" />
    </span>
  );
}
