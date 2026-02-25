import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, CheckCircle2, Circle, Clock, Eye } from "lucide-react";
import type { SprintProgressData } from "@/server/actions/sprints";

interface SprintProgressProps {
  progress: SprintProgressData;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    planned:
      "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
    active:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    completed:
      "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        variants[status] ?? variants.planned
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function SprintProgress({ progress }: SprintProgressProps) {
  const {
    name,
    status,
    startDate,
    endDate,
    totalTasks,
    tasksByStatus,
    completionPercentage,
  } = progress;

  return (
    <Card className="bg-card/80 backdrop-blur-sm border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">{name}</CardTitle>
              <StatusBadge status={status} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {format(new Date(startDate), "MMM d, yyyy")} &ndash;{" "}
                {format(new Date(endDate), "MMM d, yyyy")}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {completionPercentage}%
            </p>
            <p className="text-xs text-muted-foreground">completed</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {tasksByStatus.done} of {totalTasks} tasks done
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Task Breakdown */}
        <div className="grid grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50">
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700">
              <Circle className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">
                {tasksByStatus.todo}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">To Do</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-200 dark:bg-blue-900">
              <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none text-blue-700 dark:text-blue-300">
                {tasksByStatus.progress}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                In Progress
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30">
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-amber-200 dark:bg-amber-900">
              <Eye className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none text-amber-700 dark:text-amber-300">
                {tasksByStatus.review}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Review</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/30">
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-green-200 dark:bg-green-900">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none text-green-700 dark:text-green-300">
                {tasksByStatus.done}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Done</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
