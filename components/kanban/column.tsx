"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task, TaskStatus, User } from "@prisma/client";
import { TaskCard } from "./task-card";
import { memo } from "react";

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

const columnColors = {
  todo: "bg-gray-100",
  progress: "bg-blue-50",
  review: "bg-yellow-50",
  done: "bg-green-50",
};

export const Column = memo(function Column({ status, title, tasks, onTaskClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex-1 min-w-[280px]">
      <div
        className={`
          rounded-lg p-4 transition-all duration-200 ease-out
          ${columnColors[status]}
          ${isOver ? "ring-2 ring-primary shadow-lg scale-[1.02] bg-opacity-70" : ""}
        `}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide">
            {title}
          </h3>
          <span className="text-xs bg-white px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            ref={setNodeRef}
            className={`
              space-y-2 min-h-[200px] rounded-md
              transition-all duration-200
              ${isOver ? "bg-primary/5 border-2 border-dashed border-primary" : ""}
            `}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onTaskClick ? () => onTaskClick(task) : undefined}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
});
