# Avatar Components - Quick Reference

## 🎯 TL;DR

Three components were created for user avatars and profile management:

### 1. Avatar Component
```typescript
import { Avatar } from '@/components/ui/avatar';

<Avatar name="John Doe" size="md" />
<Avatar name="Alice" size="lg" isAdmin={true} showStatus={true} />
```

### 2. Color & Initials Utility
```typescript
import { getAvatarColor, getInitials } from '@/lib/utils/avatar';

getInitials("John Doe")     // "JD"
getAvatarColor("John Doe")  // { bg: 'hsl(...)', text: 'hsl(...)' }
```

### 3. User Profile Menu
```typescript
import { UserProfileMenu } from '@/components/layout/user-profile-menu';

<UserProfileMenu
  name="John Doe"
  email="john@example.com"
  role="admin"
/>
```

---

## 📁 File Locations

| File | Purpose |
|------|---------|
| `/components/ui/avatar.tsx` | Avatar component (176 lines) |
| `/components/layout/user-profile-menu.tsx` | Profile dropdown menu (154 lines) |
| `/lib/utils/avatar.ts` | Color generator & initials (71 lines) |

---

## 🎨 Avatar Sizes

| Size | Width | Use Case |
|------|-------|----------|
| `xs` | 24px | Compact spaces (comments, mentions) |
| `sm` | 32px | Lists, sidebar |
| `md` | 40px | **Default**, most UI elements |
| `lg` | 56px | Profile headers, larger displays |
| `xl` | 80px | Profile pages, hero sections |

---

## 🏷️ Avatar Props

```typescript
<Avatar
  name="John Doe"           // Required: User name
  size="md"                 // Optional: Size variant
  src="/avatar.jpg"         // Optional: Image URL
  isAdmin={false}           // Optional: Show crown badge
  showStatus={false}        // Optional: Show green dot
  className="..."           // Optional: Custom CSS
/>
```

---

## 👤 Profile Menu Props

```typescript
<UserProfileMenu
  name="John Doe"              // Optional: User name
  email="john@example.com"     // Optional: Email address
  role="admin"                 // Optional: 'admin' | 'member'
  avatarSrc="/avatar.jpg"      // Optional: Image URL
  className="ml-auto"          // Optional: Custom CSS
/>
```

---

## 🎨 Color Palette

8 purple/blue/indigo colors. Same name always gets same color:

```
Purple → Deep Purple → Violet → Indigo → Blue → Cyan → Purple-Blue → Iris
  1          2          3         4       5      6         7          8
```

All use white text for contrast.

---

## 🔌 Integration Examples

### In a Header
```typescript
'use client';
import { UserProfileMenu } from '@/components/layout/user-profile-menu';
import { useSession } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();
  return (
    <header>
      <h1>Dashboard</h1>
      <UserProfileMenu
        name={session?.user?.name}
        email={session?.user?.email}
        role={session?.user?.role}
      />
    </header>
  );
}
```

### In a Team List
```typescript
<div className="space-y-2">
  {members.map(member => (
    <div key={member.id} className="flex items-center gap-3">
      <Avatar
        name={member.name}
        src={member.avatar}
        isAdmin={member.role === 'admin'}
      />
      <span>{member.name}</span>
    </div>
  ))}
</div>
```

### For Comments
```typescript
<div className="flex gap-2">
  <Avatar name={comment.author.name} size="sm" />
  <div className="flex-1">
    <p className="font-medium">{comment.author.name}</p>
    <p>{comment.text}</p>
  </div>
</div>
```

---

## 📋 Features Checklist

### Avatar Component
- [x] Initials fallback ("John Doe" → "JD")
- [x] Consistent color generation
- [x] 5 size variants
- [x] Admin crown badge
- [x] Online status indicator
- [x] Image support
- [x] Fallback to initials
- [x] Fully accessible

### User Profile Menu
- [x] Avatar trigger button
- [x] User info header
- [x] Profile link
- [x] Settings link
- [x] Team link (admin only)
- [x] Sign out button
- [x] NextAuth integration
- [x] Keyboard navigation
- [x] Smooth animations
- [x] Role-based visibility

### Utility Functions
- [x] Name-based color generation
- [x] Consistent hashing
- [x] Initials extraction
- [x] Edge case handling

---

## ⚙️ Installation

Already done! But if needed:
```bash
npm install @radix-ui/react-avatar
```

---

## 🧪 Testing

Component is tested and ready to use:
- ✅ TypeScript compilation: No errors
- ✅ Production build: Successful
- ✅ All sizes work correctly
- ✅ Colors consistent across sessions

---

## 🎓 Initials Logic

| Input | Output |
|-------|--------|
| "John Doe" | "JD" |
| "Alice" | "A" |
| "Mary Jane Watson" | "MW" |
| "Bob" | "B" |
| "" | "?" |
| null | "?" |

---

## 🌈 Role Badges

- **Admin**: Purple badge with "Admin" text
- **Member**: Gray badge with "Member" text

---

## 📱 Responsive

- Trigger button shows avatar + chevron on all devices
- Name/role hidden on mobile (shows only on md: and up)
- Menu adapts to screen size automatically

---

## ♿ Accessibility

- Keyboard: Tab, Enter, Escape keys work
- Screen readers: Proper ARIA labels
- Color: Not only indicator (text + icons)
- Focus: Visible focus rings on all elements

---

## 🚀 Performance

- Avatar color: Generated on-the-fly, minimal impact
- Profile menu: Uses Radix Portal (renders only when open)
- Images: Browser caching works automatically
- Bundle size: ~5KB minified

---

## 🎯 Common Use Cases

### Use Case 1: Header/Navbar
```typescript
<UserProfileMenu name={user.name} email={user.email} role={user.role} />
```

### Use Case 2: Team Display
```typescript
<Avatar name={member.name} isAdmin={member.isAdmin} />
```

### Use Case 3: Comment Attribution
```typescript
<Avatar name={author.name} size="sm" />
```

### Use Case 4: Profile Page
```typescript
<Avatar name={user.name} src={user.avatar} size="xl" />
```

---

## 📚 Full Documentation

For complete API documentation and examples:
- **Main docs**: `AVATAR_COMPONENTS.md`
- **Integration guide**: `AVATAR_INTEGRATION_EXAMPLES.md`
- **Summary**: `COMPONENTS_SUMMARY.md`

---

## ⚠️ Edge Cases Handled

- Empty or null names → Shows "?"
- Very long names → Still works, initials are first+last
- Missing avatar image → Falls back to initials
- Missing email → Shows placeholder
- Different roles → Shows correct badge

---

## 🎨 Styling with Tailwind

All components use Tailwind CSS:
- Purple theme: `hsl(270, 75%, 60%)`
- Responsive: Built-in md: breakpoints
- Dark mode: Auto-adapts via CSS variables

---

## 🔗 Related Components

These components work well with:
- `Button` - For action buttons
- `Badge` - For role badges
- `DropdownMenu` - Already used by profile menu
- `Card` - For profile sections

---

## 📞 Quick Support

**Avatar not showing?**
- Check `name` prop is provided
- Verify no TypeScript errors

**Menu not opening?**
- Ensure component is wrapped in `'use client'`
- Check parent layout allows positioning

**Colors all the same?**
- Colors based on name hash - different names get different colors
- Same name always gets same color (intentional)

**Want to customize?**
- Avatar colors: Edit `AVATAR_COLORS` in `lib/utils/avatar.ts`
- Menu items: Edit component JSX
- Sizes: Edit `sizeMap` object in avatar component

---

**Last Updated:** February 12, 2026
**Status:** Production Ready
