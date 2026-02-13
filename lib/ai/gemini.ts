import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export async function generateStructuredOutput<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  const content = response.text();

  // Extract JSON from markdown code blocks if present
  const jsonMatch =
    content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }

  const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
  return schema.parse(parsed);
}
