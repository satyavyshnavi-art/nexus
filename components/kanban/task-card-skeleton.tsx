import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function TaskCardSkeleton() {
  return (
    <Card className="p-3 mb-2">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-6 w-16 rounded" />
        </div>
      </div>
    </Card>
  );
}
