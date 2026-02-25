import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />

      <div>
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-48 mt-2" />
      </div>

      {/* Upload area placeholder */}
      <div className="border-2 border-dashed rounded-lg p-6">
        <div className="flex flex-col items-center">
          <Skeleton className="h-10 w-10 rounded-full mb-3" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-40 mt-2" />
        </div>
      </div>

      {/* File list placeholders */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
            <Skeleton className="h-5 w-5" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
