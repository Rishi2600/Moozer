"use client";

import { useState } from "react";

import { GitHubIcon, GoogleIcon } from "@/components/brand-icons";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

import { FormError } from "./form-error";

const PROVIDERS = [
  { id: "google", label: "Continue with Google", Icon: GoogleIcon },
  { id: "github", label: "Continue with GitHub", Icon: GitHubIcon },
] as const;

export function SocialButtons({ next }: { next: string }) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWith(provider: (typeof PROVIDERS)[number]["id"], label: string) {
    setPending(provider);
    setError(null);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: next,
      errorCallbackURL: "/sign-in?error=oauth",
    });
    // On success the browser is already leaving for the provider.
    if (error) {
      setPending(null);
      setError(`Couldn't start ${label.replace("Continue with ", "")} sign-in. Try again.`);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {PROVIDERS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          disabled={pending !== null}
          onClick={() => signInWith(id, label)}
          className={cn(
            "flex h-10 w-full items-center justify-center gap-2.5 rounded-[10px] bg-surface-container-low px-4 text-label-md text-foreground transition-colors hover:bg-cream-container disabled:opacity-60",
            pending === id && "opacity-60"
          )}
        >
          <Icon className="size-4 shrink-0" />
          <span>{pending === id ? "Opening…" : label}</span>
        </button>
      ))}
      {error && <FormError>{error}</FormError>}
    </div>
  );
}
