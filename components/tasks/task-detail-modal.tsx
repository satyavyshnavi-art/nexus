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

interface TaskDetailModalProps {
  task: Task & {
    assignee: Pick<User, "id" | "name" | "email"> | null;
  };
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
