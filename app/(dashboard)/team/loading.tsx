import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoadingPage() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full sm:w-[180px]" />
      </div>

      {/* Results Count Skeleton */}
      <Skeleton className="h-5 w-48" />

      {/* Team Members Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="text-center">
                    <Skeleton className="h-8 w-8 mx-auto mb-2" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
