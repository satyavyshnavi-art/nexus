"use client";

import { useState } from "react";
import { Task, User } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskDetailModal } from "./task-detail-modal";
import { CheckSquare, Bug, BookOpen, TrendingUp } from "lucide-react";

interface TaskListViewProps {
  tasks: (Task & {
    assignee: Pick<User, "id" | "name" | "email"> | null;
    _count?: {
      comments: number;
      attachments: number;
      childTasks?: number;
    };
    childTasks?: Pick<Task, "id" | "title" | "status" | "priority" | "type">[];
  })[];
  projectMembers: Pick<User, "id" | "name" | "email">[];
}

const priorityColors = {
  low: "bg-gray-100 text-gray-800 border-gray-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  critical: "bg-red-100 text-red-800 border-red-300",
};

const statusColors = {
  todo: "bg-gray-100 text-gray-800",
  progress: "bg-blue-100 text-blue-800",
  review: "bg-yellow-100 text-yellow-800",
  done: "bg-green-100 text-green-800",
};

const typeIcons = {
  task: CheckSquare,
  bug: Bug,
  story: BookOpen,
};

export function TaskListView({ tasks, projectMembers }: TaskListViewProps) {
  const [selectedTask, setSelectedTask] = useState<typeof tasks[0] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleTaskClick = (task: typeof tasks[0]) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    // Small delay before clearing to allow modal close animation
    setTimeout(() => setSelectedTask(null), 200);
  };

  // Calculate progress percentage for tasks with subtasks
  const getProgressPercentage = (task: typeof tasks[0]) => {
    if (!task.childTasks || task.childTasks.length === 0) return null;
    const completed = task.childTasks.filter((t) => t.status === "done").length;
    return Math.round((completed / task.childTasks.length) * 100);
  };

  return (
    <>
      <div className="space-y-2">
        {tasks.map((task) => {
          const TypeIcon = typeIcons[task.type];
          const progressPercentage = getProgressPercentage(task);

          return (
            <Card
              key={task.id}
              className="cursor-pointer hover:shadow-md hover:border-purple-300 transition-all duration-200"
              onClick={() => handleTaskClick(task)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Left side - Task info */}
                  <div className="flex-1 space-y-3">
                    {/* Header with badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <TypeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Badge variant="outline" className="capitalize text-xs">
                        {task.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${priorityColors[task.priority]}`}
                      >
                        {task.priority}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusColors[task.status]}`}
                      >
                        {task.status === "progress" ? "In Progress" : task.status}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-base">{task.title}</h3>

                    {/* Progress bar for parent tasks */}
                    {progressPercentage !== null && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {progressPercentage}%
                        </span>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {task.assignee && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Assigned to:</span>
                          <span className="bg-secondary px-2 py-0.5 rounded">
                            {task.assignee.name || task.assignee.email}
                          </span>
                        </span>
                      )}
                      {task.storyPoints && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Story Points:</span>
                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-medium">
                            {task.storyPoints}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side - Counts */}
                  <div className="flex flex-col items-end gap-2 text-sm">
                    {task._count && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        {task._count.childTasks && task._count.childTasks > 0 && (
                          <span className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded">
                            <CheckSquare className="h-3.5 w-3.5 text-purple-600" />
                            <span className="font-medium">{task._count.childTasks}</span>
                          </span>
                        )}
                        {task._count.comments > 0 && (
                          <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                            💬 <span className="font-medium">{task._count.comments}</span>
                          </span>
                        )}
                        {task._count.attachments > 0 && (
                          <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                            📎 <span className="font-medium">{task._count.attachments}</span>
                          </span>
                        )}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Click to view details
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectMembers={projectMembers}
          open={modalOpen}
          onOpenChange={handleModalClose}
        />
      )}
    </>
  );
}
