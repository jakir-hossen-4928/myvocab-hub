import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const VocabularyDetailSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="bg-gradient-to-br from-primary to-primary/80">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-12">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
          <Skeleton className="h-10 w-24 rounded-lg bg-white/20" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full bg-white/20 mb-4" />
        <Skeleton className="h-10 w-2/3 bg-white/20 mb-2" />
        <Skeleton className="h-7 w-1/3 bg-white/20" />
      </div>
    </div>
    <div className="max-w-lg mx-auto px-4 -mt-6 space-y-4">
      <Card className="p-5 rounded-2xl shadow-sm">
        <Skeleton className="h-4 w-28 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </Card>
      <Card className="p-5 rounded-2xl shadow-sm">
        <Skeleton className="h-4 w-28 mb-3" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </Card>
    </div>
  </div>
);

export const StudySkeleton = () => (
  <div className="min-h-screen bg-background p-6">
    <Skeleton className="h-10 w-64 mb-6" />
    <div className="flex items-center justify-center gap-2 mb-8">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-8 w-8 rounded-full" />
      ))}
    </div>
    <Skeleton className="w-full max-w-xl mx-auto aspect-[4/3] rounded-3xl" />
    <div className="flex items-center justify-center gap-3 mt-8">
      <Skeleton className="h-12 w-24 rounded-lg" />
      <Skeleton className="h-12 w-32 rounded-lg" />
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-6">
    <div className="w-full max-w-md space-y-4">
      <div className="flex flex-col items-center mb-6">
        <Skeleton className="h-24 w-24 rounded-full mb-4" />
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Card className="p-5 rounded-2xl shadow-sm">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-10 w-full" />
      </Card>
      <Card className="p-5 rounded-2xl shadow-sm">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-10 w-full" />
      </Card>
    </div>
  </div>
);