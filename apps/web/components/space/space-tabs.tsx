"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function SpaceTabs({ slug, isHost }: { slug: string; isHost: boolean }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/s/${slug}`, label: "Queue", active: pathname === `/s/${slug}` },
    ...(isHost ? [{ href: `/s/${slug}/settings`, label: "Settings", active: pathname.startsWith(`/s/${slug}/settings`) }] : []),
  ];
  return (
    <nav aria-label="Space" className="flex gap-6">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 pb-3 text-label-md transition-colors",
            tab.active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
