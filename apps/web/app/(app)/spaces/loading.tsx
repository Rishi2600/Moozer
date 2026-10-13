import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex max-w-page flex-col gap-space-lg" role="status" aria-label="Loading your spaces">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <div className="divide-y divide-border/70 rounded-[14px] bg-card shadow-sm">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex h-16 items-center justify-between gap-4 px-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
