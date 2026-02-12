import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-md w-full p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-muted p-4">
            <FileQuestion className="h-16 w-16 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">404</h1>
            <h2 className="text-xl font-semibold">Page Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
