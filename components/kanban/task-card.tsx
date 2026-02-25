"use client";

import { Task, User, TaskPriority, TaskType } from "@prisma/client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import {
  BookOpen,
  CheckSquare,
  Bug,
  MessageSquare,
  Paperclip,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Plus,
  Loader2,
  Eye,
} from "lucide-react";
import { getRoleColor } from "@/lib/utils/role-colors";
import { updateTaskStatus, createSubtask } from "@/server/actions/tasks";
import { useRouter } from "next/navigation";

interface TaskCardProps {
  task: Omit<Task, "githubIssueId"> & {
    githubIssueId: string | null;
    assignee: Pick<User, "id" | "name" | "email"> | null;
    reviewer?: Pick<User, "id" | "name" | "email"> | null;
    parentTask?: { id: string; title: string } | null;
    childTasks?: Pick<Task, "id" | "title" | "status" | "priority" | "type">[];
    _count?: {
      comments: number;
      attachments: number;
      childTasks?: number;
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

const typeConfig: Record<string, { icon: typeof BookOpen; label: string; color: string }> = {
  story: { icon: BookOpen, label: "Story", color: "text-purple-600 dark:text-purple-400" },
  task: { icon: CheckSquare, label: "Task", color: "text-blue-600 dark:text-blue-400" },
  bug: { icon: Bug, label: "Bug", color: "text-red-600 dark:text-red-400" },
  subtask: { icon: CheckSquare, label: "Subtask", color: "text-slate-600 dark:text-slate-400" },
};

export function TaskCard({ task, onClick, isDragging = false, isOverlay = false }: TaskCardProps) {
  const router = useRouter();

  const [subtasksExpanded, setSubtasksExpanded] = useState(false);
  const [togglingSubtask, setTogglingSubtask] = useState<string | null>(null);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtasks, setSubtasks] = useState<Pick<Task, "id" | "title" | "status" | "priority" | "type">[]>(
    task.childTasks || []
  );

  // Re-sync subtasks from props when the parent re-renders with fresh data
  // (e.g. after router.refresh() triggered by modal or another card)
  useEffect(() => {
    setSubtasks(task.childTasks || []);
  }, [task.childTasks]);

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

  const TypeIcon = (typeConfig[task.type] || typeConfig.task).icon;
  const priorityStyle = priorityConfig[task.priority];
  const roleStyle = task.requiredRole ? getRoleColor(task.requiredRole) : null;

  const totalSubtasks = subtasks.length;
  const doneSubtasks = subtasks.filter((st) => st.status === "done").length;
  const subtaskPct = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0;

  const handleToggleSubtaskStatus = async (
    e: React.MouseEvent,
    subtaskId: string,
    currentStatus: string
  ) => {
    e.stopPropagation();
    setTogglingSubtask(subtaskId);
    try {
      const newStatus = currentStatus === "done" ? "todo" : "done";
      await updateTaskStatus(subtaskId, newStatus as any);
      setSubtasks((prev) =>
        prev.map((st) =>
          st.id === subtaskId ? { ...st, status: newStatus as any } : st
        )
      );
      // No router.refresh() — optimistic update is instant
    } catch (err) {
      console.error("Failed to toggle subtask status:", err);
    } finally {
      setTogglingSubtask(null);
    }
  };

  const handleAddSubtask = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      setShowAddSubtask(false);
      setNewSubtaskTitle("");
      return;
    }
    if (e.key === "Enter" && newSubtaskTitle.trim()) {
      e.stopPropagation();
      setIsAddingSubtask(true);
      try {
        const created = await createSubtask(task.id, { title: newSubtaskTitle.trim() });
        setSubtasks((prev) => [
          ...prev,
          {
            id: created.id,
            title: created.title,
            status: created.status,
            priority: created.priority,
            type: created.type,
          },
        ]);
        setNewSubtaskTitle("");
        setShowAddSubtask(false);
        // No router.refresh() — optimistic update is instant
      } catch (err) {
        console.error("Failed to create subtask:", err);
      } finally {
        setIsAddingSubtask(false);
      }
    }
  };

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
          {/* Story Badge */}
          {task.parentTask && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <BookOpen className="h-3 w-3" />
              <span className="truncate">{task.parentTask.title}</span>
            </div>
          )}

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

          {/* Expandable Subtask Section */}
          {totalSubtasks > 0 && (
            <div
              className="rounded-md border bg-muted/30 px-2 py-1.5"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Subtask Header (always visible) */}
              <button
                type="button"
                className="flex items-center gap-1.5 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSubtasksExpanded((prev) => !prev);
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {subtasksExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                )}
                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${subtaskPct}%` }}
                  />
                </div>
                <span>
                  {doneSubtasks}/{totalSubtasks}
                </span>
              </button>

              {/* Expanded Subtask List */}
              {subtasksExpanded && (
                <div
                  className="mt-1.5 space-y-1"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center gap-1.5 text-xs group"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="shrink-0 hover:scale-110 transition-transform"
                        disabled={togglingSubtask === st.id}
                        onClick={(e) => handleToggleSubtaskStatus(e, st.id, st.status)}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        {togglingSubtask === st.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        ) : st.status === "done" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                        )}
                      </button>
                      <span
                        className={`truncate ${st.status === "done"
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                          }`}
                      >
                        {st.title}
                      </span>
                    </div>
                  ))}

                  {/* Add Subtask */}
                  {showAddSubtask ? (
                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {isAddingSubtask ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <Input
                        autoFocus
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={handleAddSubtask}
                        onBlur={() => {
                          if (!newSubtaskTitle.trim()) {
                            setShowAddSubtask(false);
                            setNewSubtaskTitle("");
                          }
                        }}
                        placeholder="Subtask title..."
                        className="h-6 text-xs px-1.5 py-0"
                        disabled={isAddingSubtask}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAddSubtask(true);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add subtask</span>
                    </button>
                  )}
                </div>
              )}
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
            <div className="flex items-center gap-2">
              {task.reviewer && task.status === "review" && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 text-amber-500" />
                  <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <span className="text-[10px] font-medium text-amber-600">
                      {(task.reviewer.name?.charAt(0) || task.reviewer.email.charAt(0)).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
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
        </div>
      </Card>
    </div>
  );
}
