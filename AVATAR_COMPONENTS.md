# Avatar Components Documentation

## Overview

Three new components have been created for user avatar management and profile interactions:

1. **Avatar Component** (`components/ui/avatar.tsx`) - Customizable user avatar with initials fallback
2. **Color Generator Utility** (`lib/utils/avatar.ts`) - Consistent color generation from names
3. **User Profile Menu** (`components/layout/user-profile-menu.tsx`) - Dropdown menu for user profile management

## Components

### 1. Avatar Component

A versatile avatar component that displays user information with multiple options.

#### Location
`/Users/vyshanvi/nexus/components/ui/avatar.tsx`

#### Features
- Image source with fallback to initials
- Automatic initials generation from name
- Consistent color assignment based on name hash
- Size variants: `xs` (24px), `sm` (32px), `md` (40px), `lg` (56px), `xl` (80px)
- Admin crown badge overlay
- Online status indicator (green dot)
- Built with Radix UI Avatar primitive

#### Props
```typescript
interface AvatarProps {
  /** Image source URL (optional) */
  src?: string;

  /** User name for initials fallback (required) */
  name: string;

  /** Avatar size: xs|sm|md|lg|xl (default: md) */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /** Show online status indicator (default: false) */
  showStatus?: boolean;

  /** Show admin crown badge (default: false) */
  isAdmin?: boolean;

  /** Custom className */
  className?: string;
}
```

#### Examples

```typescript
'use client';

import { Avatar } from '@/components/ui/avatar';

// Basic avatar with initials fallback
<Avatar name="John Doe" size="md" />

// Admin avatar with crown badge
<Avatar name="Alice Smith" size="lg" isAdmin={true} />

// Avatar with online status indicator
<Avatar name="Bob Johnson" size="sm" showStatus={true} />

// Avatar with image and admin badge
<Avatar
  name="Carol White"
  src="/avatars/carol.jpg"
  size="xl"
  isAdmin={true}
/>

// Small avatar for lists
<Avatar name="David Lee" size="xs" />
```

#### Size Variants
- `xs`: 24px - For compact spaces (hidden admin badge)
- `sm`: 32px - For lists, comments
- `md`: 40px - Default, for most UI elements
- `lg`: 56px - For profile headers, larger displays
- `xl`: 80px - For profile pages, hero sections

#### Theme
- Uses purple color palette (hsl(270, 75%, 60%) primary)
- Consistent with app theme in `app/globals.css`
- High contrast initials for accessibility

---

### 2. Color Generator Utility

Generates consistent colors for avatars based on user names.

#### Location
`/Users/vyshanvi/nexus/lib/utils/avatar.ts`

#### Functions

##### `getAvatarColor(name: string)`
Returns a consistent color palette entry for a given name.

```typescript
export function getAvatarColor(name: string): {
  bg: string;  // Background color (HSL)
  text: string; // Text color (HSL)
}
```

**Returns:**
- `bg`: Background color in HSL format
- `text`: Text color in HSL format (white for all variants)

**Example:**
```typescript
import { getAvatarColor } from '@/lib/utils/avatar';

const colors = getAvatarColor("John Doe");
// Returns: { bg: 'hsl(270, 75%, 60%)', text: 'hsl(0, 0%, 100%)' }

const colors2 = getAvatarColor("Alice Smith");
// Returns: { bg: 'hsl(242, 84%, 58%)', text: 'hsl(0, 0%, 100%)' }

// Same name always returns same color
const colors3 = getAvatarColor("John Doe");
// Returns: { bg: 'hsl(270, 75%, 60%)', text: 'hsl(0, 0%, 100%)' }
```

##### `getInitials(name: string)`
Extracts initials from a name.

```typescript
export function getInitials(name: string): string
```

**Behavior:**
- Single name: Returns first letter (e.g., "Alice" → "A")
- Multiple words: Returns first letters of first and last word (e.g., "John Doe" → "JD")
- Empty: Returns "?"

**Examples:**
```typescript
import { getInitials } from '@/lib/utils/avatar';

getInitials("John Doe");    // "JD"
getInitials("Alice");       // "A"
getInitials("Mary Jane Watson"); // "MW"
getInitials("");            // "?"
getInitials("  ");          // "?"
```

#### Color Palette
The component uses 8 purple/blue/indigo variants:
1. Purple: `hsl(270, 75%, 60%)`
2. Deep Purple: `hsl(263, 70%, 50%)`
3. Violet: `hsl(281, 89%, 54%)`
4. Indigo: `hsl(242, 84%, 58%)`
5. Blue: `hsl(217, 91%, 60%)`
6. Cyan: `hsl(198, 88%, 48%)`
7. Purple-Blue: `hsl(280, 59%, 56%)`
8. Iris: `hsl(259, 80%, 52%)`

All colors use white text (`hsl(0, 0%, 100%)`) for optimal contrast.

---

### 3. User Profile Menu

A dropdown menu component for user profile management.

