import { qrSvg } from "@/lib/qr";

import { CopyButton } from "./copy-button";

// Side panel: scan or copy the space link to join.
export async function InviteCard({ link, code }: { link: string; code: string }) {
  const svg = await qrSvg(link);
  return (
    <section className="flex flex-col gap-space-md rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-title-sm text-foreground">Invite people</h2>
        <span className="rounded-full bg-cream-container px-2.5 py-0.5 text-label-sm text-primary">Join link</span>
      </div>
      <div
        role="img"
        aria-label={`QR code for ${link}`}
        className="mx-auto w-40 rounded-xl border border-border/60 bg-white p-3 [&>svg]:size-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="flex gap-space-sm">
        <span className="flex h-11 min-w-0 flex-1 items-center rounded-lg bg-cream-subtle px-3 text-body-md text-muted-foreground">
          <span className="truncate">{link.replace(/^https?:\/\//, "")}</span>
        </span>
        <CopyButton text={link} />
      </div>
      <p className="text-body-sm text-muted-foreground">
        Anyone with the link can add songs and vote. Join code{" "}
        <span className="font-semibold tracking-wider text-foreground tabular-nums">{code}</span>
      </p>
    </section>
  );
}
