# Contributing to Nexus

Thank you for your interest in contributing to Nexus! This guide will help you get started.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards others

## Getting Started

### Prerequisites
- Node.js 18+
- Git
- Basic knowledge of React, Next.js, and TypeScript
- (Optional) PostgreSQL knowledge for database work

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/nexus.git
   cd nexus
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Database**
   ```bash
   cp .env.example .env
   # Add your DATABASE_URL
   npm run db:migrate
   npm run db:seed
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

## Project Architecture

### Directory Structure
```
app/              - Next.js app router pages
components/       - React components
  ui/            - Base UI components (shadcn)
  {feature}/     - Feature-specific components
lib/             - Utilities and helpers
  auth/          - Authentication logic
  ai/            - AI integration
  storage/       - File storage
server/          - Server-side code
  actions/       - Server actions (mutations)
  queries/       - Database queries (future)
prisma/          - Database schema and migrations
```

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL via Prisma
- **Auth**: NextAuth.js v5
- **UI**: Tailwind CSS + shadcn/ui
- **AI**: Anthropic Claude API

## Development Workflow

### 1. Pick an Issue
- Check open issues on GitHub
- Comment to claim an issue
- Ask questions if unclear

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code improvements
- `test/` - Adding tests

### 3. Make Changes

Follow these guidelines:
- Write TypeScript (no `any` types)
- Use Server Components by default
- Add "use client" only when needed
- Follow existing code style
- Keep functions small and focused
- Add comments for complex logic

### 4. Test Your Changes

Before committing:
- [ ] Code compiles without errors
- [ ] No TypeScript errors (`npm run build`)
- [ ] Test manually in browser
- [ ] Check mobile responsiveness
- [ ] No console errors or warnings

### 5. Commit Changes

Use conventional commits:
```bash
git commit -m "feat: add task filtering to Kanban board"
git commit -m "fix: resolve drag-drop issue on mobile"
git commit -m "docs: update README with new features"
```

Commit types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting, no code change
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance

### 6. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub:
- Describe what changed and why
- Link related issues
- Add screenshots for UI changes
- Mark as draft if work in progress

## Code Style

### TypeScript
```typescript
// ✅ Good
interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string) => void;
}

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  // Implementation
}

// ❌ Bad
export function TaskCard(props: any) {
  // Implementation
}
```

### Server Actions
```typescript
// ✅ Good - Proper error handling
"use server";

export async function updateTask(taskId: string, data: UpdateTaskData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  try {
    return await db.task.update({
      where: { id: taskId },
      data,
    });
  } catch (error) {
    console.error("Update failed:", error);
    throw new Error("Failed to update task");
  }
}

// ❌ Bad - No error handling
"use server";

export async function updateTask(taskId: string, data: any) {
  return await db.task.update({
    where: { id: taskId },
    data,
  });
}
```

### Components
```typescript
// ✅ Good - Server Component by default
export async function ProjectList() {
  const projects = await getProjects();
  return <div>{/* ... */}</div>;
}

// ✅ Good - Client Component when needed
"use client";

export function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// ❌ Bad - Unnecessary client component
"use client";

export function StaticText() {
  return <p>Hello World</p>;
}
```

### Database Queries
```typescript
// ✅ Good - Type-safe with includes
const project = await db.project.findUnique({
  where: { id: projectId },
  include: {
    members: {
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    }
  }
});

// ❌ Bad - Missing type safety
const project = await db.project.findUnique({
  where: { id: projectId }
});
const members = await db.projectMember.findMany({
  where: { projectId }
});
```

## Adding New Features

### 1. Database Changes

If adding fields to existing model:
```bash
# Edit prisma/schema.prisma
# Then create migration
npx prisma migrate dev --name add_field_name
```

If adding new model:
```prisma
// Add to prisma/schema.prisma
model NewModel {
  id        String   @id @default(uuid())
  // ... fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. Server Actions

Create in `server/actions/{feature}.ts`:
```typescript
"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";

export async function yourAction(data: YourData) {
  // 1. Authenticate
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // 2. Authorize
  // Check if user has permission

  // 3. Validate
  // Validate input data

  // 4. Execute
  return await db.yourModel.create({ data });
}
```

### 3. UI Components

Create in `components/{feature}/`:
```typescript
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface YourComponentProps {
  // Props
}

export function YourComponent({ }: YourComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
    </Card>
  );
}
```

### 4. Pages

Create in `app/(dashboard)/{route}/page.tsx`:
```typescript
import { auth } from "@/lib/auth/config";
import { yourAction } from "@/server/actions/your-feature";

export default async function YourPage() {
  const session = await auth();
  const data = await yourAction();

  return <div>{/* ... */}</div>;
}
```

## Testing

### Manual Testing
1. Test happy path
2. Test error cases
3. Test edge cases
4. Test on different browsers
5. Test on mobile

### Future: Automated Tests
*Not yet implemented*

```typescript
// Example for future
describe('TaskCard', () => {
  it('should display task title', () => {
    // Test implementation
  });
});
```

## Documentation

When adding features:
- Update README.md if public-facing
- Add JSDoc comments for complex functions
- Update IMPLEMENTATION_STATUS.md
- Add to TESTING_CHECKLIST.md

Example JSDoc:
```typescript
/**
 * Generates a sprint backlog from natural language description
 * @param inputText - Feature description in plain English
 * @returns Array of stories with tasks and story points
 * @throws Error if AI API fails or output is invalid
 */
export async function generateSprintTasks(inputText: string) {
  // Implementation
}
```

## Common Tasks

### Adding a UI Component (shadcn)
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
# etc.
```

### Viewing Database
```bash
npm run db:studio
```

### Resetting Database
```bash
npx prisma migrate reset
npm run db:seed
```

### Checking Types
```bash
npm run build
```

## Pull Request Checklist

Before submitting:
- [ ] Code follows project style
- [ ] TypeScript compiles without errors
- [ ] Tested manually in browser
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Database migrations included (if applicable)
- [ ] Documentation updated (if applicable)
- [ ] Commit messages follow convention
- [ ] PR description is clear

## Review Process

1. **Automated Checks**: Vercel preview, TypeScript compilation
2. **Code Review**: Maintainer reviews code
3. **Feedback**: Address review comments
4. **Approval**: PR approved by maintainer
5. **Merge**: Squash and merge to main

## Questions?

- Open a discussion on GitHub
- Check existing documentation
- Review similar features in codebase

## Areas Needing Contribution

### High Priority
- [ ] Complete task creation/editing UI
- [ ] Sprint management UI
- [ ] AI sprint planning form
- [ ] Comments interface
- [ ] File upload UI

### Medium Priority
- [ ] Admin management panels
- [ ] User settings page
- [ ] Task filtering/search
- [ ] Sprint analytics
- [ ] Mobile optimization

### Low Priority
- [ ] Automated tests
- [ ] Storybook
- [ ] Dark mode
- [ ] Keyboard shortcuts
- [ ] Export functionality

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Your contributions help make Nexus better for everyone. We appreciate your time and effort! 🙏
