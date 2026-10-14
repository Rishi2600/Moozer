import Link from "next/link";

import { Avatar } from "@/components/avatar";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";

export const START_HREF_SIGNED_OUT = `/create-account?next=${encodeURIComponent("/spaces?start=1")}`;

export async function LandingHeader() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-margin md:px-margin-desktop" aria-label="Main">
        <Link href="/" aria-label="Moozer home">
          <Logo showTagline={false} />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" asChild className="max-sm:hidden">
            <Link href="/discover">Discover</Link>
          </Button>
          <Button variant="ghost" asChild className="max-sm:hidden">
            <Link href="/#how">How it works</Link>
          </Button>
          {session ? (
            <>
              <Button asChild>
                <Link href="/spaces">Open Moozer</Link>
              </Button>
              <Link href="/account" aria-label="Your account" className="ml-1">
                <Avatar name={session.user.name} />
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild className="max-sm:hidden">
                <Link href={START_HREF_SIGNED_OUT}>Start a space</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
