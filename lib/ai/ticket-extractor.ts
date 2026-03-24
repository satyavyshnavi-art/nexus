import { z } from "zod";
import { generateStructuredOutput } from "./gemini";

const extractedTicketSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  type: z.enum(["task", "bug", "story"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  requiredRole: z.string().max(100).optional().default(""),
  labels: z.array(z.string().max(50)).max(10).optional().default([]),
});

const extractionResultSchema = z.object({
  tickets: z.array(extractedTicketSchema).min(1),
});

export type ExtractedTicket = z.infer<typeof extractedTicketSchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;

const SYSTEM_PROMPT = `You are a project management assistant that extracts tickets/tasks from documents.

Given a document containing task descriptions, bug reports, feature requests, or any project work items, extract each one as a structured ticket.

Rules:
- Extract EVERY distinct ticket/task/bug/feature mentioned in the document
- Set type to "bug" for bug reports and defects, "story" for large features or epics, "task" for everything else
- Set priority based on urgency/severity cues: "critical" for blockers/security/data-loss, "high" for important features/major bugs, "medium" for standard work, "low" for nice-to-haves/cosmetic
- Keep titles concise but descriptive (under 120 chars)
- Include any description details from the document
- Add relevant labels based on the content (e.g., "frontend", "backend", "api", "ui", "database", "auth", "performance")
- Set requiredRole if the document mentions who should work on it (use: "UI", "Backend", "QA", "DevOps", "Full-Stack", "Design", "Data", "Mobile")
- If the document is not about tickets/tasks at all, still try to extract actionable items
- Preserve the original intent and details from the document

Respond with ONLY valid JSON matching the schema.`;

export async function extractTicketsFromDocument(
  documentText: string
): Promise<ExtractionResult> {
  const userPrompt = `Extract all tickets/tasks from this document:\n\n---\n${documentText}\n---\n\nReturn JSON with a "tickets" array. Each ticket needs: title, description, type (task|bug|story), priority (low|medium|high|critical), requiredRole (optional), labels (optional array).`;

  return generateStructuredOutput(
    SYSTEM_PROMPT,
    userPrompt,
    extractionResultSchema
  );
}
