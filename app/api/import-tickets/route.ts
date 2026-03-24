import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { extractTicketsFromDocument } from "@/lib/ai/ticket-extractor";

// Allow up to 60 seconds for AI processing
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    // For PDFs — send directly to Gemini as inline data (Gemini reads PDFs natively)
    if (fileName.endsWith(".pdf")) {
      const base64 = buffer.toString("base64");
      const result = await extractTicketsFromDocument(
        "Extract all tickets from the attached PDF document.",
        [{ mimeType: "application/pdf", data: base64 }]
      );
      return NextResponse.json({ success: true, tickets: result.tickets });
    }

    // For DOCX — use mammoth to extract text
    let documentText: string;
    if (fileName.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      documentText = result.value;
    } else if (fileName.endsWith(".doc")) {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        documentText = result.value;
      } catch {
        documentText = buffer.toString("utf-8");
      }
    } else {
      // Text-based files (.txt, .csv, .md)
      documentText = buffer.toString("utf-8");
    }

    if (!documentText.trim()) {
      return NextResponse.json({
        success: false,
        error: "Could not extract text from file. Try a .txt or .csv file.",
      });
    }

    // Limit to 50K chars
    const trimmedText = documentText.slice(0, 50000);

    const result = await extractTicketsFromDocument(trimmedText);
    return NextResponse.json({ success: true, tickets: result.tickets });
  } catch (error) {
    console.error("Failed to parse document:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse document",
    }, { status: 500 });
  }
}
