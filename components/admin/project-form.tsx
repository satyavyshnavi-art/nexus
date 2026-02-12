"use client";

import { useState } from "react";
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
import { createProject } from "@/server/actions/projects";
import { toast } from "@/lib/hooks/use-toast";

interface Vertical {
  id: string;
  name: string;
}

interface ProjectFormProps {
  verticals: Vertical[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProjectForm({
  verticals,
  onSuccess,
  onCancel,
}: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    verticalId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.verticalId) {
      toast({
        title: "Validation Error",
        description: "Name and vertical are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createProject({
        name: formData.name,
        description: formData.description || undefined,
        verticalId: formData.verticalId,
      });

      toast({
        title: "Project created",
        description: `${formData.name} has been created successfully`,
        variant: "success",
      });

      setFormData({ name: "", description: "", verticalId: "" });
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" required>
          Project Name
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          placeholder="Mobile App Development"
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
          placeholder="Project description..."
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vertical" required>
          Vertical
        </Label>
        <Select
          value={formData.verticalId}
          onValueChange={(value) =>
            setFormData({ ...formData, verticalId: value })
          }
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a vertical" />
          </SelectTrigger>
          <SelectContent>
            {verticals.map((vertical) => (
              <SelectItem key={vertical.id} value={vertical.id}>
                {vertical.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
          {isSubmitting ? "Creating..." : "Create Project"}
        </Button>
      </div>
    </form>
  );
}
