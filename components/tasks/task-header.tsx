import { Task, TaskType, TaskPriority } from "@prisma/client";
import { CheckSquare, Bug, BookOpen } from "lucide-react";

interface TaskHeaderProps {
  task: Task;
}

export function TaskHeader({ task }: TaskHeaderProps) {
  const typeIcons: Record<string, typeof CheckSquare> = {
    task: CheckSquare,
    bug: Bug,
    story: BookOpen,
    subtask: CheckSquare,
  };

  const priorityColors = {
    low: "bg-gray-100 text-gray-800 border-gray-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    high: "bg-orange-100 text-orange-800 border-orange-300",
    critical: "bg-red-100 text-red-800 border-red-300",
  };

  const Icon = typeIcons[task.type];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground uppercase">
          {task.type}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
            priorityColors[task.priority]
          }`}
        >
          {task.priority}
        </span>
      </div>
      <h2 className="text-2xl font-bold">{task.title}</h2>
      {task.description && (
        <p className="text-muted-foreground whitespace-pre-wrap">
          {task.description}
        </p>
      )}
    </div>
  );
}
