"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { activateSprint, deleteSprint } from "@/server/actions/sprints";
import { toast } from "@/lib/hooks/use-toast";
import { SprintStatus } from "@prisma/client";
import { CompleteSprintDialog } from "./complete-sprint-dialog";
import { EditSprintModal } from "./edit-sprint-modal";
import { Pencil, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SprintActionsProps {
  sprintId: string;
  status: SprintStatus;
  sprintName: string;
  projectId: string;
  startDate: Date;
  endDate: Date;
  completedTaskCount?: number;
  incompleteTaskCount?: number;
  userRole: string;
}

export function SprintActions({
  sprintId,
  status,
  sprintName,
  projectId,
  startDate,
  endDate,
  completedTaskCount = 0,
  incompleteTaskCount = 0,
  userRole,
}: SprintActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleActivate = async () => {
    setIsLoading(true);
    try {
      await activateSprint(sprintId);
      toast({
        title: "Sprint activated",
        description: `${sprintName} is now active`,
        variant: "success",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to activate sprint",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${sprintName}"? All tasks in this sprint will be deleted.`)) return;
    setIsLoading(true);
    try {
      await deleteSprint(sprintId);
      toast({
        title: "Sprint deleted",
        description: `"${sprintName}" has been deleted`,
        variant: "success",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete sprint",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = userRole === "admin";

  if (status === "completed") {
    return (
      <span className="text-sm text-muted-foreground">Completed</span>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {status === "planned" && (
          <Button onClick={handleActivate} disabled={isLoading} size="sm">
            {isLoading ? "Activating..." : "Activate"}
          </Button>
        )}
        {status === "active" && (
          <Button
            onClick={() => setShowCompleteDialog(true)}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            Complete
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowEditModal(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Sprint
            </DropdownMenuItem>
            {status !== "active" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Sprint
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {status === "active" && (
        <CompleteSprintDialog
          open={showCompleteDialog}
          onOpenChange={setShowCompleteDialog}
          sprintId={sprintId}
          sprintName={sprintName}
          projectId={projectId}
          completedTaskCount={completedTaskCount}
          incompleteTaskCount={incompleteTaskCount}
        />
      )}

      <EditSprintModal
        sprint={{
          id: sprintId,
          name: sprintName,
          startDate,
          endDate,
        }}
        open={showEditModal}
        onOpenChange={setShowEditModal}
      />
    </>
  );
}
