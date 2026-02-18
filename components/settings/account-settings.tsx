"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateAccountSettings, updatePassword } from "@/server/actions/settings";
import { toast } from "sonner";

interface AccountSettingsProps {
  userId: string;
  initialName: string;
  initialEmail: string;
}

export function AccountSettings({ userId, initialName, initialEmail }: AccountSettingsProps) {
  const [name, setName] = useState(initialName || "");
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const handleSaveAccount = async () => {
    setIsLoading(true);
    try {
      await updateAccountSettings(userId, { name, email });
      toast.success("Account settings updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update account settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsPasswordLoading(true);
    try {
      await updatePassword(userId, currentPassword, newPassword);
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Update your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
            />
          </div>
          <Button onClick={handleSaveAccount} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <GitHubConnection userId={userId} />

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <Button onClick={handleChangePassword} disabled={isPasswordLoading}>
            {isPasswordLoading ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect } from "react";
import { getGitHubConnectionStatus } from "@/server/actions/settings";
import { loginWithGitHub } from "@/server/actions/auth";
import { Github } from "lucide-react";

function GitHubConnection({ userId }: { userId: string }) {
  const [status, setStatus] = useState<{ connected: boolean; username?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGitHubConnectionStatus()
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to get GitHub status:", err);
        setLoading(false);
      });
  }, [userId]);

  const handleConnect = async () => {
    try {
      await loginWithGitHub();
    } catch (error) {
      toast.error("Failed to redirect to GitHub");
    }
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub Connection</CardTitle>
        <CardDescription>Connect your GitHub account to link repositories and sync issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="bg-background p-2 rounded-full border">
              <Github className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">GitHub Account</p>
              <p className="text-sm text-muted-foreground">
                {status?.connected
                  ? `Connected as ${status.username}`
                  : "Not connected"}
              </p>
            </div>
          </div>
          {status?.connected ? (
            <Button variant="outline" disabled>
              Connected
            </Button>
          ) : (
            <Button onClick={handleConnect} variant="default">
              Connect GitHub
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
