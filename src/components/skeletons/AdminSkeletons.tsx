import { Skeleton } from "@/components/ui/skeleton";

const barHeight = (h?: number) => ({ height: h ?? 16 });

export const TableRowsSkeleton = ({ rows = 6, height = 16 }: { rows?: number; height?: number }) => (
  <div className="rounded-xl border bg-card overflow-hidden">
    <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-4" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="px-4 py-3.5 border-b last:border-0">
        <div className="grid grid-cols-5 gap-4 items-center">
          {Array.from({ length: 5 }).map((_, j) => (
            <Skeleton key={j} className={j === 0 ? "w-2/3" : "w-full"} style={barHeight(height)} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border bg-card p-5">
          <Skeleton className="h-4 w-28 mb-3" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
    <div className="rounded-2xl border bg-card p-5">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-40 w-full" />
    </div>
    <TableRowsSkeleton rows={5} />
  </div>
);

export const ListSkeleton = ({ rows = 8, height = 18 }: { rows?: number; height?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 rounded-xl border bg-card p-4">
        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-2/3" style={barHeight(height)} />
          <Skeleton className="w-1/3" style={barHeight(Math.max(height - 6, 8))} />
        </div>
      </div>
    ))}
  </div>
);