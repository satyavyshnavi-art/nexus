"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addTaskToFeature } from "@/server/actions/features";
import { toast } from "@/lib/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { TaskPriority, TaskType } from "@prisma/client";

const ROLES = [
  "UI",
  "Backend",
  "QA",
  "DevOps",
  "Full-Stack",
  "Design",
  "Data",
  "Mobile",
] as const;

interface AddTaskToFeatureDialogProps {
  featureId: string;
  projectMembers: { id: string; name: string | null; email: string }[];
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function AddTaskToFeatureDialog({
  featureId,
  projectMembers,
  trigger,
  onSuccess,
}: AddTaskToFeatureDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>(TaskType.task);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.medium);
  const [requiredRole, setRequiredRole] = useState<string>("");
  const [storyPoints, setStoryPoints] = useState<number>(0);
  const [assigneeId, setAssigneeId] = useState<string>("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType(TaskType.task);
    setPriority(TaskPriority.medium);
    setRequiredRole("");
    setStoryPoints(0);
    setAssigneeId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addTaskToFeature(featureId, {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        requiredRole: requiredRole && requiredRole !== "none" ? requiredRole : undefined,
        storyPoints: storyPoints > 0 ? storyPoints : undefined,
        assigneeId: assigneeId && assigneeId !== "none" ? assigneeId : undefined,
      });

      toast({
        title: "Task added",
        description: `"${title.trim()}" has been added to the feature`,
        variant: "success",
      });

      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Task to Feature</DialogTitle>
          <DialogDescription>
            Create a new task under this feature. Tasks can later be assigned to
            sprints for execution.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title" required>
              Title
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Implement login API endpoint"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task details and acceptance criteria..."
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {/* Type & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(val) => setType(val as TaskType)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(val) => setPriority(val as TaskPriority)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      Critical
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Required Role */}
          <div className="space-y-2">
            <Label>Required Role</Label>
            <Select
              value={requiredRole}
              onValueChange={setRequiredRole}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific role</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Story Points & Assignee Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-story-points">Story Points</Label>
              <Input
                id="task-story-points"
                type="number"
                min="0"
                max="20"
                value={storyPoints}
                onChange={(e) =>
                  setStoryPoints(parseInt(e.target.value) || 0)
                }
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={assigneeId}
                onValueChange={setAssigneeId}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {projectMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Task"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
