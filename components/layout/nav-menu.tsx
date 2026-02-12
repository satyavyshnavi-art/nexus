"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface NavMenuProps {
  isAdmin: boolean;
}

export function NavMenu({ isAdmin }: NavMenuProps) {
  return (
    <nav className="flex items-center gap-4">
      <Link
        href="/"
        className="text-sm font-medium hover:text-primary transition-colors"
      >
        Dashboard
      </Link>

      <Link
        href="/team"
        className="text-sm font-medium hover:text-primary transition-colors"
      >
        Team
      </Link>

      {isAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              Admin
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem asChild>
              <Link href="/admin/verticals" className="cursor-pointer">
                Manage Verticals
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/projects" className="cursor-pointer">
                Manage Projects
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/users" className="cursor-pointer">
                Manage Users
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
}
