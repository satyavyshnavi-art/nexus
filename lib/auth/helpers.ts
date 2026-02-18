"use server";

import { db } from "@/server/db";
import { randomUUID } from "crypto";

/**
 * Ensures a user is assigned to at least one vertical.
 * If user has no verticals, they are assigned to a default vertical.
 * Creates the default vertical if it doesn't exist.
 *
 * This is critical for GitHub OAuth users to see projects.
 */
export async function ensureUserHasVertical(userId: string): Promise<void> {
  // Check if user already has any vertical memberships
  const existingMembership = await db.verticalUser.findFirst({
    where: { userId },
  });

  // User already has a vertical, no action needed
  if (existingMembership) {
    return;
  }

  // User has no verticals - find or create default vertical
  const defaultVerticalName = "Default";

  // Use upsert to handle race conditions safely
  const defaultVertical = await db.vertical.upsert({
    where: { name: defaultVerticalName },
    update: {},
    create: {
      name: defaultVerticalName,
    },
  });

  // Assign user to default vertical
  await db.verticalUser.create({
    data: {
      id: randomUUID(),
      verticalId: defaultVertical.id,
      userId,
    },
  });
}
