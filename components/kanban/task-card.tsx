"use client";

import { Task, User, TaskPriority, TaskType } from "@prisma/client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { memo } from "react";
import { BookOpen, CheckSquare, Bug, MessageSquare, Paperclip, TrendingUp } from "lucide-react";
import { getRoleColor } from "@/lib/utils/role-colors";

interface TaskCardProps {
  task: Omit<Task, "githubIssueId"> & {
    githubIssueId: string | null;
    assignee: Pick<User, "id" | "name" | "email"> | null;
    _count?: {
      comments: number;
      attachments: number;
    };
  };
  onClick?: () => void;
  projectLinked?: boolean;
  userHasGitHub?: boolean;
  isDragging?: boolean;
  isOverlay?: boolean;
}

const priorityConfig = {
  low: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-500/20" },
  medium: { bg: "bg-yellow-500/10", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-500/20" },
  high: { bg: "bg-orange-500/10", text: "text-orange-700 dark:text-orange-400", border: "border-orange-500/20" },
  critical: { bg: "bg-red-500/10", text: "text-red-700 dark:text-red-400", border: "border-red-500/20" },
};

const typeConfig = {
  story: { icon: BookOpen, label: "Story", color: "text-purple-600 dark:text-purple-400" },
  task: { icon: CheckSquare, label: "Task", color: "text-blue-600 dark:text-blue-400" },
  bug: { icon: Bug, label: "Bug", color: "text-red-600 dark:text-red-400" },
};

export const TaskCard = memo(function TaskCard({ task, onClick, isDragging = false, isOverlay = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSelfDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isSelfDragging && onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  const TypeIcon = typeConfig[task.type].icon;
  const priorityStyle = priorityConfig[task.priority];
  const roleStyle = task.requiredRole ? getRoleColor(task.requiredRole) : null;

  // The actual card being dragged becomes a placeholder
  if (isSelfDragging) {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <div className="task-card p-4 mb-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 h-[100px]" />
      </div>
    );
  }

  return (
    <div ref={isOverlay ? undefined : setNodeRef} style={isOverlay ? undefined : style} {...(isOverlay ? {} : attributes)} {...(isOverlay ? {} : listeners)}>
      <Card
        className={`
          task-card p-4 mb-3
          cursor-grab active:cursor-grabbing
          transition-all duration-150 ease-out
          ${!isDragging ? "hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40" : ""}
          ${isOverlay ? "shadow-2xl ring-2 ring-primary/40 border-primary/30" : "shadow-sm"}
        `}
        onClick={handleClick}
      >
        <div className="space-y-3">
          {/* Header: Type Icon + Badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <TypeIcon className={`h-4 w-4 shrink-0 ${typeConfig[task.type].color}`} />
              <span className="text-sm font-semibold line-clamp-2 leading-tight">
                {task.title}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {roleStyle && (
                <Badge
                  variant="outline"
                  className={`text-[10px] font-medium border ${roleStyle.border} ${roleStyle.bg} ${roleStyle.text}`}
                >
                  {task.requiredRole}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={`text-xs font-medium border ${priorityStyle.border} ${priorityStyle.bg} ${priorityStyle.text}`}
              >
                {task.priority}
              </Badge>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.labels.map((label) => (
                <span
                  key={label}
                  className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Footer: Metadata + Assignee */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {task._count && task._count.comments > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{task._count.comments}</span>
                </div>
              )}
              {task._count && task._count.attachments > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span>{task._count.attachments}</span>
                </div>
              )}
              {task.storyPoints && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>{task.storyPoints}pt</span>
                </div>
              )}
            </div>
            {task.assignee && (
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {(task.assignee.name?.charAt(0) || task.assignee.email.charAt(0)).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
});
