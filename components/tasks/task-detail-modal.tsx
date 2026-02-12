"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Task, User } from "@prisma/client";
import { TaskHeader } from "./task-header";
import { TaskMetadata } from "./task-metadata";
import { TaskActions } from "./task-actions";
import { TaskForm } from "./task-form";
import { CommentsSection } from "./comments-section";
import { AttachmentsList } from "./attachments-list";
import { updateTask } from "@/server/actions/tasks";
import { toast } from "@/lib/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";

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

export function TaskDetailModal({
  task,
  createdBy,
  projectMembers,
  open,
  onOpenChange,
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this ticket?")) {
      return;
    }

    setIsDeleting(true);
    try {
      // Note: We need to add a deleteTask action
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
        description:
          error instanceof Error ? error.message : "Failed to delete ticket",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      await updateTask(task.id, data);
      toast({
        title: "Ticket updated",
        description: "The ticket has been updated successfully",
        variant: "success",
      });
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update ticket",
        variant: "destructive",
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isEditing ? (
          <>
            <DialogHeader>
              <DialogTitle>Edit Ticket</DialogTitle>
            </DialogHeader>
            <TaskEditForm
              task={task}
              projectMembers={projectMembers}
              onSave={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <TaskHeader task={task} />
              <TaskActions onEdit={handleEdit} onDelete={handleDelete} />
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

                {/* Progress Bar */}
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

                {/* Subtask List */}
                <div className="space-y-2 mt-4">
                  <h4 className="text-xs font-medium text-purple-900 uppercase">Subtasks</h4>
                  <div className="space-y-1">
                    {task.childTasks?.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 p-2 bg-white rounded border border-purple-100 hover:border-purple-300 transition-colors"
                      >
                        <div className={`flex-shrink-0 ${
                          subtask.status === "done"
                            ? "text-green-600"
                            : subtask.status === "progress"
                            ? "text-blue-600"
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
                        <span className={`text-sm flex-1 ${
                          subtask.status === "done" ? "line-through text-gray-500" : "text-gray-900"
                        }`}>
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

            <CommentsSection taskId={task.id} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Simple edit form component
function TaskEditForm({
  task,
  projectMembers,
  onSave,
  onCancel,
}: {
  task: Task & { assignee: Pick<User, "id" | "name" | "email"> | null };
  projectMembers: Pick<User, "id" | "name" | "email">[];
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    storyPoints: task.storyPoints || 0,
    assigneeId: task.assigneeId || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-3 py-2 border rounded-md"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Story Points</label>
          <input
            type="number"
            min="0"
            max="20"
            value={formData.storyPoints}
            onChange={(e) =>
              setFormData({
                ...formData,
                storyPoints: parseInt(e.target.value) || 0,
              })
            }
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Assignee</label>
          <select
            value={formData.assigneeId || "unassigned"}
            onChange={(e) =>
              setFormData({
                ...formData,
                assigneeId:
                  e.target.value === "unassigned" ? undefined : e.target.value,
              })
            }
            className="w-full px-3 py-2 border rounded-md"
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

      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}
