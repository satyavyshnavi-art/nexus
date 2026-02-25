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
  category: z.string().max(80).default("General"),
  required_role: z.string().default("Full-Stack"),
  labels: z.array(z.string()).default([]),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  subtasks: z.array(SubtaskItemSchema).default([]),
});

const RoleDistributionSchema = z.object({
  role: z.string(),
  task_count: z.number(),
});

const SprintPlanSchema = z.object({
  sprint_name: z.string().max(80),
  duration_days: z.number().min(7).max(30),
  role_distribution: z.array(RoleDistributionSchema).default([]),
  tasks: z.array(TaskItemSchema),
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
        .join("\n")}\n\nConsider the team's designations when assigning required_role to stories and tickets.`
    : "";

  const systemPrompt = `You are a sprint planning assistant. Given a description, generate a complete sprint plan with user stories and their tickets.

**Structure explained:**
- **Stories** (the "tasks" array) are high-level user stories or epics that describe a feature or capability from the user's perspective (e.g., "User Authentication Flow", "Dashboard Analytics View", "Payment Integration"). Each story has a category for grouping.
- **Tickets** (the "subtasks" array under each story) are concrete, actionable work items that implement parts of the story (e.g., "Create login API endpoint", "Build chart component", "Write unit tests for auth service"). Each ticket has an assigned role and priority. Tickets are what developers actually work on day-to-day.
- Group related stories using the \`category\` field (e.g., "Authentication", "Dashboard UI", "API Development"). Categories are just labels for organizing stories visually.

You MUST respond with valid JSON matching this exact schema:
{
  "sprint_name": "Descriptive Sprint Name (max 80 chars)",
  "duration_days": 14,
  "role_distribution": [
    { "role": "Backend", "task_count": 5 },
    { "role": "UI", "task_count": 4 }
  ],
  "tasks": [
    {
      "title": "Story title — a user story or feature (max 120 chars)",
      "category": "Authentication",
      "required_role": "Backend",
      "labels": ["api", "authentication"],
      "priority": "high",
      "subtasks": [
        {
          "title": "Ticket title — an actionable work item (max 120 chars)",
          "required_role": "Backend",
          "priority": "high"
        }
      ]
    }
  ]
}

Rules:
- sprint_name: A meaningful, concise name for the sprint. Max 80 characters.
- duration_days: Suggested sprint duration between 7 and 30 days. Use 14 for medium features, 7 for small, 21-30 for large.
- Maximum 50 stories total
- Maximum 10 tickets per story
- All titles must be under 120 characters
- category: A short grouping label (max 80 chars) like "Authentication", "Dashboard UI", "API Development", "Testing", etc.
- Each story should have at least 1 ticket representing a concrete work item
- Story titles should describe WHAT and WHY (user-facing value), ticket titles should describe HOW (technical implementation)
- Be concise and actionable
- Do NOT include any text outside the JSON object

Role Classification:
- required_role MUST be one of: ${VALID_ROLES.join(", ")}
- Classify each story and ticket by the primary role needed:
  - UI: Frontend components, styling, layouts, client-side logic
  - Backend: APIs, server logic, database queries, authentication
  - QA: Testing, test plans, quality assurance
  - DevOps: CI/CD, deployment, infrastructure, monitoring
  - Full-Stack: Tasks spanning both frontend and backend
  - Design: UI/UX design, wireframes, prototypes
  - Data: Data modeling, analytics, reporting
  - Mobile: Mobile-specific development
- role_distribution: Summary of task count per role across all stories

Labels & Priority:
- labels: Short keyword tags based on the story domain (e.g. "authentication", "api", "database", "ui", "testing")
- priority: "low" | "medium" | "high" | "critical" — based on business impact and dependencies

If reference images are provided, analyze them for UI layout and requirements to inform your story and ticket breakdown.${teamContext}`;

  return generateStructuredOutput(
    systemPrompt,
    `Create a complete sprint plan for the following:\n\n${inputText}`,
    SprintPlanSchema,
    images
  );
}
