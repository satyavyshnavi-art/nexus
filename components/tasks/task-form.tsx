"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskTypeSelector } from "./task-type-selector";
import { PrioritySelector } from "./priority-selector";
import { AssigneeSelector } from "./assignee-selector";
import { createTask } from "@/server/actions/tasks";
import { toast } from "@/lib/hooks/use-toast";
import { TaskType, TaskPriority } from "@prisma/client";
import { GitBranch, Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface TaskFormProps {
  sprintId: string;
  projectMembers: User[];
  onSuccess?: () => void;
  onCancel?: () => void;
  projectLinked?: boolean;
}

export function TaskForm({
  sprintId,
  projectMembers,
  onSuccess,
  onCancel,
  projectLinked = false,
}: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pushToGitHub, setPushToGitHub] = useState(projectLinked);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: TaskType;
    priority: TaskPriority;
    storyPoints: number;
    assigneeId: string | undefined;
  }>({
    title: "",
    description: "",
    type: TaskType.task,
    priority: TaskPriority.medium,
    storyPoints: 0,
    assigneeId: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createTask({
        sprintId,
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        storyPoints: formData.storyPoints || undefined,
        assigneeId: formData.assigneeId,
        pushToGitHub,
      });

      toast({
        title: "Ticket created",
        description: `${formData.title} has been created successfully${pushToGitHub ? " and pushed to GitHub" : ""}`,
        variant: "success",
      });

      setFormData({
        title: "",
        description: "",
        type: TaskType.task,
        priority: TaskPriority.medium,
        storyPoints: 0,
        assigneeId: undefined,
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create ticket",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-semibold">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="e.g., Implement authentication middleware"
            disabled={isSubmitting}
            className="text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Detailed description of the ticket..."
            disabled={isSubmitting}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Type</Label>
            <TaskTypeSelector
              value={formData.type}
              onChange={(type) => setFormData({ ...formData, type })}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Priority</Label>
            <PrioritySelector
              value={formData.priority}
              onChange={(priority) => setFormData({ ...formData, priority })}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="storyPoints" className="text-sm font-medium">Story Points</Label>
            <Input
              id="storyPoints"
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
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee" className="text-sm font-medium">Assignee</Label>
            <AssigneeSelector
              members={projectMembers}
              value={formData.assigneeId}
              onChange={(assigneeId) =>
                setFormData({ ...formData, assigneeId })
              }
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Push to GitHub checkbox */}
        {projectLinked && (
          <div className="flex items-center space-x-2 rounded-lg border p-4 bg-muted/40">
            <Checkbox
              id="pushToGitHub"
              checked={pushToGitHub}
              onCheckedChange={(checked) => setPushToGitHub(!!checked)}
              disabled={isSubmitting}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="pushToGitHub"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                Sync to GitHub
              </label>
              <p className="text-xs text-muted-foreground">
                This ticket will be created as a GitHub issue.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t font-medium">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Creating..." : "Create Ticket"}
        </Button>
      </div>
    </form>
  );
}
