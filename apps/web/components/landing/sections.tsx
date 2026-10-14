import { Check, Speaker, Users } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const STEPS = [
  { title: "Start a space", text: "Name it and press start. You're the host." },
  { title: "Share the link", text: "Send it or show the QR code. Anyone can join from their phone." },
  { title: "Add and vote", text: "Everyone adds songs and upvotes. The top song plays next." },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 bg-cream-surface py-space-xl lg:py-24">
      <div className="mx-auto flex max-w-page flex-col gap-10 px-margin md:px-margin-desktop">
        <h2 className="text-headline-lg-mobile text-foreground md:text-headline-lg">How a space works</h2>
        <ol className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-cream-container text-label-md text-primary">{i + 1}</span>
              <h3 className="text-title-sm text-foreground">{step.title}</h3>
              <p className="max-w-xs text-body-md text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const AUDIENCES = [
  {
    title: "For the host",
    icon: Speaker,
    items: ["Plays on your laptop, out through any speaker or TV", "Skip or remove a song in one click", "See everything that played tonight"],
  },
  {
    title: "For everyone else",
    icon: Users,
    items: ["No app to install", "Add a song in seconds", "Watch the votes change live"],
  },
];

export function Audiences() {
  return (
    <section className="mx-auto grid max-w-page gap-10 px-margin py-space-xl md:grid-cols-2 md:px-margin-desktop lg:py-24">
      {AUDIENCES.map(({ title, icon: Icon, items }) => (
        <div key={title} className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-headline-md text-foreground">
            <Icon className="size-5 text-primary" aria-hidden />
            {title}
          </h2>
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-3 text-body-lg text-foreground">
                <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export function ClosingBand({ startHref }: { startHref: string }) {
  return (
    <section className="mx-auto max-w-page px-margin pb-space-xl md:px-margin-desktop lg:pb-24">
      <div className="flex flex-col items-start gap-6 rounded-2xl bg-card p-8 shadow-sunlit md:flex-row md:items-center md:justify-between md:p-10">
        <div className="flex flex-col gap-2">
          <h2 className="text-headline-lg-mobile text-foreground md:text-headline-lg">Your next playlist is already in the room.</h2>
          <p className="text-body-md text-muted-foreground">No sign-up fee, no Bluetooth disputes, no tangled aux cables.</p>
        </div>
        <Button size="lg" asChild className="shrink-0">
          <Link href={startHref}>Start a space</Link>
        </Button>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-page flex-col gap-6 px-margin py-space-lg md:flex-row md:items-center md:justify-between md:px-margin-desktop">
        <div className="flex flex-col gap-2">
          <Logo showTagline={false} />
          <p className="text-body-sm text-muted-foreground">Shared listening rooms and democratic party queues.</p>
        </div>
        <nav aria-label="Footer" className="flex items-center gap-6 text-body-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-primary">Privacy</Link>
          <Link href="/terms" className="hover:text-primary">Terms</Link>
          <span className="text-faint-foreground">© 2026 Moozer</span>
        </nav>
      </div>
    </footer>
  );
}
