"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { activateSprint, completeSprint } from "@/server/actions/sprints";
import { toast } from "@/lib/hooks/use-toast";
import { SprintStatus } from "@prisma/client";

interface SprintActionsProps {
  sprintId: string;
  status: SprintStatus;
  sprintName: string;
}

export function SprintActions({ sprintId, status, sprintName }: SprintActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleActivate = async () => {
    setIsLoading(true);
    try {
      await activateSprint(sprintId);
      toast({
        title: "Sprint activated",
        description: `${sprintName} is now active`,
        variant: "success",
      });
      window.location.reload();
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

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await completeSprint(sprintId);
      toast({
        title: "Sprint completed",
        description: `${sprintName} has been marked as completed`,
        variant: "success",
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete sprint",
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
      <Button onClick={handleComplete} disabled={isLoading} size="sm" variant="outline">
        {isLoading ? "Completing..." : "Complete"}
      </Button>
    );
  }

  return (
    <span className="text-sm text-muted-foreground">Completed</span>
  );
}
