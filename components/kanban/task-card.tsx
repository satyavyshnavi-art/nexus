"use client";

import { Task, User, TaskPriority, TaskType } from "@prisma/client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";

interface TaskCardProps {
  task: Task & {
    assignee: Pick<User, "id" | "name" | "email"> | null;
    _count?: {
      comments: number;
      attachments: number;
    };
  };
  onClick?: () => void;
}

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const typeIcons = {
  story: "📖",
  task: "✓",
  bug: "🐛",
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger onClick if not dragging
    if (!isDragging && onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className="p-3 mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
        onClick={handleClick}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium line-clamp-2">
              {typeIcons[task.type]} {task.title}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                priorityColors[task.priority]
              }`}
            >
              {task.priority}
            </span>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex gap-2">
              {task._count && task._count.comments > 0 && (
                <span>💬 {task._count.comments}</span>
              )}
              {task._count && task._count.attachments > 0 && (
                <span>📎 {task._count.attachments}</span>
              )}
              {task.storyPoints && <span>📊 {task.storyPoints}pt</span>}
            </div>
            {task.assignee && (
              <span className="bg-secondary px-2 py-1 rounded">
                {task.assignee.name?.split(" ")[0] || task.assignee.email}
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
