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
