# Avatar Components - Master Documentation Index

Welcome! This README guides you through the avatar components created for the Nexus project.

## Quick Links

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [AVATAR_QUICK_REFERENCE.md](./AVATAR_QUICK_REFERENCE.md) | Quick start & TL;DR | 5 min |
| [AVATAR_COMPONENTS.md](./AVATAR_COMPONENTS.md) | Complete API documentation | 15 min |
| [AVATAR_INTEGRATION_EXAMPLES.md](./AVATAR_INTEGRATION_EXAMPLES.md) | 7 real-world integration examples | 20 min |
| [COMPONENTS_SUMMARY.md](./COMPONENTS_SUMMARY.md) | Implementation details & specs | 10 min |
| [IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md) | Full deployment report | 15 min |

## What Was Created

### 1. Avatar Component
**File:** `/components/ui/avatar.tsx`

A versatile user avatar component with:
- 5 size variants (xs to xl)
- Initials fallback from names
- 8-color consistent palette
- Admin crown badge
- Online status indicator
- Full TypeScript support

```typescript
<Avatar
  name="John Doe"
  size="lg"
  isAdmin={true}
  showStatus={true}
/>
```

### 2. User Profile Menu
**File:** `/components/layout/user-profile-menu.tsx`

A dropdown menu for user profile management:
- Avatar + name trigger button
- User info header (name, email, role)
- Navigation links (Profile, Settings, Team)
- Sign out functionality with NextAuth
- Smooth animations & keyboard navigation

```typescript
<UserProfileMenu
  name="John Doe"
  email="john@example.com"
  role="admin"
/>
```

### 3. Avatar Utilities
**File:** `/lib/utils/avatar.ts`

Helper functions:
- `getAvatarColor(name)` - Generate consistent colors
- `getInitials(name)` - Extract initials from names

```typescript
getInitials("John Doe")        // "JD"
getAvatarColor("John Doe")     // { bg: '...', text: '...' }
```

## Getting Started

### Installation
Components are already installed. No additional setup needed!

```bash
npm install @radix-ui/react-avatar  # Already done
```

### Basic Usage

```typescript
'use client';

import { Avatar } from '@/components/ui/avatar';
import { UserProfileMenu } from '@/components/layout/user-profile-menu';

// In your header/navbar component
export function Header() {
  return (
    <header className="flex justify-between items-center">
      <h1>My App</h1>

      <UserProfileMenu
        name="John Doe"
        email="john@example.com"
        role="admin"
      />
    </header>
  );
}

// Avatar in lists
export function UsersList() {
  return (
    <div className="space-y-4">
      {users.map(user => (
        <div key={user.id} className="flex items-center gap-3">
          <Avatar
            name={user.name}
            src={user.avatar}
            isAdmin={user.role === 'admin'}
          />
          <span>{user.name}</span>
        </div>
      ))}
    </div>
  );
}
```

## Component Features

### Avatar Sizes
| Size | Width | Use Case |
|------|-------|----------|
| `xs` | 24px | Compact spaces |
| `sm` | 32px | Lists, sidebars |
| `md` | 40px | Default, most elements |
| `lg` | 56px | Profile headers |
| `xl` | 80px | Profile pages |

### Avatar Props
```typescript
<Avatar
  name="John Doe"           // Required: User name
  size="md"                 // Optional: Size variant
  src="/avatar.jpg"         // Optional: Image URL
  isAdmin={false}           // Optional: Show badge
  showStatus={false}        // Optional: Show status dot
  className=""              // Optional: Custom CSS
/>
```

### Profile Menu Props
```typescript
<UserProfileMenu
  name="John Doe"           // User name
  email="john@example.com"  // Email address
  role="admin"              // 'admin' or 'member'
  avatarSrc="/avatar.jpg"   // Avatar image URL
  className=""              // Custom CSS
/>
```

## Common Use Cases

### 1. Dashboard Header
```typescript
<header className="border-b px-6 py-4 flex justify-between">
  <h1>Dashboard</h1>
  <UserProfileMenu {...user} />
</header>
```

### 2. Team Members List
```typescript
{members.map(member => (
  <div key={member.id} className="flex items-center gap-3">
    <Avatar name={member.name} isAdmin={member.isAdmin} />
    <span>{member.name}</span>
  </div>
))}
```

### 3. Comments/Attribution
```typescript
<div className="flex gap-3">
  <Avatar name={comment.author} size="sm" />
  <div>
    <p className="font-medium">{comment.author}</p>
    <p>{comment.text}</p>
  </div>
</div>
```

