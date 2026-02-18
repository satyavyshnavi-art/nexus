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
import { Checkbox } from "@/components/ui/checkbox";
import { createProject } from "@/server/actions/projects";
import { toast } from "@/lib/hooks/use-toast";

interface Vertical {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface ProjectFormProps {
  verticals: Vertical[];
  users: User[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProjectForm({
  verticals,
  users,
  onSuccess,
  onCancel,
}: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    verticalId: "",
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

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
        initialMemberIds: selectedUserIds,
      });

      toast({
        title: "Project created",
        description: `${formData.name} has been created successfully`,
        variant: "success",
      });

      setFormData({ name: "", description: "", verticalId: "" });
      setSelectedUserIds([]);
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
        <Label htmlFor="name" className="text-sm font-medium">
          Project Name <span className="text-red-500">*</span>
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
        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
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
        <Label htmlFor="vertical" className="text-sm font-medium">
          Vertical <span className="text-red-500">*</span>
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

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Assign Members ({selectedUserIds.length} selected)
        </Label>
        <div className="border rounded-md max-h-48 overflow-y-auto p-2 space-y-2">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2 text-center">No users found.</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded">
                <Checkbox
                  id={`user-${user.id}`}
                  checked={selectedUserIds.includes(user.id)}
                  onCheckedChange={() => toggleUser(user.id)}
                  disabled={isSubmitting}
                />
                <Label
                  htmlFor={`user-${user.id}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {user.name || user.email} <span className="text-muted-foreground ml-1 text-xs">({user.email})</span>
                </Label>
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Selected members will be able to see and access this project immediately.
        </p>
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
