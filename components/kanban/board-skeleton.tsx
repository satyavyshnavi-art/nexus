import { TaskCardSkeleton } from "./task-card-skeleton";

export function BoardSkeleton() {
  const columns = ["To Do", "In Progress", "Review", "Done"];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((title) => (
        <div key={title} className="flex-1 min-w-[280px]">
          <div className="rounded-lg bg-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide">
                {title}
              </h3>
              <span className="text-xs bg-white px-2 py-1 rounded-full">0</span>
            </div>
            <div className="space-y-2 min-h-[200px]">
              <TaskCardSkeleton />
              <TaskCardSkeleton />
              <TaskCardSkeleton />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