### 4. Profile Page
```typescript
<div className="text-center">
  <Avatar name={user.name} src={user.avatar} size="xl" />
  <h1>{user.name}</h1>
  <p>{user.email}</p>
</div>
```

## Integration with NextAuth

The components work seamlessly with NextAuth sessions:

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { UserProfileMenu } from '@/components/layout/user-profile-menu';

export function AuthHeader() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <UserProfileMenu
      name={session.user.name}
      email={session.user.email}
      role={session.user.role as 'admin' | 'member'}
      avatarSrc={session.user.image}
    />
  );
}
```

## Styling & Theme

All components use Tailwind CSS and respect the app's purple theme:

```css
/* From app/globals.css */
--primary: 270 75% 60%;        /* Purple */
--primary-foreground: 0 0% 100%; /* White */
```

The 8-color avatar palette:
1. Purple: `hsl(270, 75%, 60%)`
2. Deep Purple: `hsl(263, 70%, 50%)`
3. Violet: `hsl(281, 89%, 54%)`
4. Indigo: `hsl(242, 84%, 58%)`
5. Blue: `hsl(217, 91%, 60%)`
6. Cyan: `hsl(198, 88%, 48%)`
7. Purple-Blue: `hsl(280, 59%, 56%)`
8. Iris: `hsl(259, 80%, 52%)`

## Accessibility

Both components are fully accessible:

- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader support (ARIA labels)
- ✅ Color contrast: 4.5:1 minimum
- ✅ Focus indicators: Visible rings
- ✅ WCAG 2.1 AA compliant

## TypeScript Support

All components are fully typed:

```typescript
import type { AvatarProps } from '@/components/ui/avatar';
import type { UserProfileMenuProps } from '@/components/layout/user-profile-menu';

// Use props in your own components
const avatar: AvatarProps = {
  name: "John",
  size: "md"
};
```

## Performance

- **Build Impact:** Negligible
- **Color Generation:** O(n) on name length
- **Menu Rendering:** Uses Radix Portal (renders only when open)
- **Image Caching:** Native browser support

## Build Status

✅ All components successfully compiled:
- TypeScript: No errors
- Production build: Successful
- Bundle impact: Minimal

## Troubleshooting

### Avatar not showing
- Ensure `name` prop is provided
- Check for TypeScript errors

### Menu not opening
- Wrap component in `'use client'` directive
- Check parent container styling

### Colors all the same
- Colors are name-based (deterministic)
- Different names get different colors

### Want different colors
- Edit `AVATAR_COLORS` in `lib/utils/avatar.ts`
- Regenerate colors with new palette

## Documentation Files

### Start Here
1. **AVATAR_QUICK_REFERENCE.md** - 5-minute overview

### Detailed Learning
2. **AVATAR_COMPONENTS.md** - Full API documentation
3. **AVATAR_INTEGRATION_EXAMPLES.md** - 7 real examples

### Reference
4. **COMPONENTS_SUMMARY.md** - Implementation details
5. **IMPLEMENTATION_REPORT.md** - Deployment information

## File Structure

```
/Users/vyshanvi/nexus/
├── components/
│   ├── ui/avatar.tsx
│   └── layout/user-profile-menu.tsx
├── lib/utils/avatar.ts
└── Documentation/
    ├── AVATAR_README.md
    ├── AVATAR_QUICK_REFERENCE.md
    ├── AVATAR_COMPONENTS.md
    ├── AVATAR_INTEGRATION_EXAMPLES.md
    ├── COMPONENTS_SUMMARY.md
    └── IMPLEMENTATION_REPORT.md
```

## Support

For questions or issues:

1. Check the appropriate documentation file above
2. Review the integration examples
3. Check the quick reference guide

## Summary

Three production-ready components are now available:

- **Avatar Component** - User avatars with initials, colors, and badges
- **User Profile Menu** - Profile dropdown with navigation
- **Avatar Utilities** - Color and initials helper functions

All components are:
- ✅ Fully typed with TypeScript
- ✅ Accessible (WCAG 2.1 AA)
- ✅ Themed with purple palette
- ✅ Integrated with NextAuth
- ✅ Production ready
- ✅ Well documented

## Next Steps

1. **Import components** in your layout/header
2. **Pass session data** from NextAuth
3. **Customize styling** as needed (optional)
4. **Deploy to production**

---

**Last Updated:** February 12, 2026
**Status:** Production Ready ✅
**Tasks Completed:** #11, #16
