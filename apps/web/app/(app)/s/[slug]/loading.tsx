import { Skeleton } from "@/components/ui/skeleton";

// The queue tab's shape while it loads (the space header is already shown).
export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-gutter-desktop lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_24rem]" role="status" aria-label="Loading the queue">
      <div className="flex min-w-0 flex-col gap-gutter-desktop">
        <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-sm">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <div className="flex flex-col rounded-2xl bg-card p-5 shadow-sm">
          <Skeleton className="mb-4 h-4 w-32" />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 border-t border-border/60 py-3">
              <Skeleton className="h-6 w-8" />
              <Skeleton className="size-9 rounded-xl max-sm:size-11" />
              <Skeleton className="aspect-video w-16 sm:w-20" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden flex-col gap-gutter-desktop lg:flex">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
    </div>
  );
}
