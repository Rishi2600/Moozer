"use client";

import { ChevronsUpDown, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar } from "@/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function UserMenu({ name, email, compact = false }: { name: string; email: string; compact?: boolean }) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${name}`}
        className={cn(
          "flex items-center rounded-xl text-left transition-colors hover:bg-surface-container-low",
          compact ? "p-1" : "w-full justify-between gap-2 border border-border/60 p-2.5"
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar name={name} />
          {!compact && (
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-label-md text-foreground">{name}</span>
              <span className="truncate text-body-sm text-muted-foreground">{email}</span>
            </span>
          )}
        </span>
        {!compact && <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} side={compact ? "bottom" : "top"}>
        <DropdownMenuItem asChild>
          <Link href="/account">
            <User aria-hidden />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
