"use server";

import { hash } from "bcrypt";
import { db } from "@/server/db";
import { signIn } from "@/lib/auth/config";
import { AuthError } from "next-auth";

const ALLOWED_EMAIL_DOMAINS = ["stanzasoft.com"];

export async function registerUser(
  email: string,
  password: string,
  name: string
) {
  try {
    // Domain restriction
    const domain = email.split("@")[1]?.toLowerCase();
    if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
      return { success: false, error: "Only @stanzasoft.com email addresses are allowed" };
    }

    const exists = await db.user.findUnique({ where: { email } });
    if (exists) {
      return { success: false, error: "User already exists" };
    }

    const passwordHash = await hash(password, 10);

    const user = await db.user.create({
      data: { email, passwordHash, name },
    });

    const { revalidatePath, revalidateTag } = await import("next/cache");
    revalidatePath("/");
    revalidatePath("/team");
    // @ts-expect-error - Next.js 15 type mismatch in local environment
    revalidateTag("team-stats");
    // @ts-expect-error - Next.js 15 type mismatch in local environment
    revalidateTag("team-members");

    return { success: true, userId: user.id };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Failed to register user" };
  }
}

export async function loginUser(email: string, password: string) {
  // Domain restriction check before attempting sign-in
  const domain = email.split("@")[1]?.toLowerCase();
  if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return { success: false, error: "Access restricted to @stanzasoft.com email addresses only" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Invalid credentials" };
    }
    return { success: false, error: "Login failed" };
  }
}

export async function loginWithGitHub() {
  await signIn("github", { redirectTo: "/" });
}

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function loginWithGitHubRedirect(redirectTo: string) {
  await signIn("github", { redirectTo });
}
