"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task, TaskStatus, User } from "@prisma/client";
import { TaskCard } from "./task-card";

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

export function Column({ status, title, tasks, onTaskClick }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex-1 min-w-[280px]">
      <div className={`rounded-lg ${columnColors[status]} p-4`}>
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
          <div ref={setNodeRef} className="space-y-2 min-h-[200px]">
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
}
