"use server";

import { hash } from "bcrypt";
import { db } from "@/server/db";
import { signIn } from "@/lib/auth/config";
import { AuthError } from "next-auth";

export async function registerUser(
  email: string,
  password: string,
  name: string
) {
  try {
    const exists = await db.user.findUnique({ where: { email } });
    if (exists) {
      return { success: false, error: "User already exists" };
    }

    const passwordHash = await hash(password, 10);

    const user = await db.user.create({
      data: { email, passwordHash, name },
    });

    return { success: true, userId: user.id };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Failed to register user" };
  }
}

export async function loginUser(email: string, password: string) {
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
