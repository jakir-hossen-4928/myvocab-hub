import { Skeleton } from "@/components/ui/skeleton";

/**
 * Neutral full-area skeleton used while a lazy route chunk loads or while
 * auth/role state is being resolved. Replaces spinner-based route loading so
 * navigation shows a calm shimmer instead of a spinning indicator.
 */
export const RouteSkeleton = () => (
  <div className="min-h-[60vh] p-6 flex items-center justify-center">
    <div className="w-full max-w-3xl space-y-4">
      <Skeleton className="h-8 w-1/3 mx-auto" />
      <Skeleton className="h-4 w-2/3 mx-auto" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  </div>
);