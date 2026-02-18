"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Task, User, TaskStatus, TaskPriority } from "@prisma/client";
import { TaskHeader } from "./task-header";
import { TaskMetadata } from "./task-metadata";
import { AttachmentsList } from "./attachments-list";
import { CommentSection } from "./comment-section";
import { updateTask, updateTaskStatus } from "@/server/actions/tasks";
import { toast } from "@/lib/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Circle, Clock, Loader2, Save, Trash2 } from "lucide-react";

interface TaskWithDetails extends Task {
  assignee: Pick<User, "id" | "name" | "email"> | null;
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
  { value: "todo", label: "To Do", color: "bg-gray-100 text-gray-700 border-gray-300" },
  { value: "progress", label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "review", label: "Review", color: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "done", label: "Done", color: "bg-green-100 text-green-700 border-green-300" },
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
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [storyPoints, setStoryPoints] = useState(task.storyPoints || 0);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || "unassigned");
  const [status, setStatus] = useState(task.status);
  const [hasChanges, setHasChanges] = useState(false);

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

      toast({
        title: "Ticket updated",
        description: "Changes saved successfully",
        variant: "success",
      });
      setHasChanges(false);
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    setIsDeleting(true);
    try {
      toast({
        title: "Ticket deleted",
        description: "The ticket has been deleted successfully",
        variant: "success",
      });
      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate progress for parent tasks with subtasks
  const calculateProgress = () => {
    if (!task.childTasks || task.childTasks.length === 0) return null;
    const total = task.childTasks.length;
    const completed = task.childTasks.filter(t => t.status === "done").length;
    const inProgress = task.childTasks.filter(t => t.status === "progress").length;
    const percentage = Math.round((completed / total) * 100);
    return { total, completed, inProgress, percentage };
  };

  const progress = calculateProgress();
  const currentStatusStyle = statusOptions.find(s => s.value === status);

  return (
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
                onClick={handleDelete}
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
            <div className="grid grid-cols-2 gap-4">
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

          {/* Progress Visualization for Parent Tasks */}
          {progress && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-purple-900">Subtask Progress</h3>
                <Badge variant="outline" className="bg-white">
                  {progress.completed} / {progress.total} completed
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="w-full bg-purple-100 rounded-full h-3 overflow-hidden">
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
                <div className="flex items-center gap-4 text-xs text-purple-700">
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
                <h4 className="text-xs font-medium text-purple-900 uppercase">Subtasks</h4>
                <div className="space-y-1">
                  {task.childTasks?.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 p-2 bg-white rounded border border-purple-100 hover:border-purple-300 transition-colors"
                    >
                      <div className={`flex-shrink-0 ${subtask.status === "done" ? "text-green-600"
                        : subtask.status === "progress" ? "text-blue-600"
                          : "text-gray-400"
                        }`}>
                        {subtask.status === "done" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : subtask.status === "progress" ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>
                      <span className={`text-sm flex-1 ${subtask.status === "done" ? "line-through text-gray-500" : "text-gray-900"}`}>
                        {subtask.title}
                      </span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {subtask.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <TaskMetadata task={task} createdBy={createdBy} />
          <AttachmentsList taskId={task.id} />
          <CommentSection taskId={task.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
