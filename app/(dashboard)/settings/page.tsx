import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getUserSettings } from "@/server/actions/settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettings } from "@/components/settings/account-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { User, Bell, Palette } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const settings = await getUserSettings(session.user.id);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <AccountSettings
            userId={session.user.id}
            initialName={settings.name || ""}
            initialEmail={settings.email}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings
            userId={session.user.id}
            initialSettings={{
              emailNotifications: settings.emailNotifications,
              taskNotifications: settings.taskNotifications,
              commentNotifications: settings.commentNotifications,
              sprintNotifications: settings.sprintNotifications,
              dailyDigest: settings.dailyDigest,
            }}
          />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettings
            userId={session.user.id}
            initialTheme={settings.theme}
            initialViewDensity={settings.viewDensity}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
