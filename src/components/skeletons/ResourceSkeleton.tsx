import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const ResourceCardSkeleton = () => (
  <Card className="min-h-full flex flex-col border border-gray-200 bg-white shadow-md relative rounded-2xl overflow-hidden">
    <Skeleton className="aspect-video w-full rounded-none" />
    <div className="flex-1 p-5 sm:p-6 flex flex-col">
      <Skeleton className="h-7 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1.5" />
      <Skeleton className="h-4 w-full mb-1.5" />
      <Skeleton className="h-4 w-2/3 mb-6" />
      <div className="mt-auto flex items-center justify-between">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  </Card>
);

export const ResourceGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <ResourceCardSkeleton key={i} />
    ))}
  </div>
);

export const ResourceDetailSkeleton = () => (
  <div className="min-h-screen bg-background">
    <Skeleton className="h-48 w-full rounded-none" />
    <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 space-y-6">
      <Card className="p-6 sm:p-8 shadow-sm rounded-2xl">
        <Skeleton className="h-5 w-28 rounded-full mb-4" />
        <Skeleton className="h-10 w-3/4 mb-3" />
        <Skeleton className="h-4 w-1/2 mb-6" />
        <Skeleton className="aspect-video w-full rounded-xl mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </Card>
    </div>
  </div>
);