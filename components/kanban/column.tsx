"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task, TaskStatus, User } from "@prisma/client";
import { TaskCard } from "./task-card";
import { Badge } from "@/components/ui/badge";
import { memo } from "react";
import { Circle, Clock, Eye, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColumnProps {
  status: TaskStatus;
  title: string;
  tasks: (Task & {
    assignee: Pick<User, "id" | "name" | "email"> | null;
    _count?: {
      comments: number;
      attachments: number;
    };
  })[];
  onTaskClick?: (task: Task & {
    assignee: Pick<User, "id" | "name" | "email"> | null;
    _count?: {
      comments: number;
      attachments: number;
    };
  }) => void;
  projectLinked?: boolean;
  userHasGitHub?: boolean;
  isDragging?: boolean;
}

const columnConfig: Record<TaskStatus, { icon: any, className: string, headerClass: string }> = {
  todo: {
    icon: Circle,
    className: "text-slate-500",
    headerClass: "bg-slate-50/50 border-slate-200",
  },
  progress: {
    icon: Clock,
    className: "text-blue-500",
    headerClass: "bg-blue-50/50 border-blue-200",
  },
  review: {
    icon: Eye,
    className: "text-amber-500",
    headerClass: "bg-amber-50/50 border-amber-200",
  },
  done: {
    icon: CheckCircle2,
    className: "text-green-500",
    headerClass: "bg-green-50/50 border-green-200",
  },
};

export const Column = memo(function Column({ status, title, tasks, onTaskClick, projectLinked = false, userHasGitHub = false, isDragging = false }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = columnConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="flex-1 min-w-[300px] max-w-[400px] flex flex-col h-full bg-muted/40 rounded-xl border border-border/50">
      {/* Column Header */}
      <div className={cn("flex items-center justify-between p-3 border-b", config.headerClass, "rounded-t-xl")}>
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("h-4 w-4", config.className)} />
          <h3 className="font-semibold text-sm tracking-tight text-foreground/80">
            {title}
          </h3>
        </div>
        <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5 font-mono">
          {tasks.length}
        </Badge>
      </div>

      {/* Tasks Container */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex-1 p-2 space-y-3 overflow-y-auto min-h-[300px]",
            isOver && "bg-muted/60 ring-2 ring-primary/10 ring-inset",
            "scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
          )}
        >
          {tasks.length === 0 ? (
            <div className={cn(
              "flex flex-col items-center justify-center h-32 text-muted-foreground/60 text-sm border-2 border-dashed border-transparent rounded-lg transition-colors",
              isDragging && "border-primary/30 bg-primary/5"
            )}>
              <p className="text-center font-medium">
                {isDragging ? (
                  <span className="text-primary">Drop here</span>
                ) : (
                  "No tasks"
                )}
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onTaskClick ? () => onTaskClick(task) : undefined}
                isDragging={isDragging}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
});
