# Nexus Design System

## Direction
**Personality:** Precision & Density
**Foundation:** Cool (Slate/Purple)
**Depth:** Shadows with borders
**Use Case:** Project management dashboard, admin tools, data-heavy interfaces

## Core Identity

### Brand Colors
- **Primary:** Purple (`hsl(var(--primary))` - Used for CTAs, active states, accents)
- **Background:** White (`hsl(var(--background))`)
- **Foreground:** Dark slate (`hsl(var(--foreground))`)
- **Muted:** Light gray (`hsl(var(--muted))`)
- **Border:** Subtle gray (`hsl(var(--border))`)

### Color Tokens
```css
--background: 0 0% 100%
--foreground: 222.2 84% 4.9%
--primary: 262.1 83.3% 57.8%  /* Purple */
--primary-foreground: 210 40% 98%
--secondary: 210 40% 96.1%
--muted: 210 40% 96.1%
--muted-foreground: 215.4 16.3% 46.9%
--accent: 210 40% 96.1%
--destructive: 0 84.2% 60.2%
--border: 214.3 31.8% 91.4%
--ring: 262.1 83.3% 57.8%
```

## Spacing System

### Base Unit
**Base:** 4px
**Grid:** 4px increments

### Scale
- **xs:** 4px (0.25rem) - Tight spacing, icon gaps
- **sm:** 8px (0.5rem) - Compact spacing, small gaps
- **md:** 12px (0.75rem) - Standard spacing
- **base:** 16px (1rem) - Default spacing
- **lg:** 24px (1.5rem) - Section spacing
- **xl:** 32px (2rem) - Large section spacing
- **2xl:** 48px (3rem) - Page-level spacing

### Usage
- Card padding: 24px (1.5rem)
- Button padding: 12px 16px
- Form field spacing: 16px between fields
- Section spacing: 24px between sections
- Page margins: 24px

## Typography

### Font Stack
**Primary:** System font stack (Inter-like)
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
```

### Scale
- **Page Title:** text-3xl (30px) font-bold
- **Section Title:** text-2xl (24px) font-semibold
- **Card Title:** text-lg (18px) font-semibold
- **Body:** text-base (16px)
- **Small:** text-sm (14px)
- **Tiny:** text-xs (12px)

### Line Heights
- **Tight:** 1.25 (Headings)
- **Normal:** 1.5 (Body text)
- **Relaxed:** 1.625 (Reading text)

## Component Patterns

### Button Primary
- **Height:** 36px (h-9)
- **Padding:** 12px 16px (px-4 py-2)
- **Border Radius:** 6px (rounded-md)
- **Background:** Primary purple
- **Text:** text-sm font-medium
- **Hover:** Slightly darker purple
- **Usage:** Primary actions (Save, Create, Submit)

### Button Secondary
- **Height:** 36px
- **Padding:** 12px 16px
- **Border Radius:** 6px
- **Border:** 1px solid border color
- **Background:** Transparent
- **Text:** text-sm font-medium
- **Hover:** Secondary background
- **Usage:** Secondary actions (Cancel, Back)

### Button Small
- **Height:** 32px (h-8)
- **Padding:** 8px 12px (px-3 py-1.5)
- **Usage:** Compact spaces, inline actions

### Card Default
- **Border:** 1px solid border color
- **Border Radius:** 8px (rounded-lg)
- **Padding:** 24px (p-6)
- **Background:** White
- **Shadow:** None (relies on border)
- **Hover:** Subtle shadow (hover:shadow-lg for clickable cards)
- **Usage:** Content containers, list items

### Card Clickable
- **Base:** Same as Card Default
- **Cursor:** pointer
- **Hover:** shadow-lg, scale-[1.02]
- **Transition:** transition-all duration-200
- **Usage:** Navigable cards (vertical cards, project cards)

### Input Field
- **Height:** 36px (h-9)
- **Padding:** 8px 12px (px-3 py-2)
- **Border:** 1px solid border color
- **Border Radius:** 6px (rounded-md)
- **Focus:** ring-2 ring-primary ring-offset-2
- **Text:** text-sm

### Modal/Dialog
- **Max Width:** 500px (max-w-lg)
- **Padding:** 24px (p-6)
- **Border Radius:** 8px (rounded-lg)
- **Backdrop:** Semi-transparent dark overlay
- **Animation:** Fade in/out with scale

### Table/Grid
- **Row Height:** 48px minimum
- **Cell Padding:** 12px 16px
- **Border:** 1px solid border color (bottom only)
- **Hover:** Background: muted
- **Header:** font-medium text-sm uppercase tracking-wide

### Badge
- **Height:** 20px
- **Padding:** 4px 8px (px-2 py-1)
- **Border Radius:** 9999px (rounded-full)
- **Text:** text-xs font-medium
- **Variants:**
  - Default: Primary color
  - Secondary: Muted background
  - Destructive: Red background

### Tab System
- **Tab Height:** 40px (h-10)
- **Padding:** 12px 16px (px-3 py-1.5)
- **Border Radius:** 6px (rounded-sm)
- **Active:** Primary background with shadow
- **Inactive:** Transparent
- **Text:** text-sm font-medium

## Layout Patterns

### Page Structure
```
<div className="space-y-6">
  <Header />      {/* Page title, breadcrumb, actions */}
  <Stats />       {/* Optional stat cards */}
  <MainContent /> {/* Cards, tables, tabs */}
