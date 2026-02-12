"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-md w-full p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Something went wrong!</h1>
            <p className="text-sm text-muted-foreground">
              {error.message || "An unexpected error occurred."}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={reset}>Try Again</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Go Home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
