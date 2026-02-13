import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { compare } from "bcrypt";
import { db } from "@/server/db";
import type { UserRole } from "@prisma/client";
import { encrypt } from "@/lib/crypto/encryption";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // GitHub OAuth provider
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "repo read:user", // Request repo access for syncing
        },
      },
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
          // Check if user exists by GitHub ID
          let dbUser = await db.user.findUnique({
            where: { githubId: account.providerAccountId },
          });

          // If not found, check by email for account linking
          if (!dbUser && user.email) {
            dbUser = await db.user.findUnique({
              where: { email: user.email },
            });
          }

          // Encrypt tokens before storage
          const encryptedAccessToken = account.access_token
            ? encrypt(account.access_token)
            : null;
          const encryptedRefreshToken = account.refresh_token
            ? encrypt(account.refresh_token)
            : null;

          if (dbUser) {
            // Update existing user with GitHub data
            await db.user.update({
              where: { id: dbUser.id },
              data: {
                githubId: account.providerAccountId,
                githubUsername: (profile as any)?.login as string,
                githubAccessToken: encryptedAccessToken,
                githubRefreshToken: encryptedRefreshToken,
                githubTokenExpiry: account.expires_at
                  ? new Date(account.expires_at * 1000)
                  : null,
              },
            });
          } else {
            // Create new user from GitHub
            await db.user.create({
              data: {
                email: user.email!,
                name: user.name || (profile as any)?.login || "GitHub User",
                githubId: account.providerAccountId,
                githubUsername: (profile as any)?.login as string,
                githubAccessToken: encryptedAccessToken,
                githubRefreshToken: encryptedRefreshToken,
                githubTokenExpiry: account.expires_at
                  ? new Date(account.expires_at * 1000)
                  : null,
                role: "member", // Default role
              },
            });
          }
        } catch (error) {
          console.error("GitHub sign-in error:", error);
          return false;
        }
      }

      return true;
    },

    jwt({ token, user }) {
      if (user) {
        token.role = user.role as UserRole;
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
