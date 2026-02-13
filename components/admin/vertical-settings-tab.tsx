"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { updateVertical, deleteVertical } from "@/server/actions/verticals";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface VerticalSettingsTabProps {
  verticalId: string;
  verticalName: string;
}

export function VerticalSettingsTab({
  verticalId,
  verticalName,
}: VerticalSettingsTabProps) {
  const [name, setName] = useState(verticalName);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Vertical name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      await updateVertical(verticalId, name);
      toast({
        title: "Success",
        description: "Vertical updated successfully",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update vertical",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteVertical(verticalId);
      toast({
        title: "Success",
        description: "Vertical deleted successfully",
      });
      router.push("/admin/verticals");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete vertical",
        variant: "destructive",
      });
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">General Settings</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Update basic information about this vertical
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vertical-name">Vertical Name</Label>
            <Input
              id="vertical-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter vertical name"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving || name === verticalName}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-destructive">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Irreversible actions that require careful consideration
            </p>
          </div>

          <div className="flex items-start justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/5">
            <div>
              <h4 className="font-medium">Delete Vertical</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete this vertical and all associated data.
                This action cannot be undone.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Note: You must remove all projects from this vertical before deleting it.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Vertical"
        description={`Are you sure you want to delete "${verticalName}"? This action cannot be undone.`}
        confirmText="Delete Vertical"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
