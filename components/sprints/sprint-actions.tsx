"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { activateSprint } from "@/server/actions/sprints";
import { toast } from "@/lib/hooks/use-toast";
import { SprintStatus } from "@prisma/client";
import { CompleteSprintDialog } from "./complete-sprint-dialog";

interface SprintActionsProps {
  sprintId: string;
  status: SprintStatus;
  sprintName: string;
  projectId: string;
  completedTaskCount?: number;
  incompleteTaskCount?: number;
}

export function SprintActions({
  sprintId,
  status,
  sprintName,
  projectId,
  completedTaskCount = 0,
  incompleteTaskCount = 0,
}: SprintActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

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

  if (status === "planned") {
    return (
      <Button onClick={handleActivate} disabled={isLoading} size="sm">
        {isLoading ? "Activating..." : "Activate"}
      </Button>
    );
  }

  if (status === "active") {
    return (
      <>
        <Button
          onClick={() => setShowCompleteDialog(true)}
          disabled={isLoading}
          size="sm"
          variant="outline"
        >
          Complete
        </Button>
        <CompleteSprintDialog
          open={showCompleteDialog}
          onOpenChange={setShowCompleteDialog}
          sprintId={sprintId}
          sprintName={sprintName}
          projectId={projectId}
          completedTaskCount={completedTaskCount}
          incompleteTaskCount={incompleteTaskCount}
        />
      </>
    );
  }

  return (
    <span className="text-sm text-muted-foreground">Completed</span>
  );
}
