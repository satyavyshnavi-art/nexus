'use client';

import React from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Settings, Users, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfileMenuProps {
  /** User name */
  name?: string | null;
  /** User email */
  email?: string | null;
  /** User role: admin | member */
  role?: 'admin' | 'member';
  /** User avatar image URL */
  avatarSrc?: string | null;
  /** Custom className for the trigger button */
  className?: string;
  /** User ID */
  id?: string;
  /** User designation */
  designation?: string | null;
}

export function UserProfileMenu({
  name = 'User',
  email = 'user@example.com',
  role = 'member',
  avatarSrc,
  className,
  ...otherProps
}: UserProfileMenuProps) {
  const handleSignOut = async () => {
    await signOut({ redirectTo: '/login' });
  };

  const roleColor = role === 'admin' ? 'default' : 'secondary';
  const roleLabel = role === 'admin' ? 'Admin' : 'Member';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className
          )}
          aria-label="Open user menu"
        >
          <Avatar
            src={avatarSrc ?? undefined}
            name={name ?? 'U'}
            size="sm"
            isAdmin={role === 'admin'}
          />
          <div className="hidden flex-col items-start md:flex">
            <span className="text-sm font-medium">{name}</span>
            <span className="text-xs text-muted-foreground">{roleLabel}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 max-h-[24rem] overflow-y-auto">
        {/* User Info Header */}
        <div className="px-2 py-1.5">
          <p className="text-sm font-semibold leading-none">{name}</p>
          <p className="text-xs text-muted-foreground leading-none mt-1">
            {email}
          </p>
          <p className="text-[10px] text-muted-foreground leading-none mt-1 font-mono">
            ID: {otherProps.id?.slice(0, 8)}...
          </p>
          {otherProps.designation && (
            <p className="text-xs text-primary font-medium mt-1">
              {otherProps.designation}
            </p>
          )}
          <div className="mt-2">
            <Badge variant={roleColor} className="text-xs">
              {roleLabel}
            </Badge>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <Link href="/profile" legacyBehavior passHref>
          <DropdownMenuItem asChild>
            <a className="flex cursor-pointer items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span>Profile</span>
            </a>
          </DropdownMenuItem>
        </Link>

        <Link href="/settings" legacyBehavior passHref>
          <DropdownMenuItem asChild>
            <a className="flex cursor-pointer items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </a>
          </DropdownMenuItem>
        </Link>

        {/* Admin-only Team Management */}
        {role === 'admin' && (
          <Link href="/team" legacyBehavior passHref>
            <DropdownMenuItem asChild>
              <a className="flex cursor-pointer items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Team</span>
              </a>
            </DropdownMenuItem>
          </Link>
        )}

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex cursor-pointer items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
