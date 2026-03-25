import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { getObject } from "@/lib/storage/s3-client";

/**
 * Public image endpoint for GitHub issue embedding.
 * Serves attachment images directly so GitHub's camo proxy can fetch them.
 * Secured by UUID randomness (128-bit, practically unguessable).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const { attachmentId } = await params;

  const attachment = await db.taskAttachment.findUnique({
    where: { id: attachmentId },
    select: { s3Key: true, mimeType: true, fileName: true },
  });

  if (!attachment) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Only serve image types through this endpoint
  if (!attachment.mimeType.startsWith("image/")) {
    return new NextResponse("Not an image", { status: 400 });
  }

  try {
    const buffer = await getObject(attachment.s3Key);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `inline; filename="${attachment.fileName}"`,
        "Cache-Control": "public, max-age=86400", // Cache for 1 day
      },
    });
  } catch {
    return new NextResponse("Failed to fetch image", { status: 500 });
  }
}
