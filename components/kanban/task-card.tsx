"use client";

import { Task, User, TaskPriority, TaskType } from "@prisma/client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { memo } from "react";
import { BookOpen, CheckSquare, Bug, MessageSquare, Paperclip, TrendingUp } from "lucide-react";
import { GitHubSyncButton } from "@/components/tasks/github-sync-button";

interface TaskCardProps {
  task: Task & {
    assignee: Pick<User, "id" | "name" | "email"> | null;
    _count?: {
      comments: number;
      attachments: number;
    };
  };
  onClick?: () => void;
  projectLinked?: boolean;
}

const priorityConfig = {
  low: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  medium: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  high: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  critical: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
};

const typeConfig = {
  story: {
    icon: BookOpen,
    label: "Story",
    color: "text-purple-600",
  },
  task: {
    icon: CheckSquare,
    label: "Task",
    color: "text-blue-600",
  },
  bug: {
    icon: Bug,
    label: "Bug",
    color: "text-red-600",
  },
};

export const TaskCard = memo(function TaskCard({ task, onClick, projectLinked = false }: TaskCardProps) {
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
    transition: transition || "transform 200ms cubic-bezier(0.25, 0.8, 0.25, 1)",
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    willChange: isDragging ? "transform" : "auto",
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger onClick if not dragging
    if (!isDragging && onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  const TypeIcon = typeConfig[task.type].icon;
  const priorityStyle = priorityConfig[task.priority];

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={`
          p-4 mb-3
          cursor-grab active:cursor-grabbing
          transition-all duration-200 ease-out
          hover:shadow-lg hover:-translate-y-1 hover:border-primary/50
          ${isDragging ? "shadow-2xl ring-2 ring-primary/30 scale-[1.02]" : "shadow-sm"}
        `}
        onClick={handleClick}
      >
        <div className="space-y-3">
          {/* Header: Type Icon + Priority Badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <TypeIcon className={`h-4 w-4 shrink-0 ${typeConfig[task.type].color}`} />
              <span className="text-sm font-semibold line-clamp-2 leading-tight">
                {task.title}
              </span>
            </div>
            <Badge
              variant="outline"
              className={`shrink-0 text-xs font-medium border ${priorityStyle.border} ${priorityStyle.bg} ${priorityStyle.text}`}
            >
              {task.priority}
            </Badge>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {task.description}
            </p>
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

          {/* GitHub Sync Button */}
          {projectLinked && (
            <div className="pt-2 border-t" onClick={(e) => e.stopPropagation()}>
              <GitHubSyncButton
                taskId={task.id}
                isSynced={!!task.githubIssueNumber}
                issueNumber={task.githubIssueNumber}
                issueUrl={task.githubUrl}
                projectLinked={projectLinked}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
});
