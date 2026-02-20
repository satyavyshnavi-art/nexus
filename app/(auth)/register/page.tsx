"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerUser } from "@/server/actions/auth";
import { WorkspaceIllustration } from "@/components/auth/workspace-illustration";
import { ArrowRight } from "lucide-react";

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
              Join your team on Nexus
            </h2>
            <p className="text-gray-500 text-base leading-relaxed">
              Collaborate on sprints, track bugs, and manage tasks with your team — all powered by intelligent AI assistance.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - register form */}
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
              <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
              <p className="text-muted-foreground mt-2">Sign up to start using Nexus</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold">
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 bg-muted/50 border-muted-foreground/20 text-base"
                />
              </div>

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
                  minLength={6}
                  className="h-12 bg-muted/50 border-muted-foreground/20 text-base"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold gap-2"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-sm text-center text-muted-foreground mt-8">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
