"use client";

import { Task, User, TaskPriority, TaskType } from "@prisma/client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { memo } from "react";
import { BookOpen, CheckSquare, Bug, MessageSquare, Paperclip, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

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
  userHasGitHub?: boolean;
  isDragging?: boolean;
  isOverlay?: boolean;
}

const priorityConfig: Record<TaskPriority, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
  low: { variant: "secondary", className: "bg-blue-100 text-blue-800 hover:bg-blue-100/80" },
  medium: { variant: "secondary", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80" },
  high: { variant: "destructive", className: "bg-orange-100 text-orange-800 hover:bg-orange-100/80 border-orange-200" },
  critical: { variant: "destructive", className: "" },
};

const typeConfig: Record<TaskType, { icon: any, label: string, className: string }> = {
  story: { icon: BookOpen, label: "Story", className: "text-purple-600" },
  task: { icon: CheckSquare, label: "Task", className: "text-blue-600" },
  bug: { icon: Bug, label: "Bug", className: "text-red-600" },
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
  const priorityInfo = priorityConfig[task.priority];

  // The actual card being dragged becomes a placeholder
  if (isSelfDragging) {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <div className="h-[100px] w-full rounded-xl border-2 border-dashed border-primary/20 bg-primary/5" />
      </div>
    );
  }

  return (
    <div ref={isOverlay ? undefined : setNodeRef} style={isOverlay ? undefined : style} {...(isOverlay ? {} : attributes)} {...(isOverlay ? {} : listeners)}>
      <Card
        className={cn(
          "group relative mb-3 cursor-grab overflow-hidden border transition-all duration-200 active:cursor-grabbing hover:shadow-md",
          !isDragging && "hover:border-primary/50",
          isOverlay && "rotate-2 scale-105 shadow-xl ring-1 ring-primary/20",
          // Priority borders for quick visual scanning
          task.priority === 'critical' && "border-l-4 border-l-destructive",
          task.priority === 'high' && "border-l-4 border-l-orange-500",
        )}
        onClick={handleClick}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground w-full">
              <TypeIcon className={cn("h-3.5 w-3.5", typeConfig[task.type].className)} />
              <span className="uppercase tracking-wider text-[10px]">{task.type}</span>
              {task.storyPoints !== null && task.storyPoints > 0 && (
                <Badge variant="outline" className="ml-auto h-5 px-1.5 text-[10px] font-normal text-muted-foreground">
                  {task.storyPoints} pts
                </Badge>
              )}
            </div>
          </div>

          <p className="line-clamp-2 text-sm font-medium leading-tight mb-3 group-hover:text-primary transition-colors">
            {task.title}
          </p>

          < div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(task._count?.comments || 0) > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>{task._count?.comments}</span>
                </div>
              )}
              {(task._count?.attachments || 0) > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Paperclip className="h-3 w-3" />
                  <span>{task._count?.attachments}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={priorityInfo.variant} className={cn("h-5 px-1.5 text-[10px] font-medium rounded-md", priorityInfo.className)}>
                {task.priority}
              </Badge>

              {task.assignee && (
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-background">
                  <span className="text-[10px] font-medium text-primary">
                    {(task.assignee.name?.[0] || task.assignee.email[0]).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
