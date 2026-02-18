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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-semibold">
          Project Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          placeholder="e.g., Mobile App Development"
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
          placeholder="Brief description of the project goals..."
          disabled={isSubmitting}
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vertical" className="text-sm font-medium">
          Vertical <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.verticalId}
          onValueChange={(value) =>
            setFormData({ ...formData, verticalId: value })
          }
          disabled={isSubmitting}
        >
          <SelectTrigger className="w-full">
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

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Assign Members</Label>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {selectedUserIds.length} selected
          </span>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="h-48 w-full bg-muted/20">
            <div className="p-3 space-y-1">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No other users found.
                </p>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => !isSubmitting && toggleUser(user.id)}
                  >
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={() => toggleUser(user.id)}
                      disabled={isSubmitting}
                    />
                    <div className="flex flex-col flex-1 leading-none gap-1">
                      <Label
                        htmlFor={`user-${user.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {user.name || "Unknown User"}
                      </Label>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Selected members will be able to view and contribute to this project.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
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
          {isSubmitting ? "Creating..." : "Create Project"}
        </Button>
      </div>
    </form>
  );
}