#### Location
`/Users/vyshanvi/nexus/components/layout/user-profile-menu.tsx`

#### Features
- User avatar + name trigger button
- Displays user info header (name, email, role badge)
- Menu items for navigation (Profile, Settings, Team)
- Sign out functionality
- Admin-only team management menu item
- Smooth animations and transitions
- Keyboard accessible
- Purple theme matching app design

#### Props
```typescript
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
}
```

#### Examples

```typescript
'use client';

import { UserProfileMenu } from '@/components/layout/user-profile-menu';

// Basic usage
<UserProfileMenu
  name="John Doe"
  email="john@example.com"
  role="member"
/>

// Admin user with avatar
<UserProfileMenu
  name="Alice Admin"
  email="alice@company.com"
  role="admin"
  avatarSrc="/avatars/alice.jpg"
/>

// With custom styling
<UserProfileMenu
  name="Carol White"
  email="carol@company.com"
  role="member"
  className="ml-auto"
/>
```

#### Menu Structure
```
┌─────────────────────────┐
│ John Doe                │
│ john@example.com        │
│ [Member Badge]          │
├─────────────────────────┤
│ 👤 Profile              │
│ ⚙️  Settings             │
│ 👥 Team                 │
├─────────────────────────┤
│ 🚪 Sign Out             │
└─────────────────────────┘
```

#### Features
- **User Info Header**: Shows name, email, and role badge
- **Profile Link**: Routes to `/profile`
- **Settings Link**: Routes to `/settings`
- **Team Link**: Admin-only, routes to `/team`
- **Sign Out**: Calls NextAuth signOut, redirects to `/login`
- **Admin Badge**: Purple "Admin" badge for admin users, gray "Member" for others
- **Smooth Animations**: Fade-in, zoom animations on open/close

#### Integration with Session

The component can be integrated with NextAuth session:

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { UserProfileMenu } from '@/components/layout/user-profile-menu';

export function Header() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <header className="flex items-center justify-between">
      <h1>Dashboard</h1>
      <UserProfileMenu
        name={session.user.name}
        email={session.user.email}
        role={session.user.role}
        avatarSrc={session.user.image}
      />
    </header>
  );
}
```

---

## Installation & Dependencies

### Installed Packages
- `@radix-ui/react-avatar@^1.0.0` - Radix UI Avatar primitive
- Existing: `@radix-ui/react-dropdown-menu` - For dropdown menus
- Existing: `lucide-react` - For icons (Crown, LogOut, Settings, Users, etc.)

### How to Install (if needed)
```bash
npm install @radix-ui/react-avatar
```

---

## Usage in Layout

Recommended placement in header/navigation:

```typescript
'use client';

import { UserProfileMenu } from '@/components/layout/user-profile-menu';
import { useSession } from 'next-auth/react';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between bg-white border-b px-6 py-4">
      <div className="text-lg font-semibold">Nexus</div>

      {session?.user && (
        <UserProfileMenu
          name={session.user.name}
          email={session.user.email}
          role={session.user.role as 'admin' | 'member'}
        />
      )}
    </nav>
  );
}
```

---

## Styling & Theme

All components use Tailwind CSS and respect the app's purple theme:

- **Primary Color**: `hsl(270, 75%, 60%)` (purple)
- **Secondary Color**: `hsl(270, 30%, 97%)` (light purple)
- **Text**: `hsl(270, 15%, 10%)` (dark purple-gray)
- **Muted**: `hsl(270, 20%, 95%)` (light gray)

Components automatically adapt to light/dark mode through CSS variables in `app/globals.css`.

---

## Accessibility

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **ARIA Labels**: Proper labels for screen readers
- **Color Contrast**: White text on colored backgrounds meets WCAG AA standards
- **Focus Indicators**: Visible focus rings on interactive elements
- **Icon Labels**: Icon menus have accompanying text labels

---

## File Locations Summary

```
/Users/vyshanvi/nexus/
├── components/
│   ├── ui/
│   │   └── avatar.tsx                 # Avatar component
│   └── layout/
│       └── user-profile-menu.tsx      # User profile dropdown menu
└── lib/
    └── utils/
        └── avatar.ts                  # Color generator & initials utility
```

---

## Testing Checklist

- [x] Avatar displays initials correctly for single and multiple names
- [x] Avatar color generation is consistent (same name = same color)
- [x] Admin crown badge displays correctly
- [x] Online status indicator works
- [x] Avatar sizes render correctly (xs to xl)
- [x] User profile menu opens/closes smoothly
- [x] All menu items route correctly
- [x] Sign out functionality works
- [x] Build completes without errors
- [x] TypeScript types are correct
- [x] Components are keyboard accessible

---

## Notes

- Avatar component is fully "use client" for interactivity
- Color generation uses name hashing for deterministic results
- Same name always produces the same color across the app
- Profile menu integrates with NextAuth for auth state
- All styles use Tailwind CSS for consistency
- Icons from lucide-react library
- Menu uses Radix UI primitives for accessibility
