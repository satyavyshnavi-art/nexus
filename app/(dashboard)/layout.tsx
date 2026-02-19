import { auth, signOut } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { NavMenu } from "@/components/layout/nav-menu";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { UserProfileMenu } from "@/components/layout/user-profile-menu";
import Link from "next/link";
import { CommandMenu } from "@/components/command-menu";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:bg-black/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <MobileMenu
              isAdmin={session.user.role === "admin"}
              userName={session.user.name || session.user.email || "User"}
            />
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              Nexus
            </Link>
            <div className="hidden md:block">
              <NavMenu isAdmin={session.user.role === "admin"} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <CommandMenu isAdmin={session.user.role === "admin"} />
            <ThemeToggle />
            <UserProfileMenu
              name={session.user.name}
              email={session.user.email || ""}
              role={session.user.role}
              avatarSrc={null}
              id={session.user.id}
              designation={session.user.designation}
            />
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
