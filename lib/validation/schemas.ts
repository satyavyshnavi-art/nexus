import { z } from "zod";
import { TaskType, TaskPriority, TaskStatus, UserRole, SprintStatus } from "@prisma/client";

// ─── Reusable primitives ───

const idSchema = z.string().min(1, "ID is required");
const optionalId = z.string().min(1).optional();
const titleSchema = z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters");
const descriptionSchema = z.string().max(5000, "Description must be less than 5000 characters").optional();

// ─── Sprint validation ───

// Client-side form validation (used by sprint-form.tsx and edit-sprint-modal.tsx)
export const sprintSchema = z.object({
  name: z
    .string()
    .min(1, "Sprint name is required")
    .max(100, "Sprint name must be less than 100 characters"),
  startDate: z.date(),
  endDate: z.date(),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Server-side validation (includes projectId)
export const createSprintSchema = z.object({
  projectId: idSchema,
  name: z
    .string()
    .min(1, "Sprint name is required")
    .max(100, "Sprint name must be less than 100 characters"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const updateSprintSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// ─── Task validation ───

export const createTaskSchema = z.object({
  sprintId: optionalId,
  title: titleSchema,
  description: descriptionSchema,
  type: z.nativeEnum(TaskType),
  assigneeId: optionalId,
  parentTaskId: optionalId,
  pushToGitHub: z.boolean().optional(),
  requiredRole: z.string().max(100).optional(),
  labels: z.array(z.string().max(100)).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: z.string().min(1).nullable().optional(),
  requiredRole: z.string().max(100).optional(),
  labels: z.array(z.string().max(100)).optional(),
  dueAt: z.coerce.date().nullable().optional(),
  estimatedDuration: z.number().nullable().optional(),
});

export const updateTaskStatusSchema = z.object({
  taskId: idSchema,
  newStatus: z.nativeEnum(TaskStatus),
  reviewerId: optionalId,
});

export const createSubtaskSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  assigneeId: optionalId,
  priority: z.nativeEnum(TaskPriority).optional(),
});

export const createStorySchema = z.object({
  sprintId: idSchema,
  title: titleSchema,
  description: descriptionSchema,
  assigneeId: optionalId,
  requiredRole: z.string().max(100).optional(),
  labels: z.array(z.string().max(100)).optional(),
});

export const createTicketSchema = z.object({
  storyId: idSchema,
  title: titleSchema,
  description: descriptionSchema,
  type: z.enum(["task", "bug"]),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: optionalId,
  requiredRole: z.string().max(100).optional(),
  labels: z.array(z.string().max(100)).optional(),
});

// ─── Vertical validation ───

export const verticalSchema = z.object({
  name: z
    .string()
    .min(1, "Vertical name is required")
    .max(100, "Vertical name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s-]+$/, "Vertical name can only contain letters, numbers, spaces, and hyphens"),
});

export const verticalNameSchema = z
  .string()
  .min(1, "Vertical name is required")
  .max(100, "Vertical name must be less than 100 characters");

// ─── Project validation ───

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  verticalId: idSchema,
  initialMemberIds: z.array(z.string().min(1)).optional(),
});

// ─── Comment validation ───

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be less than 1000 characters"),
});

export const createCommentSchema = z.object({
  taskId: idSchema,
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment must be less than 1000 characters"),
});

// ─── File upload validation ───

export const fileUploadSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB"),
});

export const requestUploadUrlSchema = z.object({
  taskId: idSchema,
  fileName: z.string().min(1, "File name is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  fileSize: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB"),
});

export const saveAttachmentMetadataSchema = z.object({
  taskId: idSchema,
  key: z.string().min(1, "S3 key is required"),
  fileName: z.string().min(1, "File name is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  sizeBytes: z.number().min(0),
});

// ─── User / Team validation ───

export const updateUserRoleSchema = z.object({
  userId: idSchema,
  role: z.nativeEnum(UserRole),
});

export const updateUserProfileSchema = z.object({
  designation: z.string().max(255, "Designation must be 255 characters or less").optional(),
  bio: z.string().max(1000, "Bio must be 1000 characters or less").optional(),
  avatar: z.string().max(2048, "Avatar URL must be 2048 characters or less").optional(),
});

export const updateAccountSettingsSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(255).optional(),
  email: z.string().email("Invalid email format").optional(),
});

export const updatePasswordSchema = z.object({
  userId: idSchema,
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// ─── Auth validation ───

export const registerUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").max(255),
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// ─── Document validation ───

export const createProjectDocumentSchema = z.object({
  projectId: idSchema,
  title: titleSchema,
  url: z.string().url("Invalid URL").max(2048),
  description: z.string().max(1000).optional(),
});

export const updateProjectDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  url: z.string().url("Invalid URL").max(2048).optional(),
  description: z.string().max(1000).nullable().optional(),
});

// ─── AI Sprint validation ───

const confirmedSubtaskSchema = z.object({
  title: z.string().min(1).max(255),
  required_role: z.string().max(100),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assignee_id: z.string().optional(),
});

const confirmedTaskSchema = z.object({
  title: z.string().min(1).max(255),
  category: z.string().max(100),
  required_role: z.string().max(100),
  labels: z.array(z.string().max(100)),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assignee_id: z.string().optional(),
  subtasks: z.array(confirmedSubtaskSchema),
});

export const confirmedPlanSchema = z.object({
  sprint_name: z.string().min(1, "Sprint name is required").max(100),
  duration_days: z.number().min(1).max(90),
  tasks: z.array(confirmedTaskSchema),
});

export const confirmedTasksArraySchema = z.array(confirmedTaskSchema);

export const aiGenerateSprintPlanSchema = z.object({
  projectId: idSchema,
  inputText: z.string().min(1, "Input text is required").max(10000),
});

export const aiGenerateTicketsSchema = z.object({
  sprintId: idSchema,
  inputText: z.string().min(1, "Input text is required").max(10000),
});

// ─── Sprint completion ───

export const completeSprintOptionsSchema = z.object({
  incompleteTaskAction: z.enum(["keep", "moveToNext"]),
  targetSprintId: z.string().optional(),
}).optional();

// ─── Weekly Summary / Project Report ───

export const getWeeklySummariesSchema = z.object({
  projectId: idSchema,
  limit: z.number().min(1).max(50).optional(),
});

// ─── GitHub Link (already validated in github-link.ts, kept for consistency) ───

export const linkRepoSchema = z.object({
  projectId: z.string().uuid(),
  repoOwner: z.string().min(1).max(100),
  repoName: z.string().min(1).max(100),
});

// ─── Export inferred types ───

export type SprintInput = z.infer<typeof createSprintSchema>;
export type TaskInput = z.infer<typeof createTaskSchema>;
export type VerticalInput = z.infer<typeof verticalSchema>;
export type ProjectInput = z.infer<typeof createProjectSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ConfirmedPlanInput = z.infer<typeof confirmedPlanSchema>;
