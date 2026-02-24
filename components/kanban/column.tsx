"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task, TaskStatus, User } from "@prisma/client";
import { TaskCard } from "./task-card";
import { Badge } from "@/components/ui/badge";
import { memo } from "react";
import { Circle, Clock, Eye, CheckCircle2 } from "lucide-react";

interface ColumnTask extends Omit<Task, "githubIssueId"> {
  githubIssueId: string | null;
  assignee: Pick<User, "id" | "name" | "email"> | null;
  feature?: { id: string; title: string } | null;
  childTasks?: Pick<Task, "id" | "title" | "status" | "priority" | "type">[];
  _count?: {
    comments: number;
    attachments: number;
    childTasks?: number;
  };
}

interface ColumnProps {
  status: TaskStatus;
  title: string;
  tasks: ColumnTask[];
  onTaskClick?: (task: ColumnTask) => void;
  projectLinked?: boolean;
  userHasGitHub?: boolean;
  isDragging?: boolean;
}

const columnConfig = {
  todo: {
    bg: "bg-slate-50 dark:bg-slate-900/50",
    headerBg: "bg-slate-100 dark:bg-slate-900",
    icon: Circle,
    iconColor: "text-slate-600 dark:text-slate-400",
    accentBorder: "border-l-slate-400 dark:border-l-slate-500",
    dropHighlight: "ring-slate-400 border-slate-400 bg-slate-100/80 dark:bg-slate-800/80",
  },
  progress: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    headerBg: "bg-blue-100 dark:bg-blue-900/40",
    icon: Clock,
    iconColor: "text-blue-600 dark:text-blue-400",
    accentBorder: "border-l-blue-500 dark:border-l-blue-400",
    dropHighlight: "ring-blue-400 border-blue-400 bg-blue-100/80 dark:bg-blue-900/60",
  },
  review: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    headerBg: "bg-amber-100 dark:bg-amber-900/40",
    icon: Eye,
    iconColor: "text-amber-600 dark:text-amber-400",
    accentBorder: "border-l-amber-500 dark:border-l-amber-400",
    dropHighlight: "ring-amber-400 border-amber-400 bg-amber-100/80 dark:bg-amber-900/60",
  },
  done: {
    bg: "bg-green-50 dark:bg-green-900/20",
    headerBg: "bg-green-100 dark:bg-green-900/40",
    icon: CheckCircle2,
    iconColor: "text-green-600 dark:text-green-400",
    accentBorder: "border-l-green-500 dark:border-l-green-400",
    dropHighlight: "ring-green-400 border-green-400 bg-green-100/80 dark:bg-green-900/60",
  },
};

export const Column = memo(function Column({ status, title, tasks, onTaskClick, projectLinked = false, userHasGitHub = false, isDragging = false }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = columnConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="flex-1 min-w-[300px] max-w-[400px]">
      <div
        className={`
          rounded-lg border-2 h-full flex flex-col
          transition-all duration-150 ease-out
          ${config.bg}
          ${isOver
            ? `ring-2 shadow-xl scale-[1.02] ${config.dropHighlight}`
            : isDragging
              ? "border-dashed border-border shadow-sm"
              : "border-transparent shadow-sm"
          }
        `}
      >
        {/* Column Header */}
        <div className={`${config.headerBg} rounded-t-lg px-4 py-3 border-b border-l-4 ${config.accentBorder}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 ${config.iconColor}`} />
              <h3 className="font-semibold text-sm tracking-wide">
                {title}
              </h3>
            </div>
            <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
              {tasks.length}
            </Badge>
          </div>
        </div>

        {/* Tasks Container */}
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            ref={setNodeRef}
            className={`
              flex-1 p-3 min-h-[300px] rounded-b-lg
              transition-all duration-150
              ${isOver ? "bg-primary/5" : ""}
            `}
          >
            {tasks.length === 0 ? (
              <div className={`
                flex items-center justify-center h-32 text-muted-foreground text-sm
                ${isDragging ? "border-2 border-dashed border-primary/30 rounded-lg" : ""}
              `}>
                <p className="text-center">
                  {isDragging ? (
                    <span className="text-primary/60 font-medium">Drop here</span>
                  ) : (
                    <>
                      No tickets yet
                      <br />
                      <span className="text-xs">Drag tickets here</span>
                    </>
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
    </div>
  );
});
