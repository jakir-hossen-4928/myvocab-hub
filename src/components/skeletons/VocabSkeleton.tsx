import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const VocabCardSkeleton = () => (
  <Card className="relative p-5 sm:p-6 md:p-8 h-full flex flex-col border-slate-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80">
    <div className="relative flex flex-col h-full z-10">
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-7 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="hidden sm:flex gap-1">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="mt-auto space-y-2 pt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  </Card>
);

export const VocabGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <VocabCardSkeleton key={i} />
    ))}
  </div>
);