"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import { toggleAutoSprint } from "@/server/actions/auto-sprint";
import { useRouter } from "next/navigation";

interface AutoSprintToggleProps {
  projectId: string;
  enabled: boolean;
}

export function AutoSprintToggle({ projectId, enabled }: AutoSprintToggleProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const handleToggle = async (checked: boolean) => {
    setUpdating(true);
    try {
      await toggleAutoSprint(projectId, checked);
      setIsEnabled(checked);
      router.refresh();
    } catch {
      setIsEnabled(!checked);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-blue-500" />
          Auto Weekly Sprint
        </CardTitle>
        <CardDescription>
          Automatically create and activate a weekly sprint (Monday-Friday) when you visit the project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Switch
            id="auto-sprint"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={updating}
          />
          <Label htmlFor="auto-sprint" className="text-sm">
            {isEnabled ? "Enabled" : "Disabled"}
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