</div>
```

### Grid Layouts
- **1-2-3 Responsive:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **2-column:** `grid-cols-1 md:grid-cols-2`
- **Gap:** `gap-4` (16px) or `gap-6` (24px)

### Flex Layouts
- **Header:** `flex items-center justify-between`
- **Icon + Text:** `flex items-center gap-2`
- **Button Group:** `flex items-center gap-2`

## Interaction Patterns

### Hover States
- **Cards:** `hover:shadow-lg transition-shadow`
- **Buttons:** `hover:opacity-90`
- **Links:** `hover:text-primary transition-colors`

### Focus States
- **All Interactive Elements:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

### Loading States
- **Buttons:** Spinner icon + "Loading..." text
- **Forms:** Disable inputs with opacity-50
- **Cards:** Skeleton loaders with pulse animation

### Transitions
- **Default:** `transition-all duration-200 ease-out`
- **Slow:** `transition-all duration-300`
- **Fast:** `transition-all duration-150`

## Depth & Elevation

### Strategy
Combination of borders and subtle shadows for elevation

### Levels
1. **Base Surface** - Background color, no shadow
2. **Card** - Border only, white background
3. **Card Hover** - Border + shadow-lg
4. **Modal** - shadow-2xl with backdrop
5. **Dropdown** - shadow-lg with border

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

## Icons

### Library
Lucide React (consistent with shadcn/ui)

### Sizes
- **Small:** h-4 w-4 (16px)
- **Default:** h-5 w-5 (20px)
- **Large:** h-6 w-6 (24px)
- **Icon Button:** h-4 w-4 with mr-2 spacing

### Usage
- Always pair with text using `flex items-center gap-2`
- Use semantic icons (Calendar for dates, Users for people)
- Maintain consistent stroke width

## Terminology

### Consistent Language
- **"Tickets"** not "Tasks" (user-facing)
- **"Projects"** - Top-level work containers
- **"Sprints"** - Time-boxed work periods
- **"Verticals"** - Organizational units
- **"View Details"** - Standard navigation CTA
- **"Manage"** - Admin actions

## Responsive Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Patterns
- Mobile-first approach
- Stack columns on mobile: `grid-cols-1 md:grid-cols-2`
- Hide less critical info on mobile
- Responsive padding: `p-4 md:p-6`

## Accessibility

### ARIA
- Use semantic HTML first
- Add ARIA labels to icon-only buttons
- Maintain focus management in modals
- Keyboard navigation support

### Color Contrast
- Body text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: Clear visual feedback

### Focus
- Visible focus indicators on all interactive elements
- Logical tab order
- Skip to main content link

## Animation Principles

### Purpose
- **Feedback:** Confirm user actions (toast notifications)
- **Attention:** Draw focus to important changes
- **Continuity:** Show relationship between states

### Timing
- **Fast:** 150ms - Hover states, button clicks
- **Medium:** 200ms - Card transitions, dropdowns
- **Slow:** 300ms - Modal opens, page transitions

### Easing
- **Default:** ease-out (natural deceleration)
- **Bouncy:** spring (for playful moments)
- **Linear:** For continuous animations

## Project-Specific Components

### Vertical Cards
- **Layout:** Grid 1-2-3 responsive
- **Border:** 1px solid border
- **Padding:** 24px (p-6)
- **Hover:** shadow-lg, border-primary/50
- **Actions:** Two stacked buttons (View Details primary, Manage Users secondary)

### Kanban Board
- **Columns:** 4 (To Do, In Progress, Review, Done)
- **Column Width:** min-w-[280px]
- **Column Colors:**
  - Todo: bg-gray-100
  - Progress: bg-blue-50
  - Review: bg-yellow-50
  - Done: bg-green-50
- **Drag:** 8px activation distance
- **Hover:** Ring-2 primary with scale-[1.02]

### Task/Ticket Cards
- **Height:** Auto (min-h-[80px])
- **Padding:** 12px (p-3)
- **Border Radius:** 6px (rounded-md)
- **Shadow:** shadow-sm
- **Drag:** Cursor-move when hovering

### Stats Cards
- **Layout:** Grid 5 columns on desktop
- **Padding:** 16px (p-4)
- **Content:** Title (text-sm) + Value (text-3xl)
- **Color-coded:** By status (gray, blue, yellow, green)

## File Organization

### Component Structure
```
components/
├── ui/              # Base components (Button, Card, Input)
├── kanban/          # Kanban board components
├── admin/           # Admin-specific components
├── tasks/           # Task/ticket components
└── [feature]/       # Feature-specific components
```

### Naming Conventions
- **Components:** PascalCase (`VerticalList`, `TaskCard`)
- **Files:** kebab-case (`vertical-list.tsx`, `task-card.tsx`)
- **Props:** camelCase (`isLoading`, `onClick`)

## Decision Log

### Why Purple Theme?
- Distinctive from common blue/gray dashboards
- Conveys creativity while maintaining professionalism
- High contrast with white background for clarity

### Why Borders-Primary Depth?
- Cleaner than heavy shadows for data-dense interface
- Better for technical/precision feel
- Shadows used sparingly for emphasis (modals, hover states)

### Why 4px Grid?
- Fine-grained control for tight interfaces
- Aligns with Tailwind's spacing scale
- Prevents arbitrary spacing values

### Why 36px Button Height?
- Comfortable touch target (44px recommended, 36px acceptable for desktop-first)
- Balances density with usability
- Consistent across all button variants

---

**Last Updated:** February 13, 2026
**Version:** 1.0.0
**Status:** Active
