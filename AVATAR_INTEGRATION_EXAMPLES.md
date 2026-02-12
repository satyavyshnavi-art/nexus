# Avatar Components - Integration Examples

This document shows practical examples of how to integrate the Avatar component and User Profile Menu into your application.

## Example 1: Dashboard Header with Profile Menu

```typescript
// components/layout/dashboard-header.tsx
'use client';

import { useSession } from 'next-auth/react';
import { UserProfileMenu } from '@/components/layout/user-profile-menu';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function DashboardHeader() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Logo/Title */}
        <h1 className="text-xl font-semibold text-purple-900">Nexus</h1>

        {/* Center: Search */}
        <div className="hidden md:flex flex-1 mx-8">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Right: Notifications & Profile Menu */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          <UserProfileMenu
            name={session.user.name}
            email={session.user.email}
            role={session.user.role as 'admin' | 'member'}
            avatarSrc={session.user.image}
          />
        </div>
      </div>
    </header>
  );
}
```

## Example 2: Team Members List with Avatars

```typescript
// components/team/team-members-list.tsx
'use client';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { User } from '@prisma/client';

interface TeamMembersListProps {
  members: (User & { projectCount: number })[];
}

export function TeamMembersList({ members }: TeamMembersListProps) {
  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
        >
          <div className="flex items-center gap-4">
            <Avatar
              name={member.name || 'Unknown'}
              src={member.avatar || undefined}
              size="md"
              isAdmin={member.role === 'admin'}
            />

            <div className="flex-1">
              <div className="font-medium">
                {member.name}
                {member.role === 'admin' && (
                  <Badge className="ml-2" variant="default">
                    Admin
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {member.email}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-medium">
              {member.projectCount} {member.projectCount === 1 ? 'Project' : 'Projects'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Example 3: Task Assignee Display

```typescript
// components/tasks/task-assignee.tsx
'use client';

import { Avatar } from '@/components/ui/avatar';
import type { User } from '@prisma/client';

interface TaskAssigneeProps {
  assignee: Pick<User, 'id' | 'name' | 'email'> | null;
  size?: 'xs' | 'sm' | 'md';
  showName?: boolean;
}

export function TaskAssignee({
  assignee,
  size = 'sm',
  showName = false,
}: TaskAssigneeProps) {
  if (!assignee) {
    return (
      <div className="text-xs text-gray-500">Unassigned</div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar
        name={assignee.name || 'Unknown'}
        size={size}
      />
      {showName && (
        <span className="text-sm">{assignee.name}</span>
      )}
    </div>
  );
}
```

## Example 4: Comments Section with User Avatars

```typescript
// components/tasks/task-comments.tsx
'use client';

import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { TaskComment, User } from '@prisma/client';

interface CommentWithUser extends TaskComment {
  author: Pick<User, 'id' | 'name' | 'avatar'>;
}

interface TaskCommentsProps {
  comments: CommentWithUser[];
}

export function TaskComments({ comments }: TaskCommentsProps) {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          {/* Avatar */}
          <Avatar
            name={comment.author.name || 'Unknown'}
            src={comment.author.avatar || undefined}
            size="sm"
          />

          {/* Comment Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {comment.author.name}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-700">
              {comment.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Example 5: Sprint Team Overview

```typescript
// components/sprints/sprint-team-overview.tsx
'use client';

import { Avatar } from '@/components/ui/avatar';
import type { User, ProjectMember } from '@prisma/client';

interface SprintTeamOverviewProps {
  members: (ProjectMember & { user: User })[];
}

export function SprintTeamOverview({ members }: SprintTeamOverviewProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="font-semibold mb-4">Sprint Team</h3>

      <div className="flex flex-wrap gap-4">
        {members.map(({ user }) => (
          <div
            key={user.id}
            className="flex flex-col items-center gap-2 p-2"
          >
            <Avatar
              name={user.name || 'Unknown'}
              src={user.avatar || undefined}
              size="lg"
              showStatus={true}
              isAdmin={user.role === 'admin'}
            />
            <div className="text-center">
              <div className="text-xs font-medium truncate w-20">
                {user.name}
              </div>
              <div className="text-xs text-gray-500">
                {user.role === 'admin' ? 'Lead' : 'Member'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Example 6: User Profile Card

```typescript
// components/profile/user-profile-card.tsx
'use client';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { User } from '@prisma/client';

interface UserProfileCardProps {
  user: User;
  onEditClick?: () => void;
}

export function UserProfileCard({ user, onEditClick }: UserProfileCardProps) {
  return (
    <div className="border rounded-lg p-8 bg-white">
      <div className="flex flex-col items-center">
        {/* Avatar - Extra Large */}
        <Avatar
          name={user.name || 'Unknown'}
          src={user.avatar || undefined}
          size="xl"
          isAdmin={user.role === 'admin'}
        />

        {/* User Info */}
        <div className="mt-4 text-center">
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-gray-600 mt-1">{user.email}</p>

          {user.designation && (
            <p className="text-sm text-gray-500 mt-2">
              {user.designation}
            </p>
          )}

          {user.bio && (
            <p className="text-sm text-gray-700 mt-3 max-w-md">
              {user.bio}
            </p>
          )}

          <div className="mt-4">
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
              {user.role === 'admin' ? 'Administrator' : 'Member'}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        {onEditClick && (
          <Button onClick={onEditClick} className="mt-6">
            Edit Profile
          </Button>
        )}
      </div>
    </div>
  );
}
```

## Example 7: Responsive User Menu for Mobile

```typescript
// components/layout/mobile-user-menu.tsx
'use client';

