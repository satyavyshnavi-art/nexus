"use server";

import { hash } from "bcrypt";
import { db } from "@/server/db";
import { signIn } from "@/lib/auth/config";
import { AuthError } from "next-auth";
import { z } from "zod";
import { registerUserSchema, loginUserSchema } from "@/lib/validation/schemas";

const ALLOWED_EMAIL_DOMAINS = ["stanzasoft.com"];

export async function registerUser(
  email: string,
  password: string,
  name: string
) {
  // Runtime validation
  const validated = registerUserSchema.parse({ email, password, name });

  try {
    // Domain restriction
    const domain = validated.email.split("@")[1]?.toLowerCase();
    if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
      return { success: false, error: "Only @stanzasoft.com email addresses are allowed" };
    }

    const exists = await db.user.findUnique({ where: { email: validated.email } });
    if (exists) {
      return { success: false, error: "User already exists" };
    }

    const passwordHash = await hash(validated.password, 10);

    const user = await db.user.create({
      data: { email: validated.email, passwordHash, name: validated.name },
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/");
    revalidatePath("/team");

    return { success: true, userId: user.id };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Failed to register user" };
  }
}

export async function loginUser(email: string, password: string) {
  // Runtime validation
  const validated = loginUserSchema.parse({ email, password });

  // Domain restriction check before attempting sign-in
  const domain = validated.email.split("@")[1]?.toLowerCase();
  if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return { success: false, error: "Access restricted to @stanzasoft.com email addresses only" };
  }

  try {
    await signIn("credentials", {
      email: validated.email,
      password: validated.password,
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
  // Runtime validation
  z.string().min(1).parse(redirectTo);

  await signIn("github", { redirectTo });
}
