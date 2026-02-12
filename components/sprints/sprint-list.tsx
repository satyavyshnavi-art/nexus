import { Card } from "@/components/ui/card";
import { SprintActions } from "./sprint-actions";
import { format } from "date-fns";
import type { Sprint } from "@prisma/client";

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
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No sprints yet. Create your first sprint to get started.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sprints.map((sprint) => (
        <Card key={sprint.id} className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">{sprint.name}</h3>
                <StatusBadge status={sprint.status} />
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  {format(new Date(sprint.startDate), "MMM d, yyyy")} -{" "}
                  {format(new Date(sprint.endDate), "MMM d, yyyy")}
                </p>
                <p>{sprint._count.tasks} tasks</p>
              </div>
            </div>
            {userRole === "admin" && (
              <SprintActions
                sprintId={sprint.id}
                status={sprint.status}
                sprintName={sprint.name}
              />
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: Sprint["status"] }) {
  const variants = {
    planning: "bg-yellow-100 text-yellow-800 border-yellow-300",
    active: "bg-green-100 text-green-800 border-green-300",
    completed: "bg-gray-100 text-gray-800 border-gray-300",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        variants[status]
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
