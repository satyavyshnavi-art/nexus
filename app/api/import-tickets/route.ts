import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { extractTicketsFromDocument } from "@/lib/ai/ticket-extractor";

async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  // PDF
  if (fileName.endsWith(".pdf")) {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    const result = await pdfParse(buffer);
    return result.text;
  }

  // DOCX
  if (fileName.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // DOC (older format)
  if (fileName.endsWith(".doc")) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch {
      return buffer.toString("utf-8");
    }
  }

  // Text-based files
  return buffer.toString("utf-8");
}

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

    const documentText = await extractTextFromFile(file);

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
