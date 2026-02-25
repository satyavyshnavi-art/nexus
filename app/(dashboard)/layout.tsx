import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <Sidebar
        isAdmin={isAdmin}
        userName={session.user.name || session.user.email || "User"}
        userEmail={session.user.email || ""}
        userRole={session.user.role as "admin" | "developer" | "reviewer"}
        userId={session.user.id}
        userDesignation={session.user.designation}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 md:px-6 py-6 md:py-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
