import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SprintActions } from "./sprint-actions";
import { format } from "date-fns";
import type { Sprint } from "@prisma/client";
import { CalendarDays, Ticket } from "lucide-react";

interface SprintWithCount extends Sprint {
  _count: {
    tasks: number;
  };
}

interface SprintListProps {
  sprints: SprintWithCount[];
  userRole: string;
}

export function SprintList({ sprints, userRole }: SprintListProps) {
  if (sprints.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed">
        <div className="flex flex-col items-center gap-2">
          <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">No sprints found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Get started by creating your first sprint to organize your team's work.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sprints.map((sprint) => (
        <Card key={sprint.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
                {sprint.name}
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                <span>
                  {format(new Date(sprint.startDate), "MMM d")} -{" "}
                  {format(new Date(sprint.endDate), "MMM d, yyyy")}
                </span>
              </div>
            </div>
            <StatusBadge status={sprint.status} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                <Ticket className="h-4 w-4" />
                <span className="font-medium text-foreground">{sprint._count.tasks}</span>
                <span className="text-xs">tickets</span>
              </div>

              {userRole === "admin" && (
                <SprintActions
                  sprintId={sprint.id}
                  status={sprint.status}
                  sprintName={sprint.name}
                />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: Sprint["status"] }) {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    planned: "secondary",
    active: "default",
    completed: "outline",
  };

  const labels: Record<string, string> = {
    planned: "Planned",
    active: "Active",
    completed: "Completed"
  };

  return (
    <Badge variant={variants[status]} className="capitalize">
      {labels[status]}
    </Badge>
  );
}
