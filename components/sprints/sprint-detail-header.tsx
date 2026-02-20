import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import type { SprintStatus } from "@prisma/client";

interface SprintDetailHeaderProps {
  sprintName: string;
  status: SprintStatus;
  startDate: Date;
  endDate: Date;
  completedAt: Date | null;
  createdAt: Date;
  creatorName: string | null;
  durationDays: number;
  projectId: string;
  projectName: string;
}

export function SprintDetailHeader({
  sprintName,
  status,
  startDate,
  endDate,
  completedAt,
  creatorName,
  durationDays,
  projectId,
  projectName,
}: SprintDetailHeaderProps) {
  const statusConfig = {
    planned: {
      label: "Planned",
      variant: "outline" as const,
      className: "border-yellow-300 text-yellow-700 dark:border-yellow-800 dark:text-yellow-400",
    },
    active: {
      label: "Active",
      variant: "outline" as const,
      className: "border-green-300 text-green-700 dark:border-green-800 dark:text-green-400",
    },
    completed: {
      label: "Completed",
      variant: "secondary" as const,
      className: "",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}/sprints`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sprints
          </Button>
        </Link>
        <span className="text-sm text-muted-foreground">{projectName}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{sprintName}</h1>
          <Badge variant={config.variant} className={config.className}>
            {config.label}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {format(new Date(startDate), "MMM d, yyyy")} –{" "}
            {format(new Date(endDate), "MMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {durationDays} day{durationDays !== 1 ? "s" : ""}
          </span>
          {creatorName && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              Created by {creatorName}
            </span>
          )}
          {completedAt && (
            <span className="text-green-600 dark:text-green-400">
              Completed {format(new Date(completedAt), "MMM d, yyyy")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
