"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateAppearanceSettings } from "@/server/actions/settings";
import { toast } from "sonner";
import { Sun, Moon, Monitor, LayoutGrid, List } from "lucide-react";

interface AppearanceSettingsProps {
  userId: string;
  initialTheme: string;
  initialViewDensity: string;
}

export function AppearanceSettings({
  userId,
  initialTheme,
  initialViewDensity,
}: AppearanceSettingsProps) {
  const [theme, setTheme] = useState(initialTheme);
  const [viewDensity, setViewDensity] = useState(initialViewDensity);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateAppearanceSettings(userId, { theme, viewDensity });
      toast.success("Appearance settings updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update appearance settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose your preferred color theme</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={setTheme}>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                <Sun className="h-4 w-4" />
                Light
              </Label>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                <Moon className="h-4 w-4" />
                Dark
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                <Monitor className="h-4 w-4" />
                System
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>View Density</CardTitle>
          <CardDescription>Choose how compact you want the interface</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={viewDensity} onValueChange={setViewDensity}>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="comfortable" id="comfortable" />
              <Label htmlFor="comfortable" className="flex items-center gap-2 cursor-pointer">
                <LayoutGrid className="h-4 w-4" />
                Comfortable
              </Label>
              <span className="text-sm text-muted-foreground ml-2">More spacing</span>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="compact" id="compact" />
              <Label htmlFor="compact" className="flex items-center gap-2 cursor-pointer">
                <List className="h-4 w-4" />
                Compact
              </Label>
              <span className="text-sm text-muted-foreground ml-2">Less spacing</span>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
