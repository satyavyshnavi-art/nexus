import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateStructuredOutput<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    temperature: 0.2,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const content =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from markdown code blocks if present
  const jsonMatch =
    content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }

  const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
  return schema.parse(parsed);
}
