"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

// Legacy landing header; the landing page is redesigned in a later stage.
export default function NavBar() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();

    return (
        <header className="border-b bg-card">
            <nav className="mx-auto flex max-w-page items-center justify-between px-margin py-4 md:px-margin-desktop">
                <Link href="/" aria-label="Moozer home">
                    <Logo showTagline={false} />
                </Link>
                {!isPending && (
                    <div className="flex items-center gap-space-sm">
                        {session ? (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link href="/spaces">Spaces</Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.refresh() } })}
                                >
                                    Sign out
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link href="/sign-in">Sign in</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/create-account">Create account</Link>
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </nav>
        </header>
    )
}
