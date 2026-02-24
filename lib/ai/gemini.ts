import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { z } from "zod";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export type ImageInput = { mimeType: string; data: string };

export async function generateStructuredOutput<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>,
  images?: ImageInput[]
): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  const hasImages = images && images.length > 0;

  let lastError: Error | null = null;

  // Retry up to 2 times on parse/validation failure
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const textPrompt =
        attempt === 0
          ? fullPrompt
          : `${fullPrompt}\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no explanation, no code blocks.`;

      let result;
      if (hasImages) {
        const parts: Part[] = [
          { text: textPrompt },
          ...images.map((img) => ({
            inlineData: { mimeType: img.mimeType, data: img.data },
          })),
        ];
        result = await model.generateContent(parts);
      } else {
        result = await model.generateContent(textPrompt);
      }

      const response = await result.response;
      const content = response.text();

      // With responseMimeType: "application/json", response should be pure JSON
      // But still handle markdown-wrapped JSON as fallback
      let jsonText = content.trim();
      const jsonMatch = jsonText.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonText);
      return schema.parse(parsed);
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error(String(error));
      console.error(
        `[Gemini] Attempt ${attempt + 1} failed:`,
        lastError.message
      );
    }
  }

  throw new Error(
    `AI generation failed after 2 attempts: ${lastError?.message}`
  );
}
