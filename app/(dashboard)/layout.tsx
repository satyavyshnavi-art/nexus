import { auth, signOut } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { NavMenu } from "@/components/layout/nav-menu";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { UserProfileMenu } from "@/components/layout/user-profile-menu";
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
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b flex-shrink-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MobileMenu
              isAdmin={session.user.role === "admin"}
              userName={session.user.name || session.user.email || "User"}
            />
            <Link href="/" className="text-xl font-bold text-primary">
              Nexus
            </Link>
            <div className="hidden md:block">
              <NavMenu isAdmin={session.user.role === "admin"} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UserProfileMenu
              name={session.user.name}
              email={session.user.email || ""}
              role={session.user.role}
              avatarSrc={null}
            />
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
