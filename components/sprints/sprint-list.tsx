import { Card } from "@/components/ui/card";
import { SprintActions } from "./sprint-actions";
import { format } from "date-fns";
import type { Sprint } from "@prisma/client";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SprintWithCount extends Sprint {
  _count: {
    tasks: number;
  };
}

interface SprintListProps {
  sprints: SprintWithCount[];
  userRole: string;
  projectId: string;
  showMetrics?: boolean;
  taskCounts?: Record<string, { completed: number; incomplete: number }>;
}

export function SprintList({
  sprints,
  userRole,
  projectId,
  showMetrics = false,
  taskCounts = {},
}: SprintListProps) {
  if (sprints.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {sprints.map((sprint) => {
        const counts = taskCounts[sprint.id];
        const borderColor =
          sprint.status === "active"
            ? "border-l-green-500"
            : sprint.status === "planned"
            ? "border-l-yellow-500"
            : "border-l-muted-foreground/30";

        const content = (
          <Card
            key={sprint.id}
            className={cn(
              "p-5 border-l-4 transition-colors",
              borderColor,
              sprint.status === "completed" && "hover:bg-accent/50 cursor-pointer"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold">{sprint.name}</h3>
                  <StatusBadge status={sprint.status} />
                  {sprint.autoCreated && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400">
                      Auto
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>
                    {format(new Date(sprint.startDate), "MMM d, yyyy")} –{" "}
                    {format(new Date(sprint.endDate), "MMM d, yyyy")}
                  </span>
                  <span>{sprint._count.tasks} tickets</span>
                  {showMetrics && counts && sprint._count.tasks > 0 && (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {Math.round(
                        (counts.completed / sprint._count.tasks) * 100
                      )}
                      % complete
                    </span>
                  )}
                </div>
              </div>
              {userRole === "admin" && (
                <SprintActions
                  sprintId={sprint.id}
                  status={sprint.status}
                  sprintName={sprint.name}
                  projectId={projectId}
                  startDate={sprint.startDate}
                  endDate={sprint.endDate}
                  completedTaskCount={counts?.completed ?? 0}
                  incompleteTaskCount={counts?.incomplete ?? 0}
                />
              )}
            </div>
          </Card>
        );

        if (sprint.status === "completed") {
          return (
            <Link
              key={sprint.id}
              href={`/projects/${projectId}/sprints/${sprint.id}`}
            >
              {content}
            </Link>
          );
        }

        return <div key={sprint.id}>{content}</div>;
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: Sprint["status"] }) {
  const variants = {
    planned:
      "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
    active:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    completed: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
