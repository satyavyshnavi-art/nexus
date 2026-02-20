"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  completeSprint,
  getPlannedSprints,
} from "@/server/actions/sprints";
import { toast } from "@/lib/hooks/use-toast";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

interface CompleteSprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprintId: string;
  sprintName: string;
  projectId: string;
  completedTaskCount: number;
  incompleteTaskCount: number;
}

interface PlannedSprint {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

export function CompleteSprintDialog({
  open,
  onOpenChange,
  sprintId,
  sprintName,
  projectId,
  completedTaskCount,
  incompleteTaskCount,
}: CompleteSprintDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<"keep" | "moveToNext">("keep");
  const [targetSprintId, setTargetSprintId] = useState<string>("");
  const [plannedSprints, setPlannedSprints] = useState<PlannedSprint[]>([]);
  const [loadingSprints, setLoadingSprints] = useState(false);

  useEffect(() => {
    if (open && incompleteTaskCount > 0) {
      setLoadingSprints(true);
      getPlannedSprints(projectId)
        .then((sprints) => {
          setPlannedSprints(sprints);
        })
        .catch(() => {
          setPlannedSprints([]);
        })
        .finally(() => setLoadingSprints(false));
    }
  }, [open, projectId, incompleteTaskCount]);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const result = await completeSprint(sprintId, {
        incompleteTaskAction: action,
        targetSprintId: action === "moveToNext" ? targetSprintId : undefined,
      });

      toast({
        title: "Sprint completed",
        description: result.movedTaskCount > 0
          ? `${sprintName} completed. ${result.movedTaskCount} task(s) moved to next sprint.`
          : `${sprintName} has been marked as completed.`,
        variant: "success",
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to complete sprint",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Complete Sprint
          </DialogTitle>
          <DialogDescription>
            Complete <span className="font-medium text-foreground">{sprintName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Task summary */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completed tasks</span>
              <span className="font-medium text-green-600">{completedTaskCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Incomplete tasks</span>
              <span className="font-medium text-amber-600">{incompleteTaskCount}</span>
            </div>
          </div>

          {/* Incomplete task handling */}
          {incompleteTaskCount > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                What would you like to do with {incompleteTaskCount} incomplete task(s)?
              </p>
              <RadioGroup
                value={action}
                onValueChange={(v) => setAction(v as "keep" | "moveToNext")}
                className="space-y-2"
              >
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="keep" />
                  <div>
                    <p className="text-sm font-medium">Keep in this sprint</p>
                    <p className="text-xs text-muted-foreground">
                      Tasks stay in the completed sprint
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="moveToNext" />
                  <div>
                    <p className="text-sm font-medium">Move to another sprint</p>
                    <p className="text-xs text-muted-foreground">
                      Move incomplete tasks to a planned sprint
                    </p>
                  </div>
                </label>
              </RadioGroup>

              {action === "moveToNext" && (
                <div className="pl-1">
                  {loadingSprints ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading sprints...
                    </div>
                  ) : plannedSprints.length === 0 ? (
                    <p className="text-sm text-amber-600">
                      No planned sprints available. Create one first or keep tasks in this sprint.
                    </p>
                  ) : (
                    <Select value={targetSprintId} onValueChange={setTargetSprintId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a sprint..." />
                      </SelectTrigger>
                      <SelectContent>
                        {plannedSprints.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              isLoading ||
              (action === "moveToNext" && !targetSprintId && incompleteTaskCount > 0)
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                Complete Sprint
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
