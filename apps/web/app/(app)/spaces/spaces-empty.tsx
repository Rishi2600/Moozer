import { Radio } from "lucide-react";

export function SpacesEmpty({ actions }: { actions?: React.ReactNode }) {
  return (
    <div className="mx-auto mt-space-xl flex w-full max-w-[480px] flex-col items-center gap-3 rounded-[14px] bg-card p-8 text-center shadow-sm">
      <span className="flex size-10 items-center justify-center rounded-full bg-cream-container text-primary">
        <Radio className="size-5" aria-hidden />
      </span>
      <h2 className="text-title-sm text-foreground">No spaces yet</h2>
      <p className="text-body-md text-muted-foreground">
        Start a space to play music for a room, or open a link someone sent you to join theirs.
      </p>
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-space-sm">{actions}</div>}
    </div>
  );
}
