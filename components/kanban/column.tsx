"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task, TaskStatus, User } from "@prisma/client";
import { TaskCard } from "./task-card";
import { Badge } from "@/components/ui/badge";
import { memo } from "react";
import { Circle, Clock, Eye, CheckCircle2 } from "lucide-react";

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
}

const columnConfig = {
  todo: {
    bg: "bg-slate-50",
    headerBg: "bg-slate-100",
    icon: Circle,
    iconColor: "text-slate-600",
    accentBorder: "border-l-slate-400",
  },
  progress: {
    bg: "bg-blue-50",
    headerBg: "bg-blue-100",
    icon: Clock,
    iconColor: "text-blue-600",
    accentBorder: "border-l-blue-500",
  },
  review: {
    bg: "bg-amber-50",
    headerBg: "bg-amber-100",
    icon: Eye,
    iconColor: "text-amber-600",
    accentBorder: "border-l-amber-500",
  },
  done: {
    bg: "bg-green-50",
    headerBg: "bg-green-100",
    icon: CheckCircle2,
    iconColor: "text-green-600",
    accentBorder: "border-l-green-500",
  },
};

export const Column = memo(function Column({ status, title, tasks, onTaskClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = columnConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="flex-1 min-w-[300px] max-w-[400px]">
      <div
        className={`
          rounded-lg border-2 border-transparent transition-all duration-200 ease-out h-full flex flex-col
          ${config.bg}
          ${isOver ? "ring-2 ring-primary/50 shadow-xl border-primary/30 scale-[1.01]" : "shadow-sm"}
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
              transition-all duration-200
              ${isOver ? "bg-primary/5 border-2 border-dashed border-primary/50" : ""}
            `}
          >
            {tasks.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                <p className="text-center">
                  No tickets yet
                  <br />
                  <span className="text-xs">Drag tickets here</span>
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={onTaskClick ? () => onTaskClick(task) : undefined}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
});
