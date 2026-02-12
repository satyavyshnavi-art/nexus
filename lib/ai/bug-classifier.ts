import { z } from "zod";
import { generateStructuredOutput } from "./gemini";
import { db } from "@/server/db";
import { TaskPriority } from "@prisma/client";

const BugClassificationSchema = z.object({
  priority: z.enum(["low", "medium", "high", "critical"]),
});

export async function classifyBugPriority(taskId: string, description: string) {
  if (!description.trim()) return;

  const systemPrompt = `Classify bug priority based on severity.

Output ONLY JSON:
{
  "priority": "low" | "medium" | "high" | "critical"
}

Rules:
- crash/payment/auth → high or critical
- UI/spacing/cosmetic → low
- Performance issues → medium or high
- Data loss → critical`;

  try {
    const result = await generateStructuredOutput(
      systemPrompt,
      `Classify this bug:\n\n${description}`,
      BugClassificationSchema
    );

    await db.task.update({
      where: { id: taskId },
      data: {
        priority: result.priority as TaskPriority,
      },
    });
  } catch (error) {
    console.error("Bug classification failed:", error);
    // Keep default priority
  }
}
