import { z } from "zod";
import { generateStructuredOutput } from "./gemini";

const WeeklySummarySchema = z.object({
  summary: z.string().max(1000),
  highlights: z.array(z.string()).default([]),
  blockers: z.array(z.string()).default([]),
  next_week_focus: z.array(z.string()).default([]),
});

export type WeeklySummaryOutput = z.infer<typeof WeeklySummarySchema>;

export async function generateWeeklySummaryAI(input: {
  projectName: string;
  completedTasks: { title: string; assignee: string | null; type: string }[];
  inProgressTasks: { title: string; assignee: string | null; type: string }[];
  weekRange: string;
}): Promise<WeeklySummaryOutput> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error("GOOGLE_AI_API_KEY is not configured.");
  }

  const systemPrompt = `You are a project management assistant. Generate a concise weekly summary for a software project.

You MUST respond with valid JSON matching this schema:
{
  "summary": "A 2-3 sentence overview of the week's progress",
  "highlights": ["Key achievement 1", "Key achievement 2"],
  "blockers": ["Blocker or risk 1"],
  "next_week_focus": ["Priority for next week 1"]
}

Rules:
- summary: Max 1000 characters, focus on overall progress
- highlights: 2-5 key achievements or milestones
- blockers: 0-3 blockers, risks, or concerns (empty array if none)
- next_week_focus: 2-4 priorities or focus areas for the coming week
- Be concise and actionable
- Do NOT include any text outside the JSON object`;

  const completedList = input.completedTasks.length > 0
    ? input.completedTasks.map((t) => `- [${t.type}] ${t.title} (${t.assignee || "Unassigned"})`).join("\n")
    : "No tasks completed this week.";

  const inProgressList = input.inProgressTasks.length > 0
    ? input.inProgressTasks.map((t) => `- [${t.type}] ${t.title} (${t.assignee || "Unassigned"})`).join("\n")
    : "No tasks currently in progress.";

  const userPrompt = `Generate a weekly summary for project "${input.projectName}" for ${input.weekRange}.

Completed tasks this week:
${completedList}

In-progress tasks:
${inProgressList}`;

  return generateStructuredOutput(systemPrompt, userPrompt, WeeklySummarySchema);
}
