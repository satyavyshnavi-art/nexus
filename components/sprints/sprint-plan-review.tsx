"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleDistributionChart } from "./role-distribution-chart";
import { getRoleColor } from "@/lib/utils/role-colors";
import type { GeneratedSprintPlan, SuggestedStory, SuggestedTask } from "@/server/actions/ai-sprint";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Loader2,
  ArrowLeft,
  Check,
} from "lucide-react";

interface SprintPlanReviewProps {
  plan: GeneratedSprintPlan;
  onConfirm: (editedPlan: {
    sprint_name: string;
    duration_days: number;
    stories: {
      title: string;
      story_points: number;
      required_role: string;
      labels: string[];
      priority: "low" | "medium" | "high" | "critical";
      tasks: {
        title: string;
        required_role: string;
        labels: string[];
        priority: "low" | "medium" | "high" | "critical";
        assignee_id?: string;
      }[];
    }[];
  }) => void;
  onBack: () => void;
  isConfirming: boolean;
}

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

export function SprintPlanReview({
  plan,
  onConfirm,
  onBack,
  isConfirming,
}: SprintPlanReviewProps) {
  const [sprintName, setSprintName] = useState(plan.sprint_name);
  const [stories, setStories] = useState<SuggestedStory[]>(plan.stories);
  const [expandedStories, setExpandedStories] = useState<Set<number>>(
    new Set(plan.stories.map((_, i) => i))
  );

  const toggleStory = (index: number) => {
    setExpandedStories((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const updateTaskAssignee = (storyIndex: number, taskIndex: number, assigneeId: string) => {
    setStories((prev) => {
      const updated = [...prev];
      const story = { ...updated[storyIndex] };
      const tasks = [...story.tasks];
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        selected_assignee_id: assigneeId === "unassigned" ? undefined : assigneeId,
      };
      story.tasks = tasks;
      updated[storyIndex] = story;
      return updated;
    });
  };

  const handleConfirm = () => {
    onConfirm({
      sprint_name: sprintName,
      duration_days: plan.duration_days,
      stories: stories.map((story) => ({
        title: story.title,
        story_points: story.story_points,
        required_role: story.required_role,
        labels: story.labels,
        priority: story.priority,
        tasks: story.tasks.map((task) => ({
          title: task.title,
          required_role: task.required_role,
          labels: task.labels,
          priority: task.priority,
          assignee_id: task.selected_assignee_id,
        })),
      })),
    });
  };

  const totalTasks = stories.reduce((sum, s) => sum + s.tasks.length, 0);
  const totalPoints = stories.reduce((sum, s) => sum + s.story_points, 0);

  return (
    <div className="space-y-5">
      {/* Sprint Header */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sprint Name</Label>
          <Input
            value={sprintName}
            onChange={(e) => setSprintName(e.target.value)}
            className="text-base font-semibold"
          />
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            {plan.duration_days} days
          </Badge>
          <span>{stories.length} stories</span>
          <span>{totalTasks} tasks</span>
          <span>{totalPoints} points</span>
        </div>
      </div>

      {/* Role Distribution */}
      {plan.role_distribution.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <RoleDistributionChart distribution={plan.role_distribution} />
        </div>
      )}

      {/* Stories & Tasks */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Stories & Tasks</h4>
        <div className="space-y-2">
          {stories.map((story, storyIndex) => {
            const roleColors = getRoleColor(story.required_role);
            const isExpanded = expandedStories.has(storyIndex);

            return (
              <div key={storyIndex} className="border rounded-lg overflow-hidden">
                {/* Story header */}
                <button
                  type="button"
                  onClick={() => toggleStory(storyIndex)}
                  className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium flex-1 line-clamp-1">
                    {story.title}
                  </span>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-xs border ${roleColors.bg} ${roleColors.text} ${roleColors.border}`}
                  >
                    {story.required_role}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-xs border ${priorityColors[story.priority]}`}
                  >
                    {story.priority}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {story.story_points}pt
                  </span>
                </button>

                {/* Tasks */}
                {isExpanded && (
                  <div className="border-t divide-y">
                    {story.tasks.map((task, taskIndex) => (
                      <TaskRow
                        key={taskIndex}
                        task={task}
                        members={plan.members}
                        onAssigneeChange={(assigneeId) =>
                          updateTaskAssignee(storyIndex, taskIndex, assigneeId)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={isConfirming}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleConfirm} disabled={isConfirming}>
          {isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Confirm & Create Sprint
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// --- Task Row ---

function TaskRow({
  task,
  members,
  onAssigneeChange,
}: {
  task: SuggestedTask;
  members: { id: string; name: string | null; designation: string | null }[];
  onAssigneeChange: (assigneeId: string) => void;
}) {
  const roleColors = getRoleColor(task.required_role);

  // Pre-select top suggestion if exists
  const topSuggestion = task.suggested_assignees[0];
  const defaultAssignee =
    task.selected_assignee_id ||
    (topSuggestion?.confidence === "high" ? topSuggestion.userId : "unassigned");

  return (
    <div className="flex items-center gap-2 px-3 py-2 pl-9 bg-background">
      <span className="text-sm flex-1 line-clamp-1">{task.title}</span>

      <Badge
        variant="outline"
        className={`shrink-0 text-[10px] border ${roleColors.bg} ${roleColors.text} ${roleColors.border}`}
      >
        {task.required_role}
      </Badge>

      <Badge
        variant="outline"
        className={`shrink-0 text-[10px] border ${priorityColors[task.priority]}`}
      >
        {task.priority}
      </Badge>

      {/* Assignee dropdown */}
      <select
        defaultValue={defaultAssignee}
        onChange={(e) => onAssigneeChange(e.target.value)}
        className="text-xs border rounded px-2 py-1 bg-background max-w-[140px] truncate"
      >
        <option value="unassigned">Unassigned</option>
        {/* Suggested members first, sorted by confidence */}
        {task.suggested_assignees.map((suggestion) => (
          <option key={suggestion.userId} value={suggestion.userId}>
            {suggestion.name}
            {suggestion.confidence === "high"
              ? " ★"
              : suggestion.confidence === "medium"
              ? " ☆"
              : ""}
          </option>
        ))}
        {/* Remaining members not in suggestions */}
        {members
          .filter(
            (m) =>
              !task.suggested_assignees.some((s) => s.userId === m.id)
          )
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || "Unknown"}
            </option>
          ))}
      </select>
    </div>
  );
}
