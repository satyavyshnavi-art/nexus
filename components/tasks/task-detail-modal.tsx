"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Task, User, TaskStatus, TaskPriority } from "@prisma/client";
import { TaskHeader } from "./task-header";
import { TaskMetadata } from "./task-metadata";
import { AttachmentsList } from "./attachments-list";
import { CommentSection } from "./comment-section";
import { updateTask, updateTaskStatus, deleteTask, createSubtask, assignReviewer } from "@/server/actions/tasks";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Circle, Clock, Loader2, Save, Trash2, Tag, Plus, Eye } from "lucide-react";
import { getRoleColor } from "@/lib/utils/role-colors";

interface TaskWithDetails extends Omit<Task, "githubIssueId"> {
  githubIssueId: string | null;
  assignee: Pick<User, "id" | "name" | "email"> | null;
  reviewer?: Pick<User, "id" | "name" | "email"> | null;
  childTasks?: Pick<Task, "id" | "title" | "status" | "priority" | "type">[];
  _count?: {
    comments: number;
    attachments: number;
    childTasks?: number;
  };
}

interface TaskDetailModalProps {
  task: TaskWithDetails;
  createdBy?: Pick<User, "id" | "name" | "email"> | null;
  projectMembers: Pick<User, "id" | "name" | "email">[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: "todo", label: "To Do", color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800" },
  { value: "progress", label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" },
  { value: "review", label: "Review", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" },
  { value: "done", label: "Done", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export function TaskDetailModal({
  task,
  createdBy,
  projectMembers,
  open,
  onOpenChange,
}: TaskDetailModalProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [storyPoints, setStoryPoints] = useState(task.storyPoints || 0);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || "unassigned");
  const [reviewerId, setReviewerId] = useState(task.reviewerId || "none");
  const [status, setStatus] = useState(task.status);
  const [hasChanges, setHasChanges] = useState(false);
  const [subtasks, setSubtasks] = useState(task.childTasks || []);
  const [togglingSubtask, setTogglingSubtask] = useState<string | null>(null);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Re-sync all local state when the task prop changes (e.g. after router.refresh)
  // Skip if currently saving to avoid resetting state mid-operation
  useEffect(() => {
    if (isSaving) return;
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setStoryPoints(task.storyPoints || 0);
    setAssigneeId(task.assigneeId || "unassigned");
    setReviewerId(task.reviewerId || "none");
    setStatus(task.status);
    setSubtasks(task.childTasks || []);
    setHasChanges(false);
  }, [task.id, task.updatedAt]);

  function markChanged() {
    setHasChanges(true);
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update fields
      await updateTask(task.id, {
        title,
        description: description || undefined,
        priority,
        storyPoints: storyPoints || undefined,
        assigneeId: assigneeId === "unassigned" ? undefined : assigneeId,
      });

      // Update status if changed
      if (status !== task.status) {
        await updateTaskStatus(task.id, status);
      }

      // Update reviewer if changed — null clears the reviewer, string sets it
      const newReviewerValue = reviewerId === "none" ? null : reviewerId;
      const oldReviewerValue = task.reviewerId ?? null;
      if (newReviewerValue !== oldReviewerValue) {
        await assignReviewer(task.id, newReviewerValue);
      }

      toast.success("Ticket updated", { description: "Changes saved successfully" });
      setHasChanges(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to save", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      toast.success("Ticket deleted", { description: "The ticket has been deleted successfully" });
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSubtaskToggle = async (subtaskId: string, currentStatus: TaskStatus) => {
    const newStatus: TaskStatus = currentStatus === "done" ? "todo" : "done";
    setTogglingSubtask(subtaskId);

    // Optimistic update — show the new status immediately
    setSubtasks((prev) =>
      prev.map((st) => (st.id === subtaskId ? { ...st, status: newStatus } : st))
    );

    try {
      await updateTaskStatus(subtaskId, newStatus);
      toast.success(newStatus === "done" ? "Subtask completed" : "Subtask reopened");
      router.refresh(); // Sync board with updated subtask state
    } catch (error) {
      // Revert on failure
      setSubtasks((prev) =>
        prev.map((st) => (st.id === subtaskId ? { ...st, status: currentStatus } : st))
      );
      toast.error("Failed to update subtask");
    } finally {
      setTogglingSubtask(null);
    }
  };

  const handleAddSubtask = async () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed || isAddingSubtask) return;

    setIsAddingSubtask(true);
    try {
      const created = await createSubtask(task.id, { title: trimmed });
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
      toast.success(`Subtask "${trimmed}" created`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to create subtask", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsAddingSubtask(false);
    }
  };

  // Calculate progress for parent tasks with subtasks
  const calculateProgress = () => {
    if (subtasks.length === 0) return null;
    const total = subtasks.length;
    const completed = subtasks.filter(t => t.status === "done").length;
    const inProgress = subtasks.filter(t => t.status === "progress").length;
    const percentage = Math.round((completed / total) * 100);
    return { total, completed, inProgress, percentage };
  };

  const progress = calculateProgress();
  const currentStatusStyle = statusOptions.find(s => s.value === status);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Header with Save / Delete */}
            <div className="flex items-center justify-between">
              <DialogHeader className="flex-1">
                <DialogTitle className="sr-only">Task Details</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Inline editable fields */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <Input
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); markChanged(); }}
                  className="text-lg font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                  placeholder="Task title"
                />
              </div>

              {/* Status + Priority row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value as TaskStatus); markChanged(); }}
                    className={`w-full px-3 py-2 rounded-md text-sm font-medium border cursor-pointer ${currentStatusStyle?.color || ""}`}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <select
                    value={priority}
                    onChange={(e) => { setPriority(e.target.value as TaskPriority); markChanged(); }}
                    className="w-full px-3 py-2 rounded-md text-sm border cursor-pointer"
                  >
                    {priorityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Story Points + Assignee row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Story Points</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={storyPoints}
                    onChange={(e) => { setStoryPoints(parseInt(e.target.value) || 0); markChanged(); }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Assignee</Label>
                  <select
                    value={assigneeId}
                    onChange={(e) => { setAssigneeId(e.target.value); markChanged(); }}
                    className="w-full px-3 py-2 rounded-md text-sm border cursor-pointer"
                  >
                    <option value="unassigned">Unassigned</option>
                    {projectMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3 text-amber-500" />
                    Reviewer
                  </Label>
                  <select
                    value={reviewerId}
                    onChange={(e) => { setReviewerId(e.target.value); markChanged(); }}
                    className="w-full px-3 py-2 rounded-md text-sm border cursor-pointer"
                  >
                    <option value="none">No Reviewer</option>
                    {projectMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); markChanged(); }}
                  placeholder="Add a description..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Role & Labels */}
            {(task.requiredRole || (task.labels && task.labels.length > 0)) && (
              <div className="flex items-center gap-3 flex-wrap">
                {task.requiredRole && (() => {
                  const roleStyle = getRoleColor(task.requiredRole);
                  return (
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium border ${roleStyle.border} ${roleStyle.bg} ${roleStyle.text}`}
                    >
                      {task.requiredRole}
                    </Badge>
                  );
                })()}
                {task.labels && task.labels.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    {task.labels.map((label) => (
                      <span
                        key={label}
                        className="inline-block px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subtasks Section */}
            <div className={progress ? "bg-purple-50/50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-3" : "space-y-3"}>
              {/* Progress bar (only when subtasks exist) */}
              {progress && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300">Subtask Progress</h3>
                    <Badge variant="outline" className="bg-background">
                      {progress.completed} / {progress.total} completed
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full bg-purple-100 dark:bg-purple-900/30 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-500 ease-out flex items-center justify-end pr-1"
                        style={{ width: `${progress.percentage}%` }}
                      >
                        {progress.percentage > 15 && (
                          <span className="text-[10px] font-bold text-white">
                            {progress.percentage}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-purple-700 dark:text-purple-400">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{progress.completed} Done</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{progress.inProgress} In Progress</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Circle className="h-3 w-3" />
                        <span>{progress.total - progress.completed - progress.inProgress} Todo</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <h4 className="text-xs font-medium text-purple-900 dark:text-purple-300 uppercase">Subtasks</h4>
                    <div className="space-y-1">
                      {subtasks.map((subtask) => (
                        <button
                          key={subtask.id}
                          type="button"
                          onClick={() => handleSubtaskToggle(subtask.id, subtask.status)}
                          disabled={togglingSubtask === subtask.id}
                          className="flex items-center gap-2 p-2 w-full text-left bg-background rounded border border-purple-100 dark:border-purple-800/50 hover:border-purple-300 dark:hover:border-purple-600 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <div className={`flex-shrink-0 ${subtask.status === "done" ? "text-green-600 dark:text-green-500"
                            : subtask.status === "progress" ? "text-blue-600 dark:text-blue-500"
                              : "text-gray-400 dark:text-gray-500"
                            }`}>
                            {togglingSubtask === subtask.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : subtask.status === "done" ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : subtask.status === "progress" ? (
                              <Clock className="h-4 w-4" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </div>
                          <span className={`text-sm flex-1 ${subtask.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {subtask.title}
                          </span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {subtask.status === "progress" ? "In Progress" : subtask.status === "todo" ? "To Do" : subtask.status === "review" ? "Review" : "Done"}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Add Subtask - single consolidated UI */}
              {showAddSubtask ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); handleAddSubtask(); }
                      if (e.key === "Escape") { setShowAddSubtask(false); setNewSubtaskTitle(""); }
                    }}
                    placeholder="Subtask title..."
                    className="text-sm h-8"
                    autoFocus
                    disabled={isAddingSubtask}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={handleAddSubtask}
                    disabled={isAddingSubtask || !newSubtaskTitle.trim()}
                  >
                    {isAddingSubtask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddSubtask(true)}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${progress
                    ? "text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Subtask
                </button>
              )}
            </div>

            <TaskMetadata task={task} createdBy={createdBy} />
            <AttachmentsList taskId={task.id} />
            <CommentSection taskId={task.id} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog — z-50 to render above the task Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The ticket and all its comments,
              attachments, and subtasks will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>);
}
