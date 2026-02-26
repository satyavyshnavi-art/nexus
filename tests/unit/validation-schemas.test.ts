import { describe, it, expect, vi } from "vitest";

// Mock @prisma/client to provide enum values without needing the full Prisma runtime
vi.mock("@prisma/client", () => ({
  TaskType: {
    story: "story",
    task: "task",
    bug: "bug",
    subtask: "subtask",
  },
  TaskPriority: {
    low: "low",
    medium: "medium",
    high: "high",
    critical: "critical",
  },
  TaskStatus: {
    todo: "todo",
    progress: "progress",
    review: "review",
    done: "done",
  },
  SprintStatus: {
    planned: "planned",
    active: "active",
    completed: "completed",
  },
  UserRole: {
    admin: "admin",
    developer: "developer",
    reviewer: "reviewer",
  },
}));

import {
  createSprintSchema,
  updateSprintSchema,
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  createSubtaskSchema,
  createStorySchema,
  createTicketSchema,
  verticalSchema,
  createProjectSchema,
  commentSchema,
  createCommentSchema,
  fileUploadSchema,
  requestUploadUrlSchema,
  updateUserRoleSchema,
  updateUserProfileSchema,
  registerUserSchema,
  loginUserSchema,
  confirmedPlanSchema,
} from "@/lib/validation/schemas";

