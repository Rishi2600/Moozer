"use client";

import { Vote } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { GoogleIcon } from "@/components/brand-icons";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

// "Join the room to vote": sign in and come straight back into the space.
export function JoinActions({ slug }: { slug: string }) {
  const [pending, setPending] = useState(false);
  const back = `/s/${slug}`;
  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 text-center shadow-sm">
      <span className="flex size-12 items-center justify-center rounded-full bg-cream-container text-primary">
        <Vote className="size-6" aria-hidden />
      </span>
      <h2 className="text-headline-md text-foreground">Join the room to vote</h2>
      <p className="text-body-md text-muted-foreground">Sign in so your votes count once and songs stay fair.</p>
      <Button
        size="lg"
        className="mt-2 w-full"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const { error } = await authClient.signIn.social({ provider: "google", callbackURL: back, errorCallbackURL: "/sign-in" });
          if (error) setPending(false);
        }}
      >
        <GoogleIcon className="size-5" />
        {pending ? "Opening…" : "Continue with Google"}
      </Button>
      <Button variant="ghost" asChild className="w-full">
        <Link href={`/sign-in?next=${encodeURIComponent(back)}`}>More ways to sign in</Link>
      </Button>
    </section>
  );
}
