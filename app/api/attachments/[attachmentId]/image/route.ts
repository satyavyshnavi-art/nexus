import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { getViewUrl } from "@/lib/storage/s3-client";

/**
 * Public image endpoint for GitHub issue embedding.
 * Redirects to a signed R2 URL so GitHub's camo proxy can fetch the image.
 * Secured by UUID randomness (128-bit, practically unguessable).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const { attachmentId } = await params;

  const attachment = await db.taskAttachment.findUnique({
    where: { id: attachmentId },
    select: { s3Key: true, mimeType: true },
  });

  if (!attachment) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Only serve image types through this endpoint
  if (!attachment.mimeType.startsWith("image/")) {
    return new NextResponse("Not an image", { status: 400 });
  }

  try {
    const signedUrl = await getViewUrl(attachment.s3Key);
    return NextResponse.redirect(signedUrl);
  } catch {
    return new NextResponse("Failed to fetch image", { status: 500 });
  }
}
