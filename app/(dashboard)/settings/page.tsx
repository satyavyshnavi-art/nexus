import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getUserSettings } from "@/server/actions/settings";
import { AccountSettings } from "@/components/settings/account-settings";

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

      <AccountSettings
        userId={session.user.id}
        initialName={settings.name ?? ""}
        initialEmail={settings.email ?? ""}
      />
    </div>
  );
}
