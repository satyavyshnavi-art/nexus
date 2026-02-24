import { z } from "zod";
import { generateStructuredOutput, type ImageInput } from "./gemini";

const VALID_ROLES = ["UI", "Backend", "QA", "DevOps", "Full-Stack", "Design", "Data", "Mobile"] as const;

const SubtaskItemSchema = z.object({
  title: z.string().max(120),
  required_role: z.string().default("Full-Stack"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

const TaskItemSchema = z.object({
  title: z.string().max(120),
  required_role: z.string().default("Full-Stack"),
  labels: z.array(z.string()).default([]),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  story_points: z.number().min(0).max(20).default(3),
  subtasks: z.array(SubtaskItemSchema).default([]),
});

const FeatureItemSchema = z.object({
  title: z.string().max(120),
  description: z.string().max(500).default(""),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  tasks: z.array(TaskItemSchema),
});

const RoleDistributionSchema = z.object({
  role: z.string(),
  story_points: z.number(),
  task_count: z.number(),
});

const SprintPlanSchema = z.object({
  sprint_name: z.string().max(80),
  duration_days: z.number().min(7).max(30),
  role_distribution: z.array(RoleDistributionSchema).default([]),
  features: z.array(FeatureItemSchema),
});

export type SprintPlanOutput = z.infer<typeof SprintPlanSchema>;

export async function generateSprintPlan(
  inputText: string,
  teamMembers?: { id: string; name: string | null; designation: string | null }[],
  images?: ImageInput[]
): Promise<SprintPlanOutput> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not configured. Please add it to your .env file to use AI features."
    );
  }

  const teamContext = teamMembers?.length
    ? `\n\nTeam members and their designations:\n${teamMembers
        .map((m) => `- ${m.name || "Unknown"}: ${m.designation || "Unspecified"}`)
        .join("\n")}\n\nConsider the team's designations when assigning required_role to tasks and subtasks.`
    : "";

  const systemPrompt = `You are a sprint planning assistant. Given a feature description, generate a complete sprint plan using a Feature → Task → Subtask hierarchy.

**Hierarchy explained:**
- **Features** are top-level product backlog items representing big product goals (e.g., "User Dashboard", "Payment System", "Notification Center"). A feature can span multiple sprints.
- **Tasks** are technical work units under a feature with assigned roles (e.g., "Design Dashboard Layout" → UI, "Build Dashboard APIs" → Backend, "Write Integration Tests" → QA). Tasks are what get selected into sprints during sprint planning. Each task has story points.
- **Subtasks** are daily execution items under a task (e.g., "Create chart component", "Connect REST API endpoint", "Fix responsiveness on mobile"). They break down a task into actionable steps.

You MUST respond with valid JSON matching this exact schema:
{
  "sprint_name": "Descriptive Sprint Name (max 80 chars)",
  "duration_days": 14,
  "role_distribution": [
    { "role": "Backend", "story_points": 13, "task_count": 5 },
    { "role": "UI", "story_points": 8, "task_count": 4 }
  ],
  "features": [
    {
      "title": "Feature title (max 120 chars)",
      "description": "Brief description of the feature goal (max 500 chars)",
      "priority": "high",
      "tasks": [
        {
          "title": "Task title (max 120 chars)",
          "required_role": "Backend",
          "labels": ["api", "authentication"],
          "priority": "high",
          "story_points": 5,
          "subtasks": [
            {
              "title": "Subtask title (max 120 chars)",
              "required_role": "Backend",
              "priority": "high"
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- sprint_name: A meaningful, concise name for the sprint. Max 80 characters.
- duration_days: Suggested sprint duration between 7 and 30 days. Use 14 for medium features, 7 for small, 21-30 for large.
- story_points: Number between 0 and 20 (on tasks, NOT on features)
- Maximum 10 features
- Maximum 20 tasks per feature
- Maximum 10 subtasks per task
- All titles must be under 120 characters
- Feature descriptions must be under 500 characters
- Each feature must have at least 1 task
- Each task should have at least 1 subtask for actionable daily work
- Be concise and actionable
- Do NOT include any text outside the JSON object

Role Classification:
- required_role MUST be one of: ${VALID_ROLES.join(", ")}
- Classify each task and subtask by the primary role needed:
  - UI: Frontend components, styling, layouts, client-side logic
  - Backend: APIs, server logic, database queries, authentication
  - QA: Testing, test plans, quality assurance
  - DevOps: CI/CD, deployment, infrastructure, monitoring
  - Full-Stack: Tasks spanning both frontend and backend
  - Design: UI/UX design, wireframes, prototypes
  - Data: Data modeling, analytics, reporting
  - Mobile: Mobile-specific development
- role_distribution: Summary of total story points and task count per role across all features and tasks

Labels & Priority:
- labels: Short keyword tags based on the task domain (e.g. "authentication", "api", "database", "ui", "testing")
- priority: "low" | "medium" | "high" | "critical" — based on business impact and dependencies

If reference images are provided, analyze them for UI layout, features, and requirements to inform your task breakdown.${teamContext}`;

  return generateStructuredOutput(
    systemPrompt,
    `Create a complete sprint plan for the following feature:\n\n${inputText}`,
    SprintPlanSchema,
    images
  );
}
