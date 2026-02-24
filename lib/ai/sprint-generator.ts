import { z } from "zod";
import { generateStructuredOutput, type ImageInput } from "./gemini";

const VALID_ROLES = ["UI", "Backend", "QA", "DevOps", "Full-Stack", "Design", "Data", "Mobile"] as const;

const TaskItemSchema = z.object({
  title: z.string().max(120),
  required_role: z.string().default("Full-Stack"),
  labels: z.array(z.string()).default([]),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

const SprintTaskSchema = z.object({
  stories: z.array(
    z.object({
      title: z.string().max(120),
      story_points: z.number().min(0).max(20),
      required_role: z.string().default("Full-Stack"),
      labels: z.array(z.string()).default([]),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      tasks: z.array(TaskItemSchema),
    })
  ),
});

export type SprintTasksOutput = z.infer<typeof SprintTaskSchema>;

export async function generateSprintTasks(
  inputText: string,
  images?: ImageInput[]
): Promise<SprintTasksOutput> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not configured. Please add it to your .env file to use AI features."
    );
  }

  const systemPrompt = `You are a sprint planning assistant. Convert feature descriptions into structured sprint backlogs.

You MUST respond with valid JSON matching this exact schema:
{
  "stories": [
    {
      "title": "User story title (max 120 chars)",
      "story_points": 5,
      "required_role": "Backend",
      "labels": ["authentication", "api"],
      "priority": "high",
      "tasks": [
        {
          "title": "Task title (max 120 chars)",
          "required_role": "Backend",
          "labels": ["api"],
          "priority": "high"
        }
      ]
    }
  ]
}

Rules:
- story_points must be a number between 0 and 20
- Maximum 30 stories
- Maximum 20 tasks per story
- All titles must be under 120 characters
- Each story must have at least 1 task
- Be concise and actionable
- Do NOT include any text outside the JSON object

Role Classification:
- required_role MUST be one of: ${VALID_ROLES.join(", ")}
- Classify each story and task by the primary role needed:
  - UI: Frontend components, styling, layouts, client-side logic
  - Backend: APIs, server logic, database queries, authentication
  - QA: Testing, test plans, quality assurance
  - DevOps: CI/CD, deployment, infrastructure, monitoring
  - Full-Stack: Tasks spanning both frontend and backend
  - Design: UI/UX design, wireframes, prototypes
  - Data: Data modeling, analytics, reporting
  - Mobile: Mobile-specific development

Labels & Priority:
- labels: Short keyword tags based on the task domain (e.g. "authentication", "api", "database", "ui", "testing")
- priority: "low" | "medium" | "high" | "critical" — based on business impact and dependencies

If reference images are provided, analyze them for UI layout, features, and requirements to inform your task breakdown.`;

  return generateStructuredOutput(
    systemPrompt,
    `Create a sprint backlog for the following feature:\n\n${inputText}`,
    SprintTaskSchema,
    images
  );
}
