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
        prefetch={true}
        className="text-sm font-medium hover:text-primary transition-colors"
      >
        Dashboard
      </Link>

      <Link
        href="/team"
        prefetch={true}
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
              <Link href="/admin/verticals" prefetch={true} className="cursor-pointer">
                Manage Verticals
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/projects" prefetch={true} className="cursor-pointer">
                Manage Projects
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/users" prefetch={true} className="cursor-pointer">
                Manage Users
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
}
