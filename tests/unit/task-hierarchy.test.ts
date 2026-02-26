import { describe, it, expect } from "vitest";
import {
  calculateTaskProgress,
  getProgressColor,
  getProgressLabel,
  getTaskProgressDetails,
  calculateSprintProgress,
} from "@/lib/utils/task-progress";

// Mirror the Prisma TaskStatus enum values for test usage
const TaskStatus = {
  todo: "todo" as const,
  progress: "progress" as const,
  review: "review" as const,
  done: "done" as const,
};

describe("Task Hierarchy and Progress", () => {
  describe("TaskType enum values", () => {
    it("should have the correct task type values", () => {
      // These values come from the Prisma schema enum TaskType
      const taskTypes = ["story", "task", "bug", "subtask"];
      expect(taskTypes).toContain("story");
      expect(taskTypes).toContain("task");
      expect(taskTypes).toContain("bug");
      expect(taskTypes).toContain("subtask");
      expect(taskTypes).toHaveLength(4);
    });
  });

  describe("TaskStatus enum values", () => {
    it("should have all four status values", () => {
      expect(TaskStatus.todo).toBe("todo");
      expect(TaskStatus.progress).toBe("progress");
      expect(TaskStatus.review).toBe("review");
      expect(TaskStatus.done).toBe("done");
    });
  });

  describe("TaskPriority enum values", () => {
    it("should have the correct priority values", () => {
      const priorities = ["low", "medium", "high", "critical"];
      expect(priorities).toContain("low");
      expect(priorities).toContain("medium");
      expect(priorities).toContain("high");
      expect(priorities).toContain("critical");
      expect(priorities).toHaveLength(4);
    });
  });

  describe("calculateTaskProgress", () => {
    describe("tasks without subtasks (status-based)", () => {
      it("should return 0 for todo status", () => {
        expect(calculateTaskProgress({ status: TaskStatus.todo })).toBe(0);
      });

      it("should return 50 for progress status", () => {
        expect(calculateTaskProgress({ status: TaskStatus.progress })).toBe(50);
      });

      it("should return 75 for review status", () => {
        expect(calculateTaskProgress({ status: TaskStatus.review })).toBe(75);
      });

      it("should return 100 for done status", () => {
        expect(calculateTaskProgress({ status: TaskStatus.done })).toBe(100);
      });

      it("should return 0 for task with empty childTasks array", () => {
        expect(
          calculateTaskProgress({ status: TaskStatus.todo, childTasks: [] })
        ).toBe(0);
      });
    });

    describe("tasks with subtasks (child-based)", () => {
      it("should return 0 when no subtasks are done", () => {
        const result = calculateTaskProgress({
          status: TaskStatus.progress,
          childTasks: [
            { status: TaskStatus.todo },
            { status: TaskStatus.todo },
            { status: TaskStatus.todo },
          ],
        });
        expect(result).toBe(0);
      });

      it("should return 100 when all subtasks are done", () => {
        const result = calculateTaskProgress({
          status: TaskStatus.progress,
          childTasks: [
            { status: TaskStatus.done },
            { status: TaskStatus.done },
            { status: TaskStatus.done },
          ],
        });
        expect(result).toBe(100);
      });

      it("should return correct percentage for partial completion", () => {
        const result = calculateTaskProgress({
          status: TaskStatus.progress,
          childTasks: [
            { status: TaskStatus.done },
            { status: TaskStatus.todo },
            { status: TaskStatus.progress },
          ],
        });
        // 1 done out of 3 = 33.33... rounded to 33
        expect(result).toBe(33);
      });

      it("should return 50 when half the subtasks are done", () => {
        const result = calculateTaskProgress({
          status: TaskStatus.progress,
          childTasks: [
            { status: TaskStatus.done },
            { status: TaskStatus.todo },
          ],
        });
        expect(result).toBe(50);
      });

      it("should handle single subtask done", () => {
        const result = calculateTaskProgress({
          status: TaskStatus.progress,
          childTasks: [{ status: TaskStatus.done }],
        });
        expect(result).toBe(100);
      });

      it("should handle single subtask not done", () => {
        const result = calculateTaskProgress({
          status: TaskStatus.progress,
          childTasks: [{ status: TaskStatus.review }],
        });
        // review is not "done", so 0 out of 1
        expect(result).toBe(0);
      });

      it("should only count 'done' status as completed (not review)", () => {
        const result = calculateTaskProgress({
          status: TaskStatus.progress,
          childTasks: [
            { status: TaskStatus.review },
            { status: TaskStatus.review },
            { status: TaskStatus.done },
          ],
        });
        // 1 done out of 3 = 33
        expect(result).toBe(33);
      });
    });
  });

  describe("getProgressColor", () => {
    it("should return red for 0%", () => {
      expect(getProgressColor(0)).toContain("red");
    });

    it("should return orange for low percentages (1-25)", () => {
      expect(getProgressColor(10)).toContain("orange");
      expect(getProgressColor(25)).toContain("orange");
    });

    it("should return yellow for mid percentages (26-50)", () => {
      expect(getProgressColor(30)).toContain("yellow");
      expect(getProgressColor(50)).toContain("yellow");
    });

    it("should return blue for high percentages (51-75)", () => {
      expect(getProgressColor(60)).toContain("blue");
      expect(getProgressColor(75)).toContain("blue");
    });

    it("should return green for very high percentages (76+)", () => {
      expect(getProgressColor(80)).toContain("green");
      expect(getProgressColor(100)).toContain("green");
    });
  });

  describe("getProgressLabel", () => {
    it('should return "Not Started" for 0%', () => {
      expect(getProgressLabel(0)).toBe("Not Started");
    });

    it('should return "In Progress" for 1-49%', () => {
      expect(getProgressLabel(1)).toBe("In Progress");
      expect(getProgressLabel(25)).toBe("In Progress");
      expect(getProgressLabel(49)).toBe("In Progress");
    });

    it('should return "Almost Done" for 50-99%', () => {
      expect(getProgressLabel(50)).toBe("Almost Done");
      expect(getProgressLabel(75)).toBe("Almost Done");
      expect(getProgressLabel(99)).toBe("Almost Done");
    });

    it('should return "Complete" for 100%', () => {
      expect(getProgressLabel(100)).toBe("Complete");
    });
  });

  describe("getTaskProgressDetails", () => {
    it("should return full details for task without subtasks", () => {
      const details = getTaskProgressDetails({ status: TaskStatus.done });
      expect(details.percentage).toBe(100);
      expect(details.label).toBe("Complete");
      expect(details.color).toContain("green");
      expect(details.status).toBe("done");
      expect(details.hasSubtasks).toBe(false);
      expect(details.subtaskCount).toBe(0);
      expect(details.completedSubtasks).toBe(0);
    });

    it("should return full details for task with subtasks", () => {
      const details = getTaskProgressDetails({
        status: TaskStatus.progress,
        childTasks: [
          { status: TaskStatus.done },
          { status: TaskStatus.todo },
          { status: TaskStatus.done },
        ],
      });
      // 2 done out of 3 = 67%
      expect(details.percentage).toBe(67);
      expect(details.hasSubtasks).toBe(true);
      expect(details.subtaskCount).toBe(3);
      expect(details.completedSubtasks).toBe(2);
      expect(details.label).toBe("Almost Done");
    });

    it("should handle task with no childTasks property", () => {
      const details = getTaskProgressDetails({ status: TaskStatus.todo });
      expect(details.hasSubtasks).toBe(false);
      expect(details.subtaskCount).toBe(0);
      expect(details.completedSubtasks).toBe(0);
    });
  });

  describe("calculateSprintProgress", () => {
    it("should return zeroed stats for empty task array", () => {
      const result = calculateSprintProgress([]);
      expect(result.totalTasks).toBe(0);
      expect(result.completedTasks).toBe(0);
      expect(result.inProgressTasks).toBe(0);
      expect(result.todoTasks).toBe(0);
      expect(result.reviewTasks).toBe(0);
      expect(result.overallProgress).toBe(0);
      expect(result.averageProgress).toBe(0);
    });

    it("should count status categories correctly for tasks without subtasks", () => {
      const tasks = [
        { id: "1", status: TaskStatus.todo },
        { id: "2", status: TaskStatus.progress },
        { id: "3", status: TaskStatus.review },
        { id: "4", status: TaskStatus.done },
      ];
      const result = calculateSprintProgress(tasks);
      expect(result.todoTasks).toBe(1);
      expect(result.inProgressTasks).toBe(1);
      expect(result.reviewTasks).toBe(1);
      expect(result.completedTasks).toBe(1);
      // totalTasks = 4 (no subtasks)
      expect(result.totalTasks).toBe(4);
    });

    it("should include subtasks in total count and status counts", () => {
      const tasks = [
        {
          id: "1",
          status: TaskStatus.progress,
          childTasks: [
            { status: TaskStatus.done },
            { status: TaskStatus.todo },
          ],
        },
      ];
      const result = calculateSprintProgress(tasks);
      // 1 parent + 2 subtasks = 3 total
      expect(result.totalTasks).toBe(3);
      // 1 done subtask, parent is progress
      expect(result.completedTasks).toBe(1);
      expect(result.inProgressTasks).toBe(1);
      expect(result.todoTasks).toBe(1);
    });

    it("should calculate average progress based on parent tasks only", () => {
      const tasks = [
        { id: "1", status: TaskStatus.done },   // 100%
        { id: "2", status: TaskStatus.todo },    // 0%
      ];
      const result = calculateSprintProgress(tasks);
      // Average of 100 and 0 = 50
      expect(result.averageProgress).toBe(50);
    });

    it("should calculate overallProgress as completedTasks/totalTasks", () => {
      const tasks = [
        { id: "1", status: TaskStatus.done },
        { id: "2", status: TaskStatus.done },
        { id: "3", status: TaskStatus.todo },
        { id: "4", status: TaskStatus.todo },
      ];
      const result = calculateSprintProgress(tasks);
      // 2/4 = 50%
      expect(result.overallProgress).toBe(50);
    });

    it("should handle all tasks completed", () => {
      const tasks = [
        { id: "1", status: TaskStatus.done },
        { id: "2", status: TaskStatus.done },
      ];
      const result = calculateSprintProgress(tasks);
      expect(result.overallProgress).toBe(100);
      expect(result.averageProgress).toBe(100);
      expect(result.completedTasks).toBe(2);
    });
  });

  describe("recalculateTicketStatus logic (unit test of the algorithm)", () => {
    // The actual function is internal to tasks.ts and not exported,
    // so we test the algorithm independently here.

    function computeNewStatus(
      childStatuses: string[],
      currentStatus: string
    ): string | null {
      // If ticket is already "done", skip recalculation (admin override)
      if (currentStatus === "done") return null;

      const total = childStatuses.length;
      if (total === 0) return null;

      const doneCount = childStatuses.filter((s) => s === "done").length;

      let newStatus: string;
      if (doneCount === 0) {
        newStatus = "todo";
      } else if (doneCount < total) {
        newStatus = "progress";
      } else {
        // 100% done -> review (not done, that's admin override)
        newStatus = "review";
      }

      return newStatus !== currentStatus ? newStatus : null;
    }

    it("should return todo when no subtasks are done", () => {
      const result = computeNewStatus(["todo", "todo", "todo"], "progress");
      expect(result).toBe("todo");
    });

    it("should return progress when some subtasks are done", () => {
      const result = computeNewStatus(["done", "todo", "progress"], "todo");
      expect(result).toBe("progress");
    });

    it("should return review when all subtasks are done", () => {
      const result = computeNewStatus(["done", "done", "done"], "progress");
      expect(result).toBe("review");
    });

    it("should return null (no change) if ticket is already done (admin override)", () => {
      const result = computeNewStatus(["todo", "todo"], "done");
      expect(result).toBeNull();
    });

    it("should return null (no change) when there are no subtasks", () => {
      const result = computeNewStatus([], "todo");
      expect(result).toBeNull();
    });

    it("should return null when computed status matches current status", () => {
      const result = computeNewStatus(["done", "todo"], "progress");
      expect(result).toBeNull();
    });

    it("should detect transition from todo to progress when first subtask completes", () => {
      const result = computeNewStatus(["done", "todo", "todo"], "todo");
      expect(result).toBe("progress");
    });

    it("should detect transition to review when last subtask completes", () => {
      const result = computeNewStatus(["done", "done"], "progress");
      expect(result).toBe("review");
    });
  });
});
