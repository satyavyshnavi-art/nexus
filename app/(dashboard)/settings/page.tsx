import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getUserSettings } from "@/server/actions/settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettings } from "@/components/settings/account-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { User, Bell } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch settings with error handling
  let settings;
  try {
    settings = await getUserSettings(session.user.id);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    // Provide default settings if fetch fails
    settings = {
      id: session.user.id,
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      emailNotifications: true,
      taskNotifications: true,
      commentNotifications: true,
      sprintNotifications: true,
      dailyDigest: false,
    };
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <AccountSettings
            userId={session.user.id}
            initialName={settings.name ?? ""}
            initialEmail={settings.email ?? ""}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings
            userId={session.user.id}
            initialSettings={{
              emailNotifications: settings.emailNotifications ?? true,
              taskNotifications: settings.taskNotifications ?? true,
              commentNotifications: settings.commentNotifications ?? true,
              sprintNotifications: settings.sprintNotifications ?? true,
              dailyDigest: settings.dailyDigest ?? false,
            }}
          />
        </TabsContent>

      </Tabs>
    </div>
  );
}
