"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSprint } from "@/server/actions/sprints";
import { toast } from "@/lib/hooks/use-toast";
import { sprintSchema } from "@/lib/validation/schemas";
import { z } from "zod";

interface SprintFormProps {
  projectId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SprintForm({ projectId, onSuccess, onCancel }: SprintFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with Zod
    try {
      const validated = sprintSchema.parse({
        name: formData.name,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      });

      setIsSubmitting(true);

      await createSprint({
        projectId,
        name: validated.name,
        startDate: validated.startDate,
        endDate: validated.endDate,
      });

      toast({
        title: "Sprint created",
        description: `${validated.name} has been created successfully`,
        variant: "success",
      });

      setFormData({ name: "", startDate: "", endDate: "" });
      onSuccess?.();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast({
          title: "Validation Error",
          description: "Please check the form for errors",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create sprint",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" required>
          Sprint Name
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Sprint 1"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate" required>
          Start Date
        </Label>
        <Input
          id="startDate"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          disabled={isSubmitting}
        />
        {errors.startDate && (
          <p className="text-sm text-destructive">{errors.startDate}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate" required>
          End Date
        </Label>
        <Input
          id="endDate"
          type="date"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          disabled={isSubmitting}
        />
        {errors.endDate && (
          <p className="text-sm text-destructive">{errors.endDate}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Sprint"}
        </Button>
      </div>
    </form>
  );
}
