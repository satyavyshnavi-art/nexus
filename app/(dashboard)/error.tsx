"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Oops! Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              {error.message ||
                "We encountered an error while loading this page."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={reset}>Try Again</Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/dashboard")}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
