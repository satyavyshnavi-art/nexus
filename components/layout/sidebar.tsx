"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileMenu } from "@/components/layout/user-profile-menu";
import { CommandMenu } from "@/components/command-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Home,
  Users,
  CheckSquare,
  FolderKanban,
  Briefcase,
  UserCog,
  PanelLeftClose,
  PanelLeft,
  Menu,
} from "lucide-react";

const SIDEBAR_COLLAPSED_KEY = "nexus-sidebar-collapsed";

interface SidebarProps {
  isAdmin: boolean;
  userName: string;
  userEmail: string;
  userRole: "admin" | "member";
  userId: string;
  userDesignation?: string | null;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Team", href: "/team", icon: Users },
  { label: "My Tasks", href: "/profile", icon: CheckSquare },
];

const adminNavItems: NavItem[] = [
  { label: "Verticals", href: "/admin/verticals", icon: FolderKanban },
  { label: "Projects", href: "/admin/projects", icon: Briefcase },
  { label: "Users", href: "/admin/users", icon: UserCog },
];

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

// --- Desktop Sidebar ---

function DesktopSidebar({
  isAdmin,
  userName,
  userEmail,
  userRole,
  userId,
  userDesignation,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === "true") {
        setCollapsed(true);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // localStorage not available
      }
      return next;
    });
  }, []);

  // Prevent flash of wrong state before hydration
  if (!mounted) {
    return (
      <aside className="hidden md:flex flex-col h-screen w-[260px] bg-card border-r border-border flex-shrink-0" />
    );
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen bg-card border-r border-border flex-shrink-0 transition-all duration-300 ease-in-out",
        collapsed ? "w-[70px]" : "w-[260px]"
      )}
    >
      {/* Logo area */}
      <div
        className={cn(
          "flex items-center border-b border-border flex-shrink-0",
          collapsed ? "justify-center px-2 py-5" : "justify-between px-4 py-5"
        )}
      >
        {!collapsed && (
          <Link href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
            <img
              src="/logo.svg"
              alt="Nexus"
              className="dark:hidden"
              style={{ width: "120px", height: "36px", objectFit: "contain" }}
            />
            <img
              src="/logo-white.svg"
              alt="Nexus"
              className="hidden dark:block"
              style={{ width: "120px", height: "36px", objectFit: "contain" }}
            />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="h-8 w-8 flex-shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Search / Command Menu */}
      <div
        className={cn(
          "flex-shrink-0 border-b border-border",
          collapsed ? "px-2 py-3 flex justify-center" : "px-3 py-3"
        )}
      >
        <CommandMenu isAdmin={isAdmin} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Main navigation */}
        <div className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-lg transition-colors",
                  collapsed
                    ? "justify-center px-2 py-2.5"
                    : "gap-3 px-3 py-2.5",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Admin section */}
        {isAdmin && (
          <div className="mt-6">
            {!collapsed ? (
              <div className="px-3 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </span>
              </div>
            ) : (
              <div className="mx-2 mb-2 border-t border-border" />
            )}
            <div className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActiveRoute(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center rounded-lg transition-colors",
                      collapsed
                        ? "justify-center px-2 py-2.5"
                        : "gap-3 px-3 py-2.5",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom section: Theme + User */}
      <div className="mt-auto border-t border-border flex-shrink-0">
        {/* Theme toggle */}
        <div
          className={cn(
            "flex items-center border-b border-border",
            collapsed ? "justify-center px-2 py-3" : "px-4 py-3"
          )}
        >
          <ThemeToggle />
          {!collapsed && (
            <span className="ml-3 text-sm text-muted-foreground">Theme</span>
          )}
        </div>

        {/* User profile */}
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center px-2 py-3" : "px-2 py-3"
          )}
        >
          <UserProfileMenu
            name={userName}
            email={userEmail}
            role={userRole}
            avatarSrc={null}
            id={userId}
            designation={userDesignation}
            className={cn(
              collapsed && "px-1"
            )}
          />
        </div>
      </div>
    </aside>
  );
}

// --- Mobile Sidebar (Sheet overlay) ---

function MobileSidebar({
  isAdmin,
  userName,
  userEmail,
  userRole,
  userId,
  userDesignation,
}: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close sheet on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            className="h-9 w-9"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <img
              src="/logo.svg"
              alt="Nexus"
              className="dark:hidden"
              style={{ width: "100px", height: "32px", objectFit: "contain" }}
            />
            <img
              src="/logo-white.svg"
              alt="Nexus"
              className="hidden dark:block"
              style={{ width: "100px", height: "32px", objectFit: "contain" }}
            />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <CommandMenu isAdmin={isAdmin} />
          <ThemeToggle />
        </div>
      </header>

      {/* Sheet sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="px-4 py-5 border-b border-border">
            <SheetTitle>
              <img
                src="/logo.svg"
                alt="Nexus"
                className="dark:hidden"
                style={{ width: "120px", height: "36px", objectFit: "contain" }}
              />
              <img
                src="/logo-white.svg"
                alt="Nexus"
                className="hidden dark:block"
                style={{ width: "120px", height: "36px", objectFit: "contain" }}
              />
            </SheetTitle>
            <SheetDescription className="sr-only">
              Navigation menu
            </SheetDescription>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto py-4">
            {/* Main navigation */}
            <div className="space-y-1 px-3">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActiveRoute(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Admin section */}
            {isAdmin && (
              <div className="mt-6">
                <div className="px-3 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Admin
                  </span>
                </div>
                <div className="space-y-1 px-3">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActiveRoute(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                          active
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>

          {/* Bottom user area */}
          <div className="border-t border-border p-4 mt-auto">
            <UserProfileMenu
              name={userName}
              email={userEmail}
              role={userRole}
              avatarSrc={null}
              id={userId}
              designation={userDesignation}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// --- Exported Sidebar ---

export function Sidebar(props: SidebarProps) {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
}
