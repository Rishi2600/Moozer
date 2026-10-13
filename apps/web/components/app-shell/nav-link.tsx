"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function NavLink({
  href,
  icon,
  children,
  alsoActiveOn = [],
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  alsoActiveOn?: string[];
}) {
  const pathname = usePathname();
  const active = [href, ...alsoActiveOn].some((prefix) => pathname.startsWith(prefix));
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-lg px-3 text-label-md transition-colors [&_svg]:size-5",
        active
          ? "bg-surface-container text-primary [&_svg]:text-primary"
          : "text-muted-foreground hover:bg-surface-container-low hover:text-foreground"
      )}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
