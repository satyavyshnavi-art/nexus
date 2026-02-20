"use client";

import { useState, useMemo } from "react";
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
  Plus,
  Trash2,
  Pencil,
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

const ROLES = ["UI", "Backend", "QA", "DevOps", "Full-Stack", "Design", "Data", "Mobile"];
const PRIORITIES = ["low", "medium", "high", "critical"] as const;

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
  const [durationDays, setDurationDays] = useState(plan.duration_days);
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

  // --- Story updates ---

  const updateStory = (index: number, field: string, value: string | number) => {
    setStories((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeStory = (index: number) => {
    setStories((prev) => prev.filter((_, i) => i !== index));
    setExpandedStories((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  const addStory = () => {
    const newIndex = stories.length;
    setStories((prev) => [
      ...prev,
      {
        title: "New Story",
        story_points: 3,
        required_role: "Full-Stack",
        labels: [],
        priority: "medium",
        tasks: [
          {
            title: "New Task",
            required_role: "Full-Stack",
            labels: [],
            priority: "medium",
            suggested_assignees: [],
          },
        ],
      },
    ]);
    setExpandedStories((prev) => new Set([...prev, newIndex]));
  };

  // --- Task updates ---

  const updateTask = (storyIndex: number, taskIndex: number, field: string, value: string) => {
    setStories((prev) => {
      const updated = [...prev];
      const story = { ...updated[storyIndex] };
      const tasks = [...story.tasks];
      tasks[taskIndex] = { ...tasks[taskIndex], [field]: value };
      story.tasks = tasks;
      updated[storyIndex] = story;
      return updated;
    });
  };

  const removeTask = (storyIndex: number, taskIndex: number) => {
    setStories((prev) => {
      const updated = [...prev];
      const story = { ...updated[storyIndex] };
      story.tasks = story.tasks.filter((_, i) => i !== taskIndex);
      updated[storyIndex] = story;
      return updated;
    });
  };

  const addTask = (storyIndex: number) => {
    setStories((prev) => {
      const updated = [...prev];
      const story = { ...updated[storyIndex] };
      story.tasks = [
        ...story.tasks,
        {
          title: "New Task",
          required_role: story.required_role,
          labels: [],
          priority: story.priority,
          suggested_assignees: plan.members.map((m) => ({
            userId: m.id,
            name: m.name || "Unknown",
            confidence: "low" as const,
          })),
        },
      ];
      updated[storyIndex] = story;
      return updated;
    });
  };

  // Recompute role distribution from current state
  const roleDistribution = useMemo(() => {
    const map = new Map<string, { story_points: number; task_count: number }>();
    stories.forEach((story) => {
      story.tasks.forEach((task) => {
        const role = task.required_role;
        const existing = map.get(role) || { story_points: 0, task_count: 0 };
        existing.task_count += 1;
        map.set(role, existing);
      });
      const storyRole = story.required_role;
      const existing = map.get(storyRole) || { story_points: 0, task_count: 0 };
      existing.story_points += story.story_points;
      map.set(storyRole, existing);
    });
    return Array.from(map.entries()).map(([role, data]) => ({
      role,
      story_points: data.story_points,
      task_count: data.task_count,
    }));
  }, [stories]);

  const handleConfirm = () => {
    // Filter out stories with no tasks
    const validStories = stories.filter((s) => s.tasks.length > 0);
    onConfirm({
      sprint_name: sprintName,
      duration_days: durationDays,
      stories: validStories.map((story) => ({
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground">Duration</Label>
            <Input
              type="number"
              min={7}
              max={30}
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value) || 14)}
              className="w-20 h-8 text-sm"
            />
            <span className="text-xs text-muted-foreground">days</span>
          </div>
          <span className="text-sm text-muted-foreground">{stories.length} stories</span>
          <span className="text-sm text-muted-foreground">{totalTasks} tasks</span>
          <span className="text-sm text-muted-foreground">{totalPoints} points</span>
        </div>
      </div>

      {/* Role Distribution (recomputed live) */}
      {roleDistribution.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <RoleDistributionChart distribution={roleDistribution} />
        </div>
      )}

      {/* Stories & Tasks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Stories & Tasks</h4>
          <Button variant="outline" size="sm" onClick={addStory} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Story
          </Button>
        </div>
        <div className="space-y-2">
          {stories.map((story, storyIndex) => {
            const isExpanded = expandedStories.has(storyIndex);

            return (
              <div key={storyIndex} className="border rounded-lg overflow-hidden">
                {/* Story header — click chevron to expand/collapse */}
                <div className="flex items-center gap-2 p-3 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => toggleStory(storyIndex)}
                    className="shrink-0 p-0.5 hover:bg-muted rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Editable title */}
                  <Input
                    value={story.title}
                    onChange={(e) => updateStory(storyIndex, "title", e.target.value)}
                    className="h-7 text-sm font-medium flex-1 bg-background"
                  />

                  {/* Story points */}
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={story.story_points}
                    onChange={(e) =>
                      updateStory(storyIndex, "story_points", parseInt(e.target.value) || 0)
                    }
                    className="h-7 w-16 text-xs text-center bg-background"
                    title="Story points"
                  />

                  {/* Role select */}
                  <select
                    value={story.required_role}
                    onChange={(e) => updateStory(storyIndex, "required_role", e.target.value)}
                    className="h-7 text-xs border rounded px-1.5 bg-background"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>

                  {/* Priority select */}
                  <select
                    value={story.priority}
                    onChange={(e) => updateStory(storyIndex, "priority", e.target.value)}
                    className="h-7 text-xs border rounded px-1.5 bg-background capitalize"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>

                  {/* Remove story */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStory(storyIndex)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    title="Remove story"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Tasks */}
                {isExpanded && (
                  <div className="border-t">
                    <div className="divide-y">
                      {story.tasks.map((task, taskIndex) => (
                        <TaskRow
                          key={taskIndex}
                          task={task}
                          members={plan.members}
                          onUpdate={(field, value) =>
                            updateTask(storyIndex, taskIndex, field, value)
                          }
                          onRemove={() => removeTask(storyIndex, taskIndex)}
                        />
                      ))}
                    </div>
                    <div className="px-3 py-2 pl-9 border-t bg-muted/20">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addTask(storyIndex)}
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Task
                      </Button>
                    </div>
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
        <Button
          onClick={handleConfirm}
          disabled={isConfirming || stories.length === 0}
        >
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

// --- Editable Task Row ---

function TaskRow({
  task,
  members,
  onUpdate,
  onRemove,
}: {
  task: SuggestedTask;
  members: { id: string; name: string | null; designation: string | null }[];
  onUpdate: (field: string, value: string) => void;
  onRemove: () => void;
}) {
  const topSuggestion = task.suggested_assignees[0];
  const defaultAssignee =
    task.selected_assignee_id ||
    (topSuggestion?.confidence === "high" ? topSuggestion.userId : "unassigned");

  return (
    <div className="flex items-center gap-2 px-3 py-2 pl-9 bg-background">
      {/* Editable title */}
      <Input
        value={task.title}
        onChange={(e) => onUpdate("title", e.target.value)}
        className="h-7 text-sm flex-1 bg-transparent border-transparent hover:border-input focus:border-input"
      />

      {/* Role select */}
      <select
        value={task.required_role}
        onChange={(e) => onUpdate("required_role", e.target.value)}
        className="h-7 text-[11px] border rounded px-1 bg-background shrink-0"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      {/* Priority select */}
      <select
        value={task.priority}
        onChange={(e) => onUpdate("priority", e.target.value)}
        className="h-7 text-[11px] border rounded px-1 bg-background capitalize shrink-0"
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {/* Assignee dropdown */}
      <select
        value={defaultAssignee}
        onChange={(e) => onUpdate("selected_assignee_id", e.target.value === "unassigned" ? "" : e.target.value)}
        className="h-7 text-[11px] border rounded px-1 bg-background max-w-[120px] truncate shrink-0"
      >
        <option value="unassigned">Unassigned</option>
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
        {members
          .filter((m) => !task.suggested_assignees.some((s) => s.userId === m.id))
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || "Unknown"}
            </option>
          ))}
      </select>

      {/* Remove task */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
        title="Remove task"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
