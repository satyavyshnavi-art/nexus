import { z } from "zod";
import { generateStructuredOutput } from "./gemini";

const SprintPlanSchema = z.object({
  sprint_name: z.string().max(80),
  duration_days: z.number().min(7).max(30),
  stories: z.array(
    z.object({
      title: z.string().max(120),
      story_points: z.number().min(0).max(20),
      tasks: z.array(z.string().max(120)),
    })
  ),
});

export type SprintPlanOutput = z.infer<typeof SprintPlanSchema>;

export async function generateSprintPlan(
  inputText: string
): Promise<SprintPlanOutput> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not configured. Please add it to your .env file to use AI features."
    );
  }

  const systemPrompt = `You are a sprint planning assistant. Given a feature description, generate a complete sprint plan including a sprint name, suggested duration, and a full backlog of user stories with tasks.

You MUST respond with valid JSON matching this exact schema:
{
  "sprint_name": "Descriptive Sprint Name (max 80 chars)",
  "duration_days": 14,
  "stories": [
    {
      "title": "User story title (max 120 chars)",
      "story_points": 5,
      "tasks": ["Task 1 (max 120 chars)", "Task 2"]
    }
  ]
}

Rules:
- sprint_name: A meaningful, concise name for the sprint (e.g. "Authentication & Authorization Sprint"). Max 80 characters.
- duration_days: Suggested sprint duration between 7 and 30 days. Use 14 for medium features, 7 for small, 21-30 for large.
- story_points: Number between 0 and 20
- Maximum 30 stories
- Maximum 20 tasks per story
- All titles must be under 120 characters
- Each story must have at least 1 task
- Be concise and actionable
- Do NOT include any text outside the JSON object`;

  return generateStructuredOutput(
    systemPrompt,
    `Create a complete sprint plan for the following feature:\n\n${inputText}`,
    SprintPlanSchema
  );
}
