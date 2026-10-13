import { LayoutGrid, UserRound } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";

import { NavLink } from "./nav-link";
import { UserMenu } from "./user-menu";

type ShellUser = { name: string; email: string };

// Signed-in layout: a 240px sidebar on desktop, a slim top bar on phones.
export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col justify-between border-r border-border/60 bg-card p-4 md:flex">
        <div className="flex flex-col gap-6">
          <Link href="/spaces" className="px-1" aria-label="Moozer">
            <Logo />
          </Link>
          <nav className="flex flex-col gap-1.5" aria-label="Main">
            <NavLink href="/spaces" icon={<LayoutGrid aria-hidden />}>
              Spaces
            </NavLink>
            <NavLink href="/account" icon={<UserRound aria-hidden />}>
              Account
            </NavLink>
          </nav>
        </div>
        <UserMenu name={user.name} email={user.email} />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-card px-margin md:hidden">
        <Link href="/spaces" aria-label="Moozer">
          <Logo showTagline={false} />
        </Link>
        <UserMenu name={user.name} email={user.email} compact />
      </header>

      <main className="md:pl-60">
        <div className="px-margin py-space-lg md:px-margin-desktop md:py-space-xl">{children}</div>
      </main>
    </div>
  );
}
