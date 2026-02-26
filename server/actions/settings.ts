"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { hash, compare } from "bcrypt";
import { z } from "zod";
import { updateAccountSettingsSchema, updatePasswordSchema } from "@/lib/validation/schemas";

/**
 * Get user settings (cached 30s)
 */
export async function getUserSettings(userId: string) {
  // Runtime validation
  z.string().min(1).parse(userId);

  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Only allow users to view their own settings
  if (session.user.id !== userId) {
    throw new Error("Forbidden");
  }

  const settings = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
  if (!settings) {
    throw new Error("User not found");
  }

  // Return with proper defaults for all fields
  return {
    id: settings.id,
    name: settings.name ?? "",
    email: settings.email,
  };
}

/**
 * Update account settings (name, email)
 */
export async function updateAccountSettings(
  userId: string,
  data: {
    name?: string;
    email?: string;
  }
) {
  // Runtime validation
  z.string().min(1).parse(userId);
  const validatedData = updateAccountSettingsSchema.parse(data);

  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (session.user.id !== userId) {
    throw new Error("Forbidden");
  }

  // Check if email is already taken
  if (validatedData.email !== undefined) {
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error("Email already in use");
    }
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      ...(validatedData.name && { name: validatedData.name }),
      ...(validatedData.email && { email: validatedData.email }),
    },
  });

  revalidatePath("/settings");
  return updated;
}

/**
 * Update password
 */
export async function updatePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  // Runtime validation
  const validatedPw = updatePasswordSchema.parse({ userId, currentPassword, newPassword });

  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (session.user.id !== validatedPw.userId) {
    throw new Error("Forbidden");
  }

  // Get current password hash
  const user = await db.user.findUnique({
    where: { id: validatedPw.userId },
    select: { passwordHash: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if user has a password (GitHub users might not)
  if (!user.passwordHash) {
    throw new Error(
      "This account uses GitHub sign-in and doesn't have a password. " +
      "To set a password, please contact support."
    );
  }

  // Verify current password
  const isValid = await compare(validatedPw.currentPassword, user.passwordHash);
  if (!isValid) {
    throw new Error("Current password is incorrect");
  }

  // Hash new password
  const passwordHash = await hash(validatedPw.newPassword, 10);

  // Update password
  await db.user.update({
    where: { id: validatedPw.userId },
    data: { passwordHash },
  });

  revalidatePath("/settings");
  return { success: true };
}

/**
 * Check if user is connected to GitHub
 */
export async function getGitHubConnectionStatus() {
  const session = await auth();
  if (!session?.user) {
    return { connected: false };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      githubAccessToken: true,
      githubUsername: true,
    },
  });

  return {
    connected: !!user?.githubAccessToken,
    username: user?.githubUsername,
  };
}
