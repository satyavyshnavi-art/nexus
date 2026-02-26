"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSprint } from "@/server/actions/sprints";
import { toast } from "sonner";
import { sprintSchema } from "@/lib/validation/schemas";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";

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

    try {
      // Validate with Zod
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

      toast.success("Sprint created", {
        description: `${validated.name} has been created successfully`,
      });

      setFormData({ name: "", startDate: "", endDate: "" });
      onSuccess?.();
    } catch (error) {
      console.error("Sprint creation failed:", error);
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Validation Error", {
          description: "Please check the form for errors",
        });
      } else {
        toast.error("Error", {
          description: error instanceof Error ? error.message : "Failed to create sprint",
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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={isSubmitting}
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.startDate
                ? format(parse(formData.startDate, "yyyy-MM-dd", new Date()), "MMM d, yyyy")
                : "Pick a start date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.startDate ? parse(formData.startDate, "yyyy-MM-dd", new Date()) : undefined}
              onSelect={(date) =>
                setFormData({ ...formData, startDate: date ? format(date, "yyyy-MM-dd") : "" })
              }
            />
          </PopoverContent>
        </Popover>
        {errors.startDate && (
          <p className="text-sm text-destructive">{errors.startDate}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate" required>
          End Date
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={isSubmitting}
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.endDate
                ? format(parse(formData.endDate, "yyyy-MM-dd", new Date()), "MMM d, yyyy")
                : "Pick an end date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.endDate ? parse(formData.endDate, "yyyy-MM-dd", new Date()) : undefined}
              onSelect={(date) =>
                setFormData({ ...formData, endDate: date ? format(date, "yyyy-MM-dd") : "" })
              }
            />
          </PopoverContent>
        </Popover>
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
