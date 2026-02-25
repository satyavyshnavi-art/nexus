"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { CheckCircle2, ArrowRight, Users } from "lucide-react";
import type {
  SprintDetailTask,
  SprintTeamMember,
} from "@/server/actions/sprints";

interface SprintDetailTabsProps {
  completedTasks: SprintDetailTask[];
  incompleteTasks: SprintDetailTask[];
  teamMembers: SprintTeamMember[];
}

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const typeColors: Record<string, string> = {
  story: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  task: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  bug: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  progress: "In Progress",
  review: "In Review",
  done: "Done",
};

function TaskRow({ task }: { task: SprintDetailTask }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColors[task.type] || ""}`}>
          {task.type}
        </span>
        <span className="text-sm font-medium truncate">{task.title}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority] || ""}`}>
          {task.priority}
        </span>
        {task.assignee && (
          <Avatar
            name={task.assignee.name || task.assignee.email}
            src={task.assignee.avatar || undefined}
            size="xs"
          />
        )}
      </div>
    </div>
  );
}

export function SprintDetailTabs({
  completedTasks,
  incompleteTasks,
  teamMembers,
}: SprintDetailTabsProps) {
  return (
    <Tabs defaultValue="completed" className="space-y-4">
      <TabsList>
        <TabsTrigger value="completed" className="gap-1.5">
          <CheckCircle2 className="h-4 w-4" />
          Completed
          {completedTasks.length > 0 && (
            <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {completedTasks.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="carried" className="gap-1.5">
          <ArrowRight className="h-4 w-4" />
          Carried Forward
          {incompleteTasks.length > 0 && (
            <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {incompleteTasks.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="team" className="gap-1.5">
          <Users className="h-4 w-4" />
          Team
          {teamMembers.length > 0 && (
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              {teamMembers.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="completed">
        {completedTasks.length > 0 ? (
          <Card className="divide-y">
            {completedTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No completed tasks in this sprint.</p>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="carried">
        {incompleteTasks.length > 0 ? (
          <Card className="divide-y">
            {incompleteTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between py-3 px-4 border-b last:border-b-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColors[task.type] || ""}`}>
                    {task.type}
                  </span>
                  <span className="text-sm font-medium truncate">{task.title}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {statusLabels[task.status] || task.status}
                  </Badge>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority] || ""}`}>
                    {task.priority}
                  </span>
                  {task.assignee && (
                    <Avatar
                      name={task.assignee.name || task.assignee.email}
                      src={task.assignee.avatar || undefined}
                      size="xs"
                    />
                  )}
                </div>
              </div>
            ))}
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">All tasks were completed in this sprint.</p>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="team">
        {teamMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <Card key={member.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    name={member.name || member.email}
                    src={member.avatar || undefined}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {member.name || member.email}
                    </p>
                    {member.name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold">{member.taskCount}</p>
                    <p className="text-xs text-muted-foreground">Tasks</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{member.completedTaskCount}</p>
                    <p className="text-xs text-muted-foreground">Done</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No team members assigned to tasks in this sprint.</p>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
