"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Home, Shield, Users, FolderKanban, User as UserIcon } from "lucide-react";

interface MobileMenuProps {
  isAdmin: boolean;
  userName: string;
}

export function MobileMenu({ isAdmin, userName }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>
            <img src="/logo.svg" alt="Stanza Soft" className="dark:hidden" style={{ width: '140px', height: '50px', objectFit: 'contain' }} />
            <img src="/logo-white.svg" alt="Stanza Soft" className="hidden dark:block" style={{ width: '140px', height: '50px', objectFit: 'contain' }} />
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 mt-6">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent"
          >
            <Home className="h-5 w-5" />
            Dashboard
          </Link>

          {isAdmin && (
            <>
              <div className="px-3 py-2 text-sm font-semibold text-muted-foreground mt-4">
                Admin
              </div>
              <Link
                href="/admin/verticals"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent"
              >
                <FolderKanban className="h-5 w-5" />
                Manage Verticals
              </Link>
              <Link
                href="/admin/projects"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent"
              >
                <Shield className="h-5 w-5" />
                Manage Projects
              </Link>
              <Link
                href="/admin/users"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent"
              >
                <Users className="h-5 w-5" />
                Manage Users
              </Link>
            </>
          )}

          <div className="px-3 py-2 text-sm font-semibold text-muted-foreground mt-4">
            Account
          </div>
          <div className="flex items-center gap-3 px-3 py-2">
            <UserIcon className="h-5 w-5" />
            <span className="text-sm">{userName}</span>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
