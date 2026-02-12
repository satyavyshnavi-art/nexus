import { auth, signOut } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NavMenu } from "@/components/layout/nav-menu";
import { MobileMenu } from "@/components/layout/mobile-menu";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MobileMenu
              isAdmin={session.user.role === "admin"}
              userName={session.user.name || session.user.email || "User"}
            />
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              Nexus
            </Link>
            <div className="hidden md:block">
              <NavMenu isAdmin={session.user.role === "admin"} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">
              {session.user.name || session.user.email}
              <span className="ml-2 text-xs bg-secondary px-2 py-1 rounded">
                {session.user.role}
              </span>
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="outline" size="sm">
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