import { UserProfileMenu } from '@/components/layout/user-profile-menu';
import { useSession } from 'next-auth/react';

export function MobileUserMenu() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <div className="md:hidden">
      <UserProfileMenu
        name={session.user.name}
        email={session.user.email}
        role={session.user.role as 'admin' | 'member'}
        avatarSrc={session.user.image}
        className="w-full"
      />
    </div>
  );
}
```

## Usage in API Routes

When fetching user data to pass to these components:

```typescript
// server/actions/users.ts
'use server';

import { auth } from '@/lib/auth/config';
import { db } from '@/server/db';

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      designation: true,
      bio: true,
    },
  });
}
```

Then use it in a component:

```typescript
// app/(dashboard)/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { UserProfileCard } from '@/components/profile/user-profile-card';
import { getCurrentUser } from '@/server/actions/users';
import type { User } from '@prisma/client';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <UserProfileCard user={user} />
    </div>
  );
}
```

## Styling Variations

### Light Theme (Default)
All components use the light theme defined in `app/globals.css`:
- Purple primary: `hsl(270, 75%, 60%)`
- White backgrounds
- Dark text

### Dark Theme
If dark mode is added later, colors are defined with CSS variables and will adapt automatically.

### Custom Sizing in Different Contexts

```typescript
// Inline avatars (comments, mentions)
<Avatar name={user.name} size="xs" />

// List items (team members, assignees)
<Avatar name={user.name} size="sm" />

// Standard UI elements
<Avatar name={user.name} size="md" />

// Profile sections
<Avatar name={user.name} size="lg" />

// Profile pages
<Avatar name={user.name} size="xl" />
```

## Error Handling

The components gracefully handle edge cases:

```typescript
// Missing name defaults to "U" (Unknown)
<Avatar name={null} />  // Shows "U"

// Empty string defaults to "?"
<Avatar name="" />  // Shows "?"

// Missing email in profile menu
<UserProfileMenu name="John" email={null} />

// The components won't break, they'll show sensible defaults
```

## Performance Considerations

1. **Avatar Color Generation**: Hash function is O(n) based on string length - minimal impact
2. **Memoization**: Components don't need memoization for normal usage
3. **Image Loading**: Avatar images use native browser caching
4. **Menu Rendering**: Profile menu items are only rendered when opened (Radix Portal)

## Accessibility Checklist

- [x] Avatar has alt text through name prop
- [x] Profile menu is keyboard navigable (Tab, Enter, Escape)
- [x] All menu items have visible focus indicators
- [x] Icon-only buttons have aria-labels
- [x] Color is not the only indicator (text labels + icons)
- [x] Text contrast ratios meet WCAG AA standards

## Related Files

- Avatar component: `/Users/vyshanvi/nexus/components/ui/avatar.tsx`
- Profile menu: `/Users/vyshanvi/nexus/components/layout/user-profile-menu.tsx`
- Color utility: `/Users/vyshanvi/nexus/lib/utils/avatar.ts`
- Main documentation: `/Users/vyshanvi/nexus/AVATAR_COMPONENTS.md`
