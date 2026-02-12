import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  title = "Something went wrong",
  message = "An error occurred while loading this content.",
  onRetry,
}: ErrorMessageProps) {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-md">{message}</p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    </Card>
  );
}
