import { z } from "zod";
import { generateStructuredOutput } from "./gemini";

const SprintTaskSchema = z.object({
  stories: z.array(
    z.object({
      title: z.string().max(120),
      story_points: z.number().min(0).max(20),
      tasks: z.array(z.string().max(120)),
    })
  ),
});

export type SprintTasksOutput = z.infer<typeof SprintTaskSchema>;

export async function generateSprintTasks(
  inputText: string
): Promise<SprintTasksOutput> {
  // Check if API key is configured
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not configured. Please add it to your .env file to use AI features."
    );
  }

  const systemPrompt = `You are a sprint planning assistant. Convert feature descriptions into structured sprint backlogs.

Output ONLY valid JSON matching this schema:
{
  "stories": [
    {
      "title": "User story title",
      "story_points": 5,
      "tasks": ["Task 1", "Task 2"]
    }
  ]
}

Rules:
- Story points: 0-20
- Max 30 stories
- Max 20 tasks per story
- Titles under 120 chars
- Be concise and actionable`;

  return generateStructuredOutput(
    systemPrompt,
    `Create sprint backlog for:\n\n${inputText}`,
    SprintTaskSchema
  );
}
