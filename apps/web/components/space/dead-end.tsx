import { RadioTower } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

// Full-page state for links that lead nowhere: a reset link or an ended space.
export function SpaceDeadEnd({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto mt-space-xl flex w-full max-w-[480px] flex-col items-center gap-3 rounded-[14px] bg-card p-8 text-center shadow-sm">
      <span className="flex size-10 items-center justify-center rounded-full bg-cream-container text-primary">
        <RadioTower className="size-5" aria-hidden />
      </span>
      <h1 className="text-title-sm text-foreground">{title}</h1>
      <p className="text-body-md text-muted-foreground">{description}</p>
      <Button asChild className="mt-2">
        <Link href="/spaces">Go to Spaces</Link>
      </Button>
    </div>
  );
}
