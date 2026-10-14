"use client";

import { Check, ListFilter } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { SPACE_FILTERS, type SpaceFilter } from "./filters";

// Spaces home's Filter: which statuses to list (kept in the URL, ?show=).
export function SpacesFilter({ current }: { current: SpaceFilter }) {
  const active = SPACE_FILTERS.find((f) => f.value === current)!;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={current === "all" ? undefined : "text-primary"}>
          <ListFilter aria-hidden />
          {current === "all" ? "Filter" : active.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SPACE_FILTERS.map((filter) => (
          <DropdownMenuItem key={filter.value} asChild>
            <Link href={filter.value === "all" ? "/spaces" : `/spaces?show=${filter.value}`} aria-current={filter.value === current ? "true" : undefined}>
              <Check aria-hidden className={filter.value === current ? "text-primary" : "invisible"} />
              {filter.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
