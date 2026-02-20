"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerUser } from "@/server/actions/auth";
import { WorkspaceIllustration } from "@/components/auth/workspace-illustration";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await registerUser(email, password, name);
      if (result.success) {
        router.push("/login");
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left panel - illustration (hidden on mobile) */}
      <div className="hidden lg:flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/90 via-primary to-primary/80 dark:from-primary/80 dark:via-primary/70 dark:to-primary/60 p-12 relative overflow-hidden">
        {/* Background decorative shapes */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/3 right-12 w-20 h-20 bg-white/5 rounded-lg rotate-12" />

        {/* Logo at top left */}
        <div className="absolute top-8 left-8">
          <img
            src="/logo-white.svg"
            alt="Stanza Soft"
            style={{ width: '140px', height: '48px', objectFit: 'contain' }}
          />
        </div>

        {/* Illustration */}
        <div className="relative z-10 flex flex-col items-center gap-8">
          <WorkspaceIllustration />
          <div className="text-center space-y-3 max-w-sm">
            <h2 className="text-2xl font-bold text-white">
              Join your team on Nexus
            </h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Collaborate on sprints, track bugs, and manage tasks with your team — all powered by intelligent AI assistance.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - register form */}
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 lg:hidden">
              <img src="/logo.svg" alt="Stanza Soft" className="dark:hidden" style={{ width: '160px', height: '55px', objectFit: 'contain' }} />
              <img src="/logo-white.svg" alt="Stanza Soft" className="hidden dark:block" style={{ width: '160px', height: '55px', objectFit: 'contain' }} />
            </div>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>
              Sign up to start using Nexus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
