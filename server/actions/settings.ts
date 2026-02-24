"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { revalidatePath, unstable_cache } from "next/cache";
import { hash, compare } from "bcrypt";

/**
 * Get user settings (cached 30s)
 */
export async function getUserSettings(userId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Only allow users to view their own settings
  if (session.user.id !== userId) {
    throw new Error("Forbidden");
  }

  const getCachedSettings = unstable_cache(
    async (id: string) => {
      return db.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    },
    ["user-settings"],
    {
      revalidate: 30,
      tags: [`user-settings-${userId}`],
    }
  );

  const settings = await getCachedSettings(userId);
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
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (session.user.id !== userId) {
    throw new Error("Forbidden");
  }

  // Validate name
  if (data.name !== undefined && data.name.trim().length === 0) {
    throw new Error("Name cannot be empty");
  }

  // Validate email
  if (data.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error("Invalid email format");
    }

    // Check if email is already taken
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error("Email already in use");
    }
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
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
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (session.user.id !== userId) {
    throw new Error("Forbidden");
  }

  // Validate new password
  if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  // Get current password hash
  const user = await db.user.findUnique({
    where: { id: userId },
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
  const isValid = await compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new Error("Current password is incorrect");
  }

  // Hash new password
  const passwordHash = await hash(newPassword, 10);

  // Update password
  await db.user.update({
    where: { id: userId },
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
