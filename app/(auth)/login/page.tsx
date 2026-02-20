"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginUser, loginWithGitHub } from "@/server/actions/auth";
import { WorkspaceIllustration } from "@/components/auth/workspace-illustration";
import { ArrowRight } from "lucide-react";

// Map NextAuth error codes to user-friendly messages
const getErrorMessage = (error: string | null): string | null => {
  if (!error) return null;

  const errorMessages: Record<string, string> = {
    OAuthSignin: "Error connecting to GitHub. Please try again.",
    OAuthCallback: "Error during GitHub authentication. Please try again.",
    OAuthCreateAccount: "Could not create account with GitHub. Please try signing in with email or contact support.",
    OAuthAccountNotLinked: "This email is already associated with another account. Please sign in using your original method.",
    EmailSignin: "Error sending verification email. Please try again.",
    CredentialsSignin: "Invalid email or password. Please try again.",
    SessionRequired: "Please sign in to access this page.",
    Default: "An error occurred during sign-in. Please try again.",
  };

  return errorMessages[error] || errorMessages.Default;
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check for OAuth errors in URL on mount
  useEffect(() => {
    const urlError = searchParams.get("error");
    const errorMessage = getErrorMessage(urlError);
    if (errorMessage) {
      setError(errorMessage);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginUser(email, password);
      if (result.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGitHub();
    } catch (err) {
      console.error("GitHub sign-in error:", err);
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        return;
      }
      setError(err instanceof Error ? err.message : "GitHub sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left panel - light illustration side */}
      <div className="hidden lg:flex flex-col min-h-screen bg-[#F8F7FF] relative overflow-hidden">
        {/* Subtle decorative shapes */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#EDE9FE] rounded-full -translate-y-1/2 translate-x-1/4 opacity-40" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#E0F2FE] rounded-full translate-y-1/3 -translate-x-1/4 opacity-30" />

        {/* Logo */}
        <div className="relative z-10 p-8">
          <img
            src="/logo.svg"
            alt="Stanza Soft"
            style={{ width: '140px', height: '48px', objectFit: 'contain' }}
          />
        </div>

        {/* Illustration centered */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-12 pb-12">
          <WorkspaceIllustration />
          <div className="text-center space-y-4 mt-10 max-w-md">
            <h2 className="text-3xl font-bold text-gray-800 leading-tight">
              Manage projects with AI-powered intelligence
            </h2>
            <p className="text-gray-500 text-base leading-relaxed">
              Sprint planning, bug classification, and Kanban boards — all enhanced with AI to help your team ship faster.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="min-h-screen flex flex-col bg-background">
        {/* Mobile logo */}
        <div className="flex justify-center pt-8 pb-4 lg:hidden">
          <img src="/logo.svg" alt="Stanza Soft" className="dark:hidden" style={{ width: '140px', height: '48px', objectFit: 'contain' }} />
          <img src="/logo-white.svg" alt="Stanza Soft" className="hidden dark:block" style={{ width: '140px', height: '48px', objectFit: 'contain' }} />
        </div>

        {/* Form centered */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
              <p className="text-muted-foreground mt-2">Please login to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-muted/50 border-muted-foreground/20 text-base"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-muted/50 border-muted-foreground/20 text-base"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold gap-2"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login to Nexus"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-3 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base font-medium"
                onClick={handleGitHubSignIn}
                disabled={loading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Sign in with GitHub
              </Button>
            </form>

            {/* Footer */}
            <p className="text-sm text-center text-muted-foreground mt-8">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
