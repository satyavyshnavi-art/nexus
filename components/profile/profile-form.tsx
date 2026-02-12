"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateUserProfile } from "@/server/actions/users";
import { toast } from "sonner";

interface ProfileFormProps {
  userId: string;
  initialData: {
    name?: string | null;
    designation?: string | null;
    bio?: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProfileForm({
  userId,
  initialData,
  onSuccess,
  onCancel,
}: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    designation: initialData.designation || "",
    bio: initialData.bio || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateUserProfile(userId, {
        designation: formData.designation || undefined,
        bio: formData.bio || undefined,
      });

      toast.success("Profile updated successfully");
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="designation">Designation</Label>
        <Input
          id="designation"
          placeholder="e.g., Senior Frontend Engineer"
          value={formData.designation}
          onChange={(e) =>
            setFormData({ ...formData, designation: e.target.value })
          }
          maxLength={255}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Your job title or role
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          placeholder="Tell us about yourself..."
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          maxLength={1000}
          rows={4}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          {formData.bio.length}/1000 characters
        </p>
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
