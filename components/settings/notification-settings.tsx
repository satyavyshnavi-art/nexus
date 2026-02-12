"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateNotificationSettings } from "@/server/actions/settings";
import { toast } from "sonner";

interface NotificationSettingsProps {
  userId: string;
  initialSettings: {
    emailNotifications: boolean;
    taskNotifications: boolean;
    commentNotifications: boolean;
    sprintNotifications: boolean;
    dailyDigest: boolean;
  };
}

export function NotificationSettings({ userId, initialSettings }: NotificationSettingsProps) {
  const [settings, setSettings] = useState(initialSettings);

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    try {
      await updateNotificationSettings(userId, { [key]: value });
      toast.success("Notification settings updated");
    } catch (error) {
      // Revert on error
      setSettings((prev) => ({ ...prev, [key]: !value }));
      toast.error(error instanceof Error ? error.message : "Failed to update settings");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications via email
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={settings.emailNotifications}
            onCheckedChange={(checked) => handleToggle("emailNotifications", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="task-notifications">Ticket Assignments</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when you are assigned to a ticket
            </p>
          </div>
          <Switch
            id="task-notifications"
            checked={settings.taskNotifications}
            onCheckedChange={(checked) => handleToggle("taskNotifications", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="comment-notifications">Comment Mentions</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when someone mentions you in a comment
            </p>
          </div>
          <Switch
            id="comment-notifications"
            checked={settings.commentNotifications}
            onCheckedChange={(checked) => handleToggle("commentNotifications", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sprint-notifications">Sprint Updates</Label>
            <p className="text-sm text-muted-foreground">
              Get notified about sprint status changes
            </p>
          </div>
          <Switch
            id="sprint-notifications"
            checked={settings.sprintNotifications}
            onCheckedChange={(checked) => handleToggle("sprintNotifications", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="daily-digest">Daily Digest</Label>
            <p className="text-sm text-muted-foreground">
              Receive a daily summary of your tickets and activity
            </p>
          </div>
          <Switch
            id="daily-digest"
            checked={settings.dailyDigest}
            onCheckedChange={(checked) => handleToggle("dailyDigest", checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
