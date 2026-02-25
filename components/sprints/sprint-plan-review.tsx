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
  Tag,
} from "lucide-react";

interface SprintPlanReviewProps {
  plan: GeneratedSprintPlan | GeneratedTicketsPlan;
  onConfirm: (editedPlan: {
    sprint_name: string;
    duration_days: number;
    tasks: {
      title: string;
      category: string;
      required_role: string;
      labels: string[];
      priority: "low" | "medium" | "high" | "critical";
      assignee_id?: string;
      subtasks: {
        title: string;
        required_role: string;
        priority: "low" | "medium" | "high" | "critical";
        assignee_id?: string;
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
  const [tasks, setTasks] = useState<SuggestedTask[]>(plan.tasks);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Group tasks by category
  const tasksByCategory = useMemo(() => {
    const map = new Map<string, { tasks: SuggestedTask[]; indices: number[] }>();
    tasks.forEach((task, index) => {
      const cat = task.category || "General";
      const existing = map.get(cat) || { tasks: [], indices: [] };
      existing.tasks.push(task);
      existing.indices.push(index);
      map.set(cat, existing);
    });
    return map;
  }, [tasks]);

  const categories = useMemo(() => Array.from(tasksByCategory.keys()), [tasksByCategory]);

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const toggleTask = (taskIndex: number) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskIndex)) next.delete(taskIndex);
      else next.add(taskIndex);
      return next;
    });
  };

  // --- Task updates ---

  const updateTask = (taskIndex: number, field: string, value: string | number) => {
    setTasks((prev) => {
      const updated = [...prev];
      updated[taskIndex] = {
        ...updated[taskIndex],
        [field]: value,
      };
      return updated;
    });
  };

  const removeTask = (taskIndex: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== taskIndex));
    setExpandedTasks((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < taskIndex) next.add(i);
        else if (i > taskIndex) next.add(i - 1);
      });
      return next;
    });
  };

  const addTask = (category: string) => {
    setTasks((prev) => [
      ...prev,
      {
        title: "New Task",
        category,
        required_role: "Full-Stack",
        labels: [],
        priority: "medium",
        story_points: 0,
        subtasks: [],
        suggested_assignees: plan.members.map((m) => ({
          userId: m.id,
          name: m.name || "Unknown",
          confidence: "low" as const,
        })),
      },
    ]);
  };

  // --- Subtask updates ---

  const updateSubtask = (taskIndex: number, subtaskIndex: number, field: string, value: string) => {
    setTasks((prev) => {
      const updated = [...prev];
      const task = { ...updated[taskIndex] };
      const subtasks = [...task.subtasks];
      subtasks[subtaskIndex] = { ...subtasks[subtaskIndex], [field]: value };
      task.subtasks = subtasks;
      updated[taskIndex] = task;
      return updated;
    });
  };

  const removeSubtask = (taskIndex: number, subtaskIndex: number) => {
    setTasks((prev) => {
      const updated = [...prev];
      const task = { ...updated[taskIndex] };
      task.subtasks = task.subtasks.filter((_, i) => i !== subtaskIndex);
      updated[taskIndex] = task;
      return updated;
    });
  };

  const addSubtask = (taskIndex: number) => {
    setTasks((prev) => {
      const updated = [...prev];
      const task = { ...updated[taskIndex] };
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
      updated[taskIndex] = task;
      return updated;
    });
    // Auto-expand the task to show the new subtask
    setExpandedTasks((prev) => new Set([...prev, taskIndex]));
  };

  // Recompute role distribution from current state
  const roleDistribution = useMemo(() => {
    const map = new Map<string, { task_count: number }>();
    tasks.forEach((task) => {
      const role = task.required_role;
      const existing = map.get(role) || { task_count: 0 };
      existing.task_count += 1;
      map.set(role, existing);
    });
    return Array.from(map.entries()).map(([role, data]) => ({
      role,
      task_count: data.task_count,
    }));
  }, [tasks]);

  const handleConfirm = () => {
    onConfirm({
      sprint_name: sprintName,
      duration_days: durationDays,
      tasks: tasks.map((task) => ({
        title: task.title,
        category: task.category || "General",
        required_role: task.required_role,
        labels: task.labels,
        priority: task.priority,
        assignee_id: task.selected_assignee_id,
        subtasks: task.subtasks.map((subtask) => ({
          title: subtask.title,
          required_role: subtask.required_role,
          priority: subtask.priority,
          assignee_id: subtask.selected_assignee_id,
        })),
      })),
    });
  };

  const totalTasks = tasks.length;
  const totalSubtasks = tasks.reduce((sum, t) => sum + t.subtasks.length, 0);

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
          <span className="text-sm text-muted-foreground">{categories.length} categories</span>
          <span className="text-sm text-muted-foreground">{totalTasks} tasks</span>
          <span className="text-sm text-muted-foreground">{totalSubtasks} subtasks</span>
        </div>
      </div>

      {/* Role Distribution (recomputed live) */}
      {roleDistribution.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <RoleDistributionChart distribution={roleDistribution} />
        </div>
      )}

      {/* Tasks grouped by Category */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Tasks by Category</h4>
        </div>
        <div className="space-y-2">
          {categories.map((category) => {
            const group = tasksByCategory.get(category)!;
            const isCollapsed = collapsedCategories.has(category);

            return (
              <div key={category} className="border rounded-lg overflow-hidden">
                {/* Category header */}
                <div className="flex items-center gap-2 p-3 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="shrink-0 p-0.5 hover:bg-muted rounded"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium flex-1">{category}</span>

                  {/* Task count badge */}
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {group.tasks.length} tasks
                  </Badge>
                </div>

                {/* Tasks */}
                {!isCollapsed && (
                  <div className="border-t">
                    <div className="divide-y">
                      {group.tasks.map((task, groupTaskIdx) => {
                        const globalIndex = group.indices[groupTaskIdx];
                        const isTaskExpanded = expandedTasks.has(globalIndex);

                        return (
                          <div key={globalIndex}>
                            <TaskRow
                              task={task}
                              members={plan.members}
                              isExpanded={isTaskExpanded}
                              hasSubtasks={task.subtasks.length > 0}
                              onToggle={() => toggleTask(globalIndex)}
                              onUpdate={(field, value) =>
                                updateTask(globalIndex, field, value)
                              }
                              onRemove={() => removeTask(globalIndex)}
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
                                        updateSubtask(globalIndex, subtaskIndex, field, value)
                                      }
                                      onRemove={() => removeSubtask(globalIndex, subtaskIndex)}
                                    />
                                  ))}
                                </div>
                                <div className="px-3 py-1.5 pl-16 border-t bg-muted/10">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => addSubtask(globalIndex)}
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
                        onClick={() => addTask(category)}
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
          disabled={isConfirming || tasks.length === 0}
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
