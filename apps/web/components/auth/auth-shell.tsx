import Link from "next/link";

import { Logo } from "@/components/logo";

// Centred card layout shared by sign in, create account and password reset.
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream-surface">
      <header className="flex justify-center pt-space-xl pb-space-md">
        <Link href="/" aria-label="Moozer home">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-margin py-space-lg sm:items-center">
        <div className="flex w-full max-w-[400px] flex-col rounded-[14px] bg-card p-6 shadow-sm">
          {children}
        </div>
      </main>
      <footer className="py-space-lg text-center text-body-sm text-faint-foreground">© 2026 Moozer</footer>
    </div>
  );
}

export function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 flex flex-col gap-1">
      <h1 className="text-headline-md text-foreground">{title}</h1>
      <p className="text-body-md text-muted-foreground">{description}</p>
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="relative my-5 flex items-center justify-center">
      <div className="h-px w-full bg-surface-container-high" />
      <span className="absolute bg-card px-3 text-label-sm text-faint-foreground">or</span>
    </div>
  );
}
