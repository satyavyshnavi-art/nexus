import { Task, User } from "@prisma/client";
import { format } from "date-fns";
import { Calendar, User as UserIcon, Hash } from "lucide-react";

interface TaskMetadataProps {
  task: Task & {
    assignee: Pick<User, "id" | "name" | "email"> | null;
  };
  createdBy?: Pick<User, "id" | "name" | "email"> | null;
}

export function TaskMetadata({ task, createdBy }: TaskMetadataProps) {
  return (
    <div className="grid grid-cols-2 gap-4 py-4 border-y">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserIcon className="h-4 w-4" />
          <span>Assignee</span>
        </div>
        <div className="text-sm font-medium">
          {task.assignee ? task.assignee.name || task.assignee.email : "Unassigned"}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Hash className="h-4 w-4" />
          <span>Story Points</span>
        </div>
        <div className="text-sm font-medium">
          {task.storyPoints || "Not set"}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserIcon className="h-4 w-4" />
          <span>Created by</span>
        </div>
        <div className="text-sm font-medium">
          {createdBy ? createdBy.name || createdBy.email : "Unknown"}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Created</span>
        </div>
        <div className="text-sm font-medium">
          {format(new Date(task.createdAt), "MMM d, yyyy")}
        </div>
      </div>
    </div>
  );
}
