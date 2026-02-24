"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleDistributionChart } from "./role-distribution-chart";
import { getRoleColor } from "@/lib/utils/role-colors";
import type {
  GeneratedSprintPlan,
  GeneratedTicketsPlan,
  SuggestedFeature,
  SuggestedTask,
  SuggestedSubtask,
} from "@/server/actions/ai-sprint";
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

// Legacy alias
type SuggestedStory = SuggestedFeature;

interface SprintPlanReviewProps {
  plan: GeneratedSprintPlan | GeneratedTicketsPlan;
  onConfirm: (editedPlan: {
    sprint_name: string;
    duration_days: number;
    features: {
      title: string;
      description: string;
      priority: "low" | "medium" | "high" | "critical";
      tasks: {
        title: string;
        required_role: string;
        labels: string[];
        priority: "low" | "medium" | "high" | "critical";
        story_points: number;
        assignee_id?: string;
        subtasks: {
          title: string;
          required_role: string;
          priority: "low" | "medium" | "high" | "critical";
          assignee_id?: string;
        }[];
      }[];
    }[];
  }) => void;
  onBack: () => void;
  isConfirming: boolean;
  mode?: "sprint" | "tickets";
  confirmButtonText?: string;
  confirmingText?: string;
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
  mode = "sprint",
  confirmButtonText = "Confirm & Create Sprint",
  confirmingText = "Creating...",
}: SprintPlanReviewProps) {
  const isTicketsMode = mode === "tickets";
  const sprintPlan = plan as GeneratedSprintPlan;
  const [sprintName, setSprintName] = useState(isTicketsMode ? "" : sprintPlan.sprint_name);
  const [durationDays, setDurationDays] = useState(isTicketsMode ? 14 : sprintPlan.duration_days);
  const [features, setFeatures] = useState<SuggestedFeature[]>(plan.features);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(
    new Set(plan.features.map((_, i) => i))
  );
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleFeature = (index: number) => {
    setExpandedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleTask = (featureIndex: number, taskIndex: number) => {
    const key = `${featureIndex}-${taskIndex}`;
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // --- Feature updates ---

  const updateFeature = (index: number, field: string, value: string | number) => {
    setFeatures((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
    setExpandedFeatures((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  const addFeature = () => {
    const newIndex = features.length;
    setFeatures((prev) => [
      ...prev,
      {
        title: "New Feature",
        description: "",
        priority: "medium",
        tasks: [
          {
            title: "New Task",
            required_role: "Full-Stack",
            labels: [],
            priority: "medium",
            story_points: 3,
            subtasks: [],
            suggested_assignees: [],
          },
        ],
      },
    ]);
    setExpandedFeatures((prev) => new Set([...prev, newIndex]));
  };

  // --- Task updates ---

  const updateTask = (featureIndex: number, taskIndex: number, field: string, value: string | number) => {
    setFeatures((prev) => {
      const updated = [...prev];
      const feature = { ...updated[featureIndex] };
      const tasks = [...feature.tasks];
      tasks[taskIndex] = { ...tasks[taskIndex], [field]: field === "story_points" ? Number(value) : value };
      feature.tasks = tasks;
      updated[featureIndex] = feature;
      return updated;
    });
  };

  const removeTask = (featureIndex: number, taskIndex: number) => {
    setFeatures((prev) => {
      const updated = [...prev];
      const feature = { ...updated[featureIndex] };
      feature.tasks = feature.tasks.filter((_, i) => i !== taskIndex);
      updated[featureIndex] = feature;
      return updated;
    });
  };

  const addTask = (featureIndex: number) => {
    setFeatures((prev) => {
      const updated = [...prev];
      const feature = { ...updated[featureIndex] };
      feature.tasks = [
        ...feature.tasks,
        {
          title: "New Task",
          required_role: "Full-Stack",
          labels: [],
          priority: feature.priority,
          story_points: 3,
          subtasks: [],
          suggested_assignees: plan.members.map((m) => ({
            userId: m.id,
            name: m.name || "Unknown",
            confidence: "low" as const,
          })),
        },
      ];
      updated[featureIndex] = feature;
      return updated;
    });
  };

  // --- Subtask updates ---

  const updateSubtask = (featureIndex: number, taskIndex: number, subtaskIndex: number, field: string, value: string) => {
    setFeatures((prev) => {
      const updated = [...prev];
      const feature = { ...updated[featureIndex] };
      const tasks = [...feature.tasks];
      const task = { ...tasks[taskIndex] };
      const subtasks = [...task.subtasks];
      subtasks[subtaskIndex] = { ...subtasks[subtaskIndex], [field]: value };
      task.subtasks = subtasks;
      tasks[taskIndex] = task;
      feature.tasks = tasks;
      updated[featureIndex] = feature;
      return updated;
    });
  };

  const removeSubtask = (featureIndex: number, taskIndex: number, subtaskIndex: number) => {
    setFeatures((prev) => {
      const updated = [...prev];
      const feature = { ...updated[featureIndex] };
      const tasks = [...feature.tasks];
      const task = { ...tasks[taskIndex] };
      task.subtasks = task.subtasks.filter((_, i) => i !== subtaskIndex);
      tasks[taskIndex] = task;
      feature.tasks = tasks;
      updated[featureIndex] = feature;
      return updated;
    });
  };

  const addSubtask = (featureIndex: number, taskIndex: number) => {
    setFeatures((prev) => {
      const updated = [...prev];
      const feature = { ...updated[featureIndex] };
      const tasks = [...feature.tasks];
      const task = { ...tasks[taskIndex] };
      task.subtasks = [
        ...task.subtasks,
        {
          title: "New Subtask",
          required_role: task.required_role,
          priority: task.priority,
          suggested_assignees: plan.members.map((m) => ({
            userId: m.id,
            name: m.name || "Unknown",
            confidence: "low" as const,
          })),
        },
      ];
      tasks[taskIndex] = task;
      feature.tasks = tasks;
      updated[featureIndex] = feature;
      return updated;
    });
    // Auto-expand the task to show the new subtask
    const key = `${featureIndex}-${taskIndex}`;
    setExpandedTasks((prev) => new Set([...prev, key]));
  };

  // Recompute role distribution from current state
  const roleDistribution = useMemo(() => {
    const map = new Map<string, { story_points: number; task_count: number }>();
    features.forEach((feature) => {
      feature.tasks.forEach((task) => {
        const role = task.required_role;
        const existing = map.get(role) || { story_points: 0, task_count: 0 };
        existing.story_points += task.story_points;
        existing.task_count += 1;
        map.set(role, existing);
      });
    });
    return Array.from(map.entries()).map(([role, data]) => ({
      role,
      story_points: data.story_points,
      task_count: data.task_count,
    }));
  }, [features]);

  const handleConfirm = () => {
    // Filter out features with no tasks
    const validFeatures = features.filter((f) => f.tasks.length > 0);
    onConfirm({
      sprint_name: sprintName,
      duration_days: durationDays,
      features: validFeatures.map((feature) => ({
        title: feature.title,
        description: feature.description,
        priority: feature.priority,
        tasks: feature.tasks.map((task) => ({
          title: task.title,
          required_role: task.required_role,
          labels: task.labels,
          priority: task.priority,
          story_points: task.story_points,
          assignee_id: task.selected_assignee_id,
          subtasks: task.subtasks.map((subtask) => ({
            title: subtask.title,
            required_role: subtask.required_role,
            priority: subtask.priority,
            assignee_id: subtask.selected_assignee_id,
          })),
        })),
      })),
    });
  };

  const totalTasks = features.reduce((sum, f) => sum + f.tasks.length, 0);
  const totalSubtasks = features.reduce(
    (sum, f) => sum + f.tasks.reduce((tSum, t) => tSum + t.subtasks.length, 0),
    0
  );
  const totalPoints = features.reduce(
    (sum, f) => sum + f.tasks.reduce((tSum, t) => tSum + t.story_points, 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* Sprint Header */}
      <div className="space-y-3">
        {!isTicketsMode && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Sprint Name</Label>
            <Input
              value={sprintName}
              onChange={(e) => setSprintName(e.target.value)}
              className="text-base font-semibold"
            />
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          {!isTicketsMode && (
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
          )}
          <span className="text-sm text-muted-foreground">{features.length} features</span>
          <span className="text-sm text-muted-foreground">{totalTasks} tasks</span>
          <span className="text-sm text-muted-foreground">{totalSubtasks} subtasks</span>
          <span className="text-sm text-muted-foreground">{totalPoints} points</span>
        </div>
      </div>

      {/* Role Distribution (recomputed live) */}
      {roleDistribution.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <RoleDistributionChart distribution={roleDistribution} />
        </div>
      )}

      {/* Features, Tasks & Subtasks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Features & Tasks</h4>
          <Button variant="outline" size="sm" onClick={addFeature} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Feature
          </Button>
        </div>
        <div className="space-y-2">
          {features.map((feature, featureIndex) => {
            const isExpanded = expandedFeatures.has(featureIndex);

            return (
              <div key={featureIndex} className="border rounded-lg overflow-hidden">
                {/* Feature header */}
                <div className="flex items-center gap-2 p-3 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => toggleFeature(featureIndex)}
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
                    value={feature.title}
                    onChange={(e) => updateFeature(featureIndex, "title", e.target.value)}
                    className="h-7 text-sm font-medium flex-1 bg-background"
                  />

                  {/* Priority select */}
                  <select
                    value={feature.priority}
                    onChange={(e) => updateFeature(featureIndex, "priority", e.target.value)}
                    className="h-7 text-xs border rounded px-1.5 bg-background capitalize"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>

                  {/* Task count badge */}
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {feature.tasks.length} tasks
                  </Badge>

                  {/* Remove feature */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeature(featureIndex)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    title="Remove feature"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Feature description (editable, shown when expanded) */}
                {isExpanded && (
                  <div className="px-3 py-2 pl-9 border-t bg-muted/10">
                    <Input
                      value={feature.description}
                      onChange={(e) => updateFeature(featureIndex, "description", e.target.value)}
                      placeholder="Feature description..."
                      className="h-7 text-xs text-muted-foreground bg-transparent border-transparent hover:border-input focus:border-input"
                    />
                  </div>
                )}

                {/* Tasks */}
                {isExpanded && (
                  <div className="border-t">
                    <div className="divide-y">
                      {feature.tasks.map((task, taskIndex) => {
                        const taskKey = `${featureIndex}-${taskIndex}`;
                        const isTaskExpanded = expandedTasks.has(taskKey);

                        return (
                          <div key={taskIndex}>
                            <TaskRow
                              task={task}
                              members={plan.members}
                              isExpanded={isTaskExpanded}
                              hasSubtasks={task.subtasks.length > 0}
                              onToggle={() => toggleTask(featureIndex, taskIndex)}
                              onUpdate={(field, value) =>
                                updateTask(featureIndex, taskIndex, field, value)
                              }
                              onRemove={() => removeTask(featureIndex, taskIndex)}
                            />
                            {/* Subtasks */}
                            {isTaskExpanded && (
                              <div className="border-t bg-muted/5">
                                <div className="divide-y">
                                  {task.subtasks.map((subtask, subtaskIndex) => (
                                    <SubtaskRow
                                      key={subtaskIndex}
                                      subtask={subtask}
                                      members={plan.members}
                                      onUpdate={(field, value) =>
                                        updateSubtask(featureIndex, taskIndex, subtaskIndex, field, value)
                                      }
                                      onRemove={() => removeSubtask(featureIndex, taskIndex, subtaskIndex)}
                                    />
                                  ))}
                                </div>
                                <div className="px-3 py-1.5 pl-16 border-t bg-muted/10">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => addSubtask(featureIndex, taskIndex)}
                                    className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
                                  >
                                    <Plus className="h-2.5 w-2.5 mr-1" />
                                    Add Subtask
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="px-3 py-2 pl-9 border-t bg-muted/20">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addTask(featureIndex)}
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
          disabled={isConfirming || features.length === 0}
        >
          {isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {confirmingText}
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              {confirmButtonText}
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
  isExpanded,
  hasSubtasks,
  onToggle,
  onUpdate,
  onRemove,
}: {
  task: SuggestedTask;
  members: { id: string; name: string | null; designation: string | null }[];
  isExpanded: boolean;
  hasSubtasks: boolean;
  onToggle: () => void;
  onUpdate: (field: string, value: string | number) => void;
  onRemove: () => void;
}) {
  const topSuggestion = task.suggested_assignees[0];
  const defaultAssignee =
    task.selected_assignee_id ||
    (topSuggestion?.confidence === "high" ? topSuggestion.userId : "unassigned");

  return (
    <div className="flex items-center gap-2 px-3 py-2 pl-9 bg-background">
      {/* Expand/collapse for subtasks */}
      <button
        type="button"
        onClick={onToggle}
        className="shrink-0 p-0.5 hover:bg-muted rounded"
        title={hasSubtasks ? "Toggle subtasks" : "No subtasks yet (click to expand)"}
      >
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Editable title */}
      <Input
        value={task.title}
        onChange={(e) => onUpdate("title", e.target.value)}
        className="h-7 text-sm flex-1 bg-transparent border-transparent hover:border-input focus:border-input"
      />

      {/* Story points */}
      <Input
        type="number"
        min={0}
        max={20}
        value={task.story_points}
        onChange={(e) => onUpdate("story_points", parseInt(e.target.value) || 0)}
        className="h-7 w-14 text-xs text-center bg-background"
        title="Story points"
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

      {/* Subtask count badge */}
      {task.subtasks.length > 0 && (
        <Badge variant="outline" className="text-[10px] shrink-0">
          {task.subtasks.length}
        </Badge>
      )}

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

// --- Editable Subtask Row ---

function SubtaskRow({
  subtask,
  members,
  onUpdate,
  onRemove,
}: {
  subtask: SuggestedSubtask;
  members: { id: string; name: string | null; designation: string | null }[];
  onUpdate: (field: string, value: string) => void;
  onRemove: () => void;
}) {
  const topSuggestion = subtask.suggested_assignees[0];
  const defaultAssignee =
    subtask.selected_assignee_id ||
    (topSuggestion?.confidence === "high" ? topSuggestion.userId : "unassigned");

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 pl-16 bg-background/50">
      <span className="text-muted-foreground text-[10px] shrink-0">--</span>

      {/* Editable title */}
      <Input
        value={subtask.title}
        onChange={(e) => onUpdate("title", e.target.value)}
        className="h-6 text-xs flex-1 bg-transparent border-transparent hover:border-input focus:border-input"
      />

      {/* Role select */}
      <select
        value={subtask.required_role}
        onChange={(e) => onUpdate("required_role", e.target.value)}
        className="h-6 text-[10px] border rounded px-1 bg-background shrink-0"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      {/* Priority select */}
      <select
        value={subtask.priority}
        onChange={(e) => onUpdate("priority", e.target.value)}
        className="h-6 text-[10px] border rounded px-1 bg-background capitalize shrink-0"
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {/* Assignee dropdown */}
      <select
        value={defaultAssignee}
        onChange={(e) => onUpdate("selected_assignee_id", e.target.value === "unassigned" ? "" : e.target.value)}
        className="h-6 text-[10px] border rounded px-1 bg-background max-w-[100px] truncate shrink-0"
      >
        <option value="unassigned">Unassigned</option>
        {subtask.suggested_assignees.map((suggestion) => (
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
          .filter((m) => !subtask.suggested_assignees.some((s) => s.userId === m.id))
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || "Unknown"}
            </option>
          ))}
      </select>

      {/* Remove subtask */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
        title="Remove subtask"
      >
        <Trash2 className="h-2.5 w-2.5" />
      </Button>
    </div>
  );
}