describe("Validation Schemas", () => {
  // ─── Sprint Schemas ───

  describe("createSprintSchema", () => {
    const validSprint = {
      projectId: "proj-uuid-123",
      name: "Sprint 1",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-15"),
    };

    it("should accept valid sprint data", () => {
      const result = createSprintSchema.safeParse(validSprint);
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const result = createSprintSchema.safeParse({
        ...validSprint,
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing projectId", () => {
      const { projectId, ...noProjectId } = validSprint;
      const result = createSprintSchema.safeParse(noProjectId);
      expect(result.success).toBe(false);
    });

    it("should reject name longer than 100 characters", () => {
      const result = createSprintSchema.safeParse({
        ...validSprint,
        name: "x".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("should accept name at exactly 100 characters", () => {
      const result = createSprintSchema.safeParse({
        ...validSprint,
        name: "x".repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it("should coerce string dates to Date objects", () => {
      const result = createSprintSchema.safeParse({
        ...validSprint,
        startDate: "2026-03-01",
        endDate: "2026-03-15",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing startDate", () => {
      const { startDate, ...noStart } = validSprint;
      const result = createSprintSchema.safeParse(noStart);
      expect(result.success).toBe(false);
    });

    it("should reject missing endDate", () => {
      const { endDate, ...noEnd } = validSprint;
      const result = createSprintSchema.safeParse(noEnd);
      expect(result.success).toBe(false);
    });
  });

  describe("updateSprintSchema", () => {
    it("should accept partial updates", () => {
      const result = updateSprintSchema.safeParse({ name: "Sprint 2" });
      expect(result.success).toBe(true);
    });

    it("should accept empty object (all fields optional)", () => {
      const result = updateSprintSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should reject name longer than 100 characters", () => {
      const result = updateSprintSchema.safeParse({
        name: "x".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name string", () => {
      const result = updateSprintSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });
  });

  // ─── Task Schemas ───

  describe("createTaskSchema", () => {
    const validTask = {
      title: "Implement login page",
      type: "task",
    };

    it("should accept valid task with minimal fields", () => {
      const result = createTaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it("should accept valid task with all optional fields", () => {
      const result = createTaskSchema.safeParse({
        sprintId: "sprint-uuid",
        title: "Fix CSS bug",
        description: "Button alignment is off on mobile",
        type: "bug",
        assigneeId: "user-uuid",
        parentTaskId: "parent-uuid",
        pushToGitHub: true,
        requiredRole: "developer",
        labels: ["frontend", "ui"],
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const result = createTaskSchema.safeParse({
        ...validTask,
        title: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing title", () => {
      const result = createTaskSchema.safeParse({ type: "task" });
      expect(result.success).toBe(false);
    });

    it("should reject title longer than 255 characters", () => {
      const result = createTaskSchema.safeParse({
        ...validTask,
        title: "x".repeat(256),
      });
      expect(result.success).toBe(false);
    });

    it("should accept all valid TaskType values", () => {
      const types = ["story", "task", "bug", "subtask"];
      types.forEach((type) => {
        const result = createTaskSchema.safeParse({ title: "Task", type });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid type value", () => {
      const result = createTaskSchema.safeParse({
        ...validTask,
        type: "epic",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing type", () => {
      const result = createTaskSchema.safeParse({ title: "Task" });
      expect(result.success).toBe(false);
    });

    it("should accept optional description", () => {
      const result = createTaskSchema.safeParse({
        ...validTask,
        description: "Some description",
      });
      expect(result.success).toBe(true);
    });

    it("should reject description longer than 5000 characters", () => {
      const result = createTaskSchema.safeParse({
        ...validTask,
        description: "x".repeat(5001),
      });
      expect(result.success).toBe(false);
    });

    it("should accept labels as array of strings", () => {
      const result = createTaskSchema.safeParse({
        ...validTask,
        labels: ["frontend", "backend"],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateTaskSchema", () => {
    it("should accept partial updates", () => {
      const result = updateTaskSchema.safeParse({ title: "Updated title" });
      expect(result.success).toBe(true);
    });

    it("should accept empty object (all fields optional)", () => {
      const result = updateTaskSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept all valid priority values", () => {
      const priorities = ["low", "medium", "high", "critical"];
      priorities.forEach((priority) => {
        const result = updateTaskSchema.safeParse({ priority });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid priority", () => {
      const result = updateTaskSchema.safeParse({ priority: "urgent" });
      expect(result.success).toBe(false);
    });

    it("should accept nullable assigneeId", () => {
      const result = updateTaskSchema.safeParse({ assigneeId: null });
      expect(result.success).toBe(true);
    });

    it("should accept nullable dueAt", () => {
      const result = updateTaskSchema.safeParse({ dueAt: null });
      expect(result.success).toBe(true);
    });

    it("should accept nullable estimatedDuration", () => {
      const result = updateTaskSchema.safeParse({ estimatedDuration: null });
      expect(result.success).toBe(true);
    });
  });

  describe("updateTaskStatusSchema", () => {
    it("should accept valid status update", () => {
      const result = updateTaskStatusSchema.safeParse({
        taskId: "task-uuid",
        newStatus: "done",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all valid task statuses", () => {
      const statuses = ["todo", "progress", "review", "done"];
      statuses.forEach((newStatus) => {
        const result = updateTaskStatusSchema.safeParse({
          taskId: "task-uuid",
          newStatus,
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid status", () => {
      const result = updateTaskStatusSchema.safeParse({
        taskId: "task-uuid",
        newStatus: "archived",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing taskId", () => {
      const result = updateTaskStatusSchema.safeParse({
        newStatus: "done",
      });
      expect(result.success).toBe(false);
    });

    it("should accept optional reviewerId", () => {
      const result = updateTaskStatusSchema.safeParse({
        taskId: "task-uuid",
        newStatus: "review",
        reviewerId: "reviewer-uuid",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("createSubtaskSchema", () => {
    it("should accept valid subtask", () => {
      const result = createSubtaskSchema.safeParse({
        title: "Add unit tests",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const result = createSubtaskSchema.safeParse({ title: "" });
      expect(result.success).toBe(false);
    });

    it("should accept optional priority", () => {
      const result = createSubtaskSchema.safeParse({
        title: "Subtask",
        priority: "high",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid priority", () => {
      const result = createSubtaskSchema.safeParse({
        title: "Subtask",
        priority: "urgent",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createStorySchema", () => {
    it("should accept valid story", () => {
      const result = createStorySchema.safeParse({
        sprintId: "sprint-uuid",
        title: "User Authentication",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing sprintId", () => {
      const result = createStorySchema.safeParse({
        title: "User Authentication",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty sprintId", () => {
      const result = createStorySchema.safeParse({
        sprintId: "",
        title: "User Authentication",
      });
      expect(result.success).toBe(false);
    });

    it("should accept optional labels", () => {
      const result = createStorySchema.safeParse({
        sprintId: "sprint-uuid",
        title: "Story",
        labels: ["auth", "security"],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("createTicketSchema", () => {
    it("should accept valid task ticket", () => {
      const result = createTicketSchema.safeParse({
        storyId: "story-uuid",
        title: "Implement login form",
        type: "task",
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid bug ticket", () => {
      const result = createTicketSchema.safeParse({
        storyId: "story-uuid",
        title: "Fix login crash",
        type: "bug",
      });
      expect(result.success).toBe(true);
    });

    it("should reject type other than task or bug", () => {
      const result = createTicketSchema.safeParse({
        storyId: "story-uuid",
        title: "Something",
        type: "story",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing storyId", () => {
      const result = createTicketSchema.safeParse({
        title: "Ticket",
        type: "task",
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── Vertical Schema ───

  describe("verticalSchema", () => {
    it("should accept valid vertical name", () => {
      const result = verticalSchema.safeParse({ name: "Engineering" });
      expect(result.success).toBe(true);
    });

    it("should accept name with spaces", () => {
      const result = verticalSchema.safeParse({ name: "Product Design" });
      expect(result.success).toBe(true);
    });

    it("should accept name with hyphens", () => {
      const result = verticalSchema.safeParse({ name: "Dev-Ops" });
      expect(result.success).toBe(true);
    });

    it("should accept name with numbers", () => {
      const result = verticalSchema.safeParse({ name: "Team 1" });
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const result = verticalSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("should reject name longer than 100 characters", () => {
      const result = verticalSchema.safeParse({ name: "a".repeat(101) });
      expect(result.success).toBe(false);
    });

    it("should accept name at exactly 100 characters", () => {
      const result = verticalSchema.safeParse({ name: "a".repeat(100) });
      expect(result.success).toBe(true);
    });

    it("should reject name with special characters", () => {
      const result = verticalSchema.safeParse({ name: "Engineering!" });
      expect(result.success).toBe(false);
    });

    it("should reject name with underscores", () => {
      const result = verticalSchema.safeParse({ name: "dev_ops" });
      expect(result.success).toBe(false);
    });

    it("should reject name with dots", () => {
      const result = verticalSchema.safeParse({ name: "v1.0" });
      expect(result.success).toBe(false);
    });

    it("should reject name with @ symbol", () => {
      const result = verticalSchema.safeParse({ name: "team@dev" });
      expect(result.success).toBe(false);
    });

    it("should reject missing name", () => {
      const result = verticalSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ─── Project Schema ───

  describe("createProjectSchema", () => {
    const validProject = {
      name: "Nexus Portal",
      verticalId: "vertical-uuid-123",
    };

    it("should accept valid project with minimal fields", () => {
      const result = createProjectSchema.safeParse(validProject);
      expect(result.success).toBe(true);
    });

    it("should accept valid project with description", () => {
      const result = createProjectSchema.safeParse({
        ...validProject,
        description: "AI-first project management portal",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const result = createProjectSchema.safeParse({
        ...validProject,
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject name longer than 100 characters", () => {
      const result = createProjectSchema.safeParse({
        ...validProject,
        name: "x".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("should reject description longer than 500 characters", () => {
      const result = createProjectSchema.safeParse({
        ...validProject,
        description: "x".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("should accept description at exactly 500 characters", () => {
      const result = createProjectSchema.safeParse({
        ...validProject,
        description: "x".repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty verticalId", () => {
      const result = createProjectSchema.safeParse({
        name: "Project",
        verticalId: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing verticalId", () => {
      const result = createProjectSchema.safeParse({ name: "Project" });
      expect(result.success).toBe(false);
    });

    it("should accept optional initialMemberIds", () => {
      const result = createProjectSchema.safeParse({
        ...validProject,
        initialMemberIds: ["user-1", "user-2"],
      });
      expect(result.success).toBe(true);
    });
  });

  // ─── Comment Schema ───

  describe("commentSchema", () => {
    it("should accept valid comment", () => {
      const result = commentSchema.safeParse({
        content: "This looks good to me!",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty content", () => {
      const result = commentSchema.safeParse({ content: "" });
      expect(result.success).toBe(false);
    });

    it("should reject content longer than 1000 characters", () => {
      const result = commentSchema.safeParse({
        content: "x".repeat(1001),
      });
      expect(result.success).toBe(false);
    });

    it("should accept content at exactly 1000 characters", () => {
      const result = commentSchema.safeParse({
        content: "x".repeat(1000),
      });
      expect(result.success).toBe(true);
    });

    it("should accept single character content", () => {
      const result = commentSchema.safeParse({ content: "x" });
      expect(result.success).toBe(true);
    });

    it("should reject missing content", () => {
      const result = commentSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("createCommentSchema", () => {
    it("should accept valid comment with taskId", () => {
      const result = createCommentSchema.safeParse({
        taskId: "task-uuid",
        content: "Great work!",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing taskId", () => {
      const result = createCommentSchema.safeParse({
        content: "Great work!",
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── File Upload Schema ───

  describe("fileUploadSchema", () => {
    const validUpload = {
      fileName: "screenshot.png",
      mimeType: "image/png",
      fileSize: 1024 * 1024, // 1MB
    };

    it("should accept valid file upload", () => {
      const result = fileUploadSchema.safeParse(validUpload);
      expect(result.success).toBe(true);
    });

    it("should accept file at exactly 10MB", () => {
      const result = fileUploadSchema.safeParse({
        ...validUpload,
        fileSize: 10 * 1024 * 1024,
      });
      expect(result.success).toBe(true);
    });

    it("should reject file larger than 10MB", () => {
      const result = fileUploadSchema.safeParse({
        ...validUpload,
        fileSize: 10 * 1024 * 1024 + 1,
      });
      expect(result.success).toBe(false);
    });

    it("should accept zero-byte file", () => {
      const result = fileUploadSchema.safeParse({
        ...validUpload,
        fileSize: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing fileName", () => {
      const result = fileUploadSchema.safeParse({
        mimeType: "image/png",
        fileSize: 1024,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing mimeType", () => {
      const result = fileUploadSchema.safeParse({
        fileName: "file.png",
        fileSize: 1024,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing fileSize", () => {
      const result = fileUploadSchema.safeParse({
        fileName: "file.png",
        mimeType: "image/png",
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-number fileSize", () => {
      const result = fileUploadSchema.safeParse({
        ...validUpload,
        fileSize: "1024",
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── User / Auth Schemas ───

  describe("updateUserRoleSchema", () => {
    it("should accept valid role update", () => {
      const result = updateUserRoleSchema.safeParse({
        userId: "user-uuid",
        role: "admin",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all valid roles", () => {
      const roles = ["admin", "developer", "reviewer"];
      roles.forEach((role) => {
        const result = updateUserRoleSchema.safeParse({
          userId: "user-uuid",
          role,
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid role", () => {
      const result = updateUserRoleSchema.safeParse({
        userId: "user-uuid",
        role: "superadmin",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing userId", () => {
      const result = updateUserRoleSchema.safeParse({ role: "admin" });
      expect(result.success).toBe(false);
    });
  });

  describe("updateUserProfileSchema", () => {
    it("should accept valid profile update", () => {
      const result = updateUserProfileSchema.safeParse({
        designation: "Senior Developer",
        bio: "I love coding",
      });
      expect(result.success).toBe(true);
    });

    it("should accept empty object (all fields optional)", () => {
      const result = updateUserProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should reject designation longer than 255 characters", () => {
      const result = updateUserProfileSchema.safeParse({
        designation: "x".repeat(256),
      });
      expect(result.success).toBe(false);
    });

    it("should reject bio longer than 1000 characters", () => {
      const result = updateUserProfileSchema.safeParse({
        bio: "x".repeat(1001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerUserSchema", () => {
    it("should accept valid registration", () => {
      const result = registerUserSchema.safeParse({
        email: "user@stanzasoft.com",
        password: "securepass123",
        name: "Test User",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const result = registerUserSchema.safeParse({
        email: "not-an-email",
        password: "securepass123",
        name: "Test User",
      });
      expect(result.success).toBe(false);
    });

    it("should reject password shorter than 6 characters", () => {
      const result = registerUserSchema.safeParse({
        email: "user@stanzasoft.com",
        password: "12345",
        name: "Test User",
      });
      expect(result.success).toBe(false);
    });

    it("should accept password at exactly 6 characters", () => {
      const result = registerUserSchema.safeParse({
        email: "user@stanzasoft.com",
        password: "123456",
        name: "Test User",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const result = registerUserSchema.safeParse({
        email: "user@stanzasoft.com",
        password: "securepass123",
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing fields", () => {
      expect(registerUserSchema.safeParse({}).success).toBe(false);
      expect(
        registerUserSchema.safeParse({ email: "user@test.com" }).success
      ).toBe(false);
    });
  });

  describe("loginUserSchema", () => {
    it("should accept valid login", () => {
      const result = loginUserSchema.safeParse({
        email: "user@stanzasoft.com",
        password: "securepass123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = loginUserSchema.safeParse({
        email: "invalid",
        password: "pass",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const result = loginUserSchema.safeParse({
        email: "user@stanzasoft.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── AI Sprint Plan Schema ───

  describe("confirmedPlanSchema", () => {
    const validPlan = {
      sprint_name: "Sprint 1",
      duration_days: 14,
      tasks: [
        {
          title: "Implement auth",
          category: "Backend",
          required_role: "developer",
          labels: ["auth"],
          priority: "high" as const,
          subtasks: [
            {
              title: "Add JWT",
              required_role: "developer",
              priority: "high" as const,
            },
          ],
        },
      ],
    };

    it("should accept valid confirmed plan", () => {
      const result = confirmedPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it("should reject empty sprint name", () => {
      const result = confirmedPlanSchema.safeParse({
        ...validPlan,
        sprint_name: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject duration_days less than 1", () => {
      const result = confirmedPlanSchema.safeParse({
        ...validPlan,
        duration_days: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject duration_days greater than 90", () => {
      const result = confirmedPlanSchema.safeParse({
        ...validPlan,
        duration_days: 91,
      });
      expect(result.success).toBe(false);
    });

    it("should accept empty tasks array", () => {
      const result = confirmedPlanSchema.safeParse({
        ...validPlan,
        tasks: [],
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid priority in task", () => {
      const result = confirmedPlanSchema.safeParse({
        ...validPlan,
        tasks: [
          {
            ...validPlan.tasks[0],
            priority: "urgent",
          },
        ],
      });
      expect(result.success).toBe(false);
    });
  });
});
