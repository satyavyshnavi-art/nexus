import { TaskStatus } from "@prisma/client";

/**
 * Calculates the progress percentage of a task.
 * For tasks with subtasks: progress is based on completed subtasks
 * For tasks without subtasks: progress is based on current status
 *
 * @param task - Task object with status and optional childTasks array
 * @returns Progress percentage (0-100)
 */
export function calculateTaskProgress(task: {
  status: TaskStatus;
  childTasks?: Array<{ status: TaskStatus }>;
}): number {
  // If task has child tasks (is a parent), calculate based on children
  if (task.childTasks && task.childTasks.length > 0) {
    const completedCount = task.childTasks.filter(
      (t) => t.status === TaskStatus.done
    ).length;
    return Math.round((completedCount / task.childTasks.length) * 100);
  }

  // Otherwise, map status to progress percentage
  switch (task.status) {
    case TaskStatus.todo:
      return 0;
    case TaskStatus.progress:
      return 50;
    case TaskStatus.review:
      return 75;
    case TaskStatus.done:
      return 100;
    default:
      return 0;
  }
}

/**
 * Returns the color for a given progress percentage
 * Used for visual indicators in the UI
 *
 * @param percentage - Progress percentage (0-100)
 * @returns Color value (hex, rgb, or tailwind class)
 */
export function getProgressColor(percentage: number): string {
  if (percentage === 0) return "bg-red-100 text-red-700"; // Not started
  if (percentage <= 25) return "bg-orange-100 text-orange-700"; // Just started
  if (percentage <= 50) return "bg-yellow-100 text-yellow-700"; // In progress
  if (percentage <= 75) return "bg-blue-100 text-blue-700"; // Almost done
  return "bg-green-100 text-green-700"; // Complete
}

/**
 * Returns a human-readable label for a progress percentage
 *
 * @param percentage - Progress percentage (0-100)
 * @returns Progress label
 */
export function getProgressLabel(percentage: number): string {
  if (percentage === 0) return "Not Started";
  if (percentage < 50) return "In Progress";
  if (percentage < 100) return "Almost Done";
  return "Complete";
}

/**
 * Returns a detailed progress object with all relevant information
 *
 * @param task - Task object with status and optional childTasks
 * @returns Object with percentage, color, label, and status
 */
export function getTaskProgressDetails(task: {
  status: TaskStatus;
  childTasks?: Array<{ status: TaskStatus }>;
}) {
  const percentage = calculateTaskProgress(task);
  const color = getProgressColor(percentage);
  const label = getProgressLabel(percentage);

  return {
    percentage,
    color,
    label,
    status: task.status,
    hasSubtasks: task.childTasks ? task.childTasks.length > 0 : false,
    subtaskCount: task.childTasks ? task.childTasks.length : 0,
    completedSubtasks: task.childTasks
      ? task.childTasks.filter((t) => t.status === TaskStatus.done).length
      : 0,
  };
}

/**
 * Calculates sprint-level progress statistics
 * Aggregates progress from multiple tasks
 *
 * @param tasks - Array of task objects with status and optional childTasks
 * @returns Sprint progress statistics
 */
export function calculateSprintProgress(
  tasks: Array<{
    id: string;
    status: TaskStatus;
    childTasks?: Array<{ status: TaskStatus }>;
  }>
) {
  if (tasks.length === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      todoTasks: 0,
      reviewTasks: 0,
      overallProgress: 0,
      averageProgress: 0,
    };
  }

  let totalTasks = 0;
  let completedTasks = 0;
  let inProgressTasks = 0;
  let todoTasks = 0;
  let reviewTasks = 0;
  let totalProgress = 0;

  tasks.forEach((task) => {
    // Count parent tasks
    totalTasks += 1;

    // Add status counts
    if (task.status === TaskStatus.done) {
      completedTasks += 1;
    } else if (task.status === TaskStatus.progress) {
      inProgressTasks += 1;
    } else if (task.status === TaskStatus.todo) {
      todoTasks += 1;
    } else if (task.status === TaskStatus.review) {
      reviewTasks += 1;
    }

    // Calculate task progress
    const progress = calculateTaskProgress(task);
    totalProgress += progress;

    // Count subtasks
    if (task.childTasks && task.childTasks.length > 0) {
      totalTasks += task.childTasks.length;
      task.childTasks.forEach((subtask) => {
        if (subtask.status === TaskStatus.done) {
          completedTasks += 1;
        } else if (subtask.status === TaskStatus.progress) {
          inProgressTasks += 1;
        } else if (subtask.status === TaskStatus.todo) {
          todoTasks += 1;
        } else if (subtask.status === TaskStatus.review) {
          reviewTasks += 1;
        }
      });
    }
  });

  const averageProgress =
    tasks.length > 0 ? Math.round(totalProgress / tasks.length) : 0;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    reviewTasks,
    overallProgress: Math.round((completedTasks / totalTasks) * 100),
    averageProgress,
  };
}
