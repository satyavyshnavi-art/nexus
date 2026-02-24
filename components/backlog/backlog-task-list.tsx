"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckSquare, Bug, Package, ChevronDown } from "lucide-react";
import { getRoleColor } from "@/lib/utils/role-colors";
import { moveTaskToSprint } from "@/server/actions/features";
import { toast } from "@/lib/hooks/use-toast";

const typeConfig: Record<string, { icon: typeof CheckSquare; color: string }> = {
  story: { icon: BookOpen, color: "text-purple-600 dark:text-purple-400" },
  task: { icon: CheckSquare, color: "text-blue-600 dark:text-blue-400" },
  bug: { icon: Bug, color: "text-red-600 dark:text-red-400" },
};

const priorityConfig: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

type BacklogTask = {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  storyPoints: number | null;
  requiredRole: string | null;
  labels: string[];
  createdAt: Date;
  assignee: { id: string; name: string | null; email: string } | null;
  feature: { id: string; title: string } | null;
  _count: { childTasks: number };
};

type Sprint = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
};

interface BacklogTaskListProps {
  tasks: BacklogTask[];
  sprints: Sprint[];
  isAdmin: boolean;
}

export function BacklogTaskList({ tasks, sprints, isAdmin }: BacklogTaskListProps) {
  const router = useRouter();
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);

  const handleMoveToSprint = async (taskId: string, sprintId: string) => {
    setMovingTaskId(taskId);
    try {
      await moveTaskToSprint(taskId, sprintId);
      toast({
        title: "Task moved",
        description: "Task has been moved to the sprint",
        variant: "success",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to move task",
        variant: "destructive",
      });
    } finally {
      setMovingTaskId(null);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No backlog tasks found</p>
        <p className="text-xs mt-1">Tasks without a sprint assignment will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tasks.map((task) => {
        const TypeIcon = typeConfig[task.type]?.icon || CheckSquare;
        const typeColor = typeConfig[task.type]?.color || "text-muted-foreground";
        const roleStyle = task.requiredRole ? getRoleColor(task.requiredRole) : null;

        return (
          <div
            key={task.id}
            className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/40 hover:shadow-sm transition-all"
          >
            <TypeIcon className={`h-4 w-4 shrink-0 ${typeColor}`} />

            <span className="text-sm font-medium flex-1 line-clamp-1">
              {task.title}
            </span>

            {task.feature && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                <Package className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{task.feature.title}</span>
              </div>
            )}

            {task._count.childTasks > 0 && (
              <Badge variant="outline" className="text-[10px] shrink-0">
                {task._count.childTasks} subtasks
              </Badge>
            )}

            {task.storyPoints && (
              <span className="text-xs text-muted-foreground shrink-0">
                {task.storyPoints}pt
              </span>
            )}

            {roleStyle && (
              <Badge
                variant="outline"
                className={`shrink-0 text-[10px] border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
              >
                {task.requiredRole}
              </Badge>
            )}

            <Badge
              variant="outline"
              className={`shrink-0 text-[10px] border ${priorityConfig[task.priority] || ""}`}
            >
              {task.priority}
            </Badge>

            {task.assignee && (
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-medium text-primary">
                  {(task.assignee.name?.charAt(0) || task.assignee.email.charAt(0)).toUpperCase()}
                </span>
              </div>
            )}

            {/* Move to Sprint dropdown */}
            {sprints.length > 0 && (
              <div className="relative shrink-0">
                <select
                  className="h-7 text-xs border rounded px-2 bg-background cursor-pointer appearance-none pr-6"
                  defaultValue=""
                  disabled={movingTaskId === task.id}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleMoveToSprint(task.id, e.target.value);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="" disabled>
                    {movingTaskId === task.id ? "Moving..." : "Move to Sprint"}
                  </option>
                  {sprints.map((sprint) => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
