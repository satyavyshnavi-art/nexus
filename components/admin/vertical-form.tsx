"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createVertical } from "@/server/actions/verticals";
import { toast } from "@/lib/hooks/use-toast";

interface VerticalFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VerticalForm({ onSuccess, onCancel }: VerticalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Vertical name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createVertical(name);

      toast({
        title: "Vertical created",
        description: `${name} has been created successfully`,
        variant: "success",
      });

      setName("");
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create vertical",
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
          Vertical Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Engineering"
          disabled={isSubmitting}
        />
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
          {isSubmitting ? "Creating..." : "Create Vertical"}
        </Button>
      </div>
    </form>
  );
}
