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

  let defaultVertical = await db.vertical.findUnique({
    where: { name: defaultVerticalName },
  });

  // Create default vertical if it doesn't exist
  if (!defaultVertical) {
    defaultVertical = await db.vertical.create({
      data: {
        id: randomUUID(),
        name: defaultVerticalName,
      },
    });
  }

  // Assign user to default vertical
  await db.verticalUser.create({
    data: {
      id: randomUUID(),
      verticalId: defaultVertical.id,
      userId,
    },
  });
}
