import { z } from "zod";
import { TaskType, TaskPriority } from "@prisma/client";

// Sprint validation
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

// Task validation
export const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title must be less than 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),
  type: z.nativeEnum(TaskType),
  priority: z.nativeEnum(TaskPriority).optional(),
  storyPoints: z
    .number()
    .int("Story points must be a whole number")
    .min(0, "Story points cannot be negative")
    .max(20, "Story points cannot exceed 20")
    .optional(),
  assigneeId: z.string().optional(),
});

// Vertical validation
export const verticalSchema = z.object({
  name: z
    .string()
    .min(1, "Vertical name is required")
    .max(100, "Vertical name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s-]+$/, "Vertical name can only contain letters, numbers, spaces, and hyphens"),
});

// Project validation
export const projectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  verticalId: z.string().min(1, "Vertical is required"),
});

// Comment validation
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be less than 1000 characters"),
});

// File upload validation
export const fileUploadSchema = z.object({
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB"),
});

// Export types
export type SprintInput = z.infer<typeof sprintSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type VerticalInput = z.infer<typeof verticalSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
