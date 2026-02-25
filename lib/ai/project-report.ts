import { z } from "zod";
import { generateStructuredOutput } from "./gemini";

const ProjectReportSchema = z.object({
  executive_summary: z.string().max(2000),
  completion_rate: z.number().min(0).max(100),
  risk_areas: z.array(z.string()).default([]),
  team_performance: z.array(z.object({
    member: z.string(),
    summary: z.string(),
  })).default([]),
  recommendations: z.array(z.string()).default([]),
});

export type ProjectReportOutput = z.infer<typeof ProjectReportSchema>;

export async function generateProjectReportAI(input: {
  projectName: string;
  totalSprints: number;
  completedSprints: number;
  activeSprint: string | null;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  teamMembers: { name: string; tasksCompleted: number; tasksTotal: number }[];
}): Promise<ProjectReportOutput> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error("GOOGLE_AI_API_KEY is not configured.");
  }

  const systemPrompt = `You are a project management assistant. Generate a comprehensive project progress report.

You MUST respond with valid JSON matching this schema:
{
  "executive_summary": "2-4 sentence overview of overall project health and progress",
  "completion_rate": 65,
  "risk_areas": ["Risk or concern 1", "Risk 2"],
  "team_performance": [
    { "member": "Name", "summary": "Brief performance note" }
  ],
  "recommendations": ["Actionable recommendation 1", "Recommendation 2"]
}

Rules:
- executive_summary: Concise overview, max 2000 chars
- completion_rate: Overall project completion percentage (0-100)
- risk_areas: 0-5 risks or areas of concern
- team_performance: Brief note for each team member
- recommendations: 2-5 actionable next steps
- Be data-driven, reference actual numbers
- Do NOT include any text outside the JSON object`;

  const teamList = input.teamMembers.length > 0
    ? input.teamMembers.map((m) => `- ${m.name}: ${m.tasksCompleted}/${m.tasksTotal} tasks done`).join("\n")
    : "No team member data available.";

  const userPrompt = `Generate a progress report for project "${input.projectName}".

Sprint Stats:
- Total sprints: ${input.totalSprints}
- Completed sprints: ${input.completedSprints}
- Active sprint: ${input.activeSprint || "None"}

Task Stats:
- Total tasks: ${input.totalTasks}
- Completed: ${input.completedTasks}
- In progress: ${input.inProgressTasks}

Team Performance:
${teamList}`;

  return generateStructuredOutput(systemPrompt, userPrompt, ProjectReportSchema);
}
