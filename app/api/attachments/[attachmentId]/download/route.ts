import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { getObject } from "@/lib/storage/s3-client";
import { auth } from "@/lib/auth/config";

/**
 * Authenticated download endpoint for attachments.
 * Proxies file from S3 with Content-Disposition: attachment so the browser downloads it.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { attachmentId } = await params;

  const attachment = await db.taskAttachment.findUnique({
    where: { id: attachmentId },
    select: { s3Key: true, mimeType: true, fileName: true },
  });

  if (!attachment) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = await getObject(attachment.s3Key);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${attachment.fileName}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch {
    return new NextResponse("Failed to fetch file", { status: 500 });
  }
}
