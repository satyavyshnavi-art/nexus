"use client";

import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TaskTypeSelector } from "./task-type-selector";
import { PrioritySelector } from "./priority-selector";
import { AssigneeSelector } from "./assignee-selector";
import { createTask } from "@/server/actions/tasks";
import { uploadAttachment } from "@/server/actions/attachments";
import { syncTaskToGitHub } from "@/server/actions/github-sync";
import { toast } from "@/lib/hooks/use-toast";
import { TaskType, TaskPriority } from "@prisma/client";
import { GitBranch, ImagePlus, X } from "lucide-react";

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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid file", description: `${file.name} is not an image`, variant: "destructive" });
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 10MB limit`, variant: "destructive" });
        continue;
      }
      validFiles.push(file);
    }

    setSelectedImages((prev) => [...prev, ...validFiles]);
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

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
      const hasImages = selectedImages.length > 0;

      // If images + pushToGitHub: suppress auto-sync so we can upload first
      const task = await createTask({
        sprintId,
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        storyPoints: formData.storyPoints || undefined,
        assigneeId: formData.assigneeId,
        pushToGitHub: hasImages ? false : pushToGitHub,
      });

      // Upload images if any
      if (hasImages) {
        for (const file of selectedImages) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("taskId", task.id);
          await uploadAttachment(fd);
        }

        // Now sync to GitHub with screenshots included
        if (pushToGitHub) {
          await syncTaskToGitHub(task.id);
        }
      }

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
      setSelectedImages([]);

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" required>
          Title
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          placeholder="Add authentication to login page"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Detailed description of the ticket..."
          disabled={isSubmitting}
          rows={4}
        />
      </div>

      {/* Screenshots */}
      <div className="space-y-2">
        <Label>Screenshots</Label>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
          >
            <ImagePlus className="h-4 w-4" />
            Add Screenshot
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          {selectedImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedImages.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted text-sm"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-6 w-6 rounded object-cover"
                  />
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <TaskTypeSelector
          value={formData.type}
          onChange={(type) => setFormData({ ...formData, type })}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <PrioritySelector
          value={formData.priority}
          onChange={(priority) => setFormData({ ...formData, priority })}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="storyPoints">Story Points</Label>
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
          <Label htmlFor="assignee">Assignee</Label>
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
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
          <input
            type="checkbox"
            id="pushToGitHub"
            checked={pushToGitHub}
            onChange={(e) => setPushToGitHub(e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
          />
          <label
            htmlFor="pushToGitHub"
            className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none"
          >
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            Push to GitHub
          </label>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
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
          {isSubmitting
            ? selectedImages.length > 0
              ? "Creating & Uploading..."
              : "Creating..."
            : "Create Ticket"}
        </Button>
      </div>
    </form>
  );
}
