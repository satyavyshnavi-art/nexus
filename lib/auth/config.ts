import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { compare } from "bcrypt";
import { db } from "@/server/db";
import type { UserRole } from "@prisma/client";
import { encrypt } from "@/lib/crypto/encryption";
import { ensureUserHasVertical } from "@/lib/auth/helpers";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // GitHub OAuth provider
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo read:org", // Include repo + org access for linking repositories
        },
      },
    }),

    // Google OAuth provider
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Existing Credentials provider
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        // Check if user has a password (GitHub users might not)
        if (!user.passwordHash) {
          return null;
        }

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    // Handle GitHub OAuth sign-in
    async signIn({ user, account, profile }) {
      if (account?.provider === "github") {
        try {
          // Encrypt tokens before storage
          const encryptedAccessToken = account.access_token
            ? encrypt(account.access_token)
            : null;
          const encryptedRefreshToken = account.refresh_token
            ? encrypt(account.refresh_token)
            : null;

          const githubProfile = profile as { login?: string };
          const githubData = {
            githubId: account.providerAccountId,
            githubUsername: githubProfile?.login,
            githubAccessToken: encryptedAccessToken,
            githubRefreshToken: encryptedRefreshToken,
            githubTokenExpiry: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
          };

          // Use a single transaction to find/create user and ensure vertical
          await db.$transaction(async (tx) => {
            // Check by GitHub ID first, then by email
            let dbUser = await tx.user.findUnique({
              where: { githubId: account.providerAccountId },
            });

            if (!dbUser && user.email) {
              dbUser = await tx.user.findUnique({
                where: { email: user.email },
              });
            }

            if (dbUser) {
              await tx.user.update({
                where: { id: dbUser.id },
                data: githubData,
              });

              // Ensure vertical assignment within transaction
              const existingMembership = await tx.verticalUser.findFirst({
                where: { userId: dbUser.id },
              });
              if (!existingMembership) {
                const defaultVertical = await tx.vertical.upsert({
                  where: { name: "Default" },
                  update: {},
                  create: { name: "Default" },
                });
                await tx.verticalUser.create({
                  data: { verticalId: defaultVertical.id, userId: dbUser.id },
                });
              }
            } else {
              const newUser = await tx.user.create({
                data: {
                  email: user.email!,
                  name: user.name || (profile as any)?.login || "GitHub User",
                  ...githubData,
                  role: "reviewer",
                },
              });

              // Assign to default vertical within transaction
              const defaultVertical = await tx.vertical.upsert({
                where: { name: "Default" },
                update: {},
                create: { name: "Default" },
              });
              await tx.verticalUser.create({
                data: { verticalId: defaultVertical.id, userId: newUser.id },
              });
            }
          });
        } catch (error) {
          console.error("GitHub sign-in error:", error);
          return false;
        }
      }

      if (account?.provider === "google") {
        try {
          await db.$transaction(async (tx) => {
            let dbUser = user.email
              ? await tx.user.findUnique({ where: { email: user.email } })
              : null;

            if (dbUser) {
              await tx.user.update({
                where: { id: dbUser.id },
                data: {
                  name: dbUser.name || user.name || "Google User",
                  avatar: dbUser.avatar || user.image || null,
                },
              });
            } else {
              const newUser = await tx.user.create({
                data: {
                  email: user.email!,
                  name: user.name || "Google User",
                  avatar: user.image || null,
                  role: "reviewer",
                },
              });

              const defaultVertical = await tx.vertical.upsert({
                where: { name: "Default" },
                update: {},
                create: { name: "Default" },
              });
              await tx.verticalUser.create({
                data: { verticalId: defaultVertical.id, userId: newUser.id },
              });
            }
          });
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        // If coming from GitHub, the user.id might be the Provider ID, not our DB UUID.
        // We MUST fetch the real DB ID to ensure session coherence.
        if (account?.provider === "github" || account?.provider === "google") {
          const dbUser = await db.user.findUnique({
            where: { email: user.email! }
          });

          if (dbUser) {
            token.sub = dbUser.id; // Override with DB UUID
            token.role = dbUser.role;
            token.designation = dbUser.designation;
          }
        } else {
          // Credentials provider returns correct shape
          token.role = user.role as UserRole;
          token.designation = user.designation;
        }
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.designation = token.designation as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
