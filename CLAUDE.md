# Claude Instructions for Nexus

## Project Overview
Nexus is an AI-first project management portal built with Next.js 14, Prisma, and Claude AI. It features AI-powered sprint planning, bug classification, and Kanban task management.

## Core Technologies
- **Framework**: Next.js 14 (App Router), TypeScript
- **Database**: Neon Serverless Postgres via Prisma ORM
- **Auth**: NextAuth.js v5
- **AI**: Anthropic Claude Sonnet 4.5
- **Storage**: Cloudflare R2 (S3-compatible)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: Zustand (minimal, Kanban only)
- **Drag & Drop**: dnd-kit

## Architecture Principles

### Layering Rules (STRICTLY ENFORCE)
1. **`/components`** - UI only, NO business logic
2. **`/server`** - Business logic, DB queries, auth checks, AI integration
3. **`/lib`** - Utilities and helpers
4. **Prisma** - Sole database access layer

### Code Organization
```
app/
├── (auth)/          # Public authentication pages
├── (dashboard)/     # Protected dashboard pages
└── api/             # API routes (minimal, prefer server actions)

components/
├── ui/             # shadcn base components
├── kanban/         # Kanban board components
└── [feature]/      # Feature-specific components

lib/
├── auth/           # NextAuth configuration
├── ai/             # AI utilities (Claude integration)
└── storage/        # R2 storage client

server/
├── actions/        # Server actions (mutations)
└── queries/        # Database queries (future)

prisma/
└── schema.prisma   # Single source of truth for data model
```

## Data Model Structure

### Core Entities
- **Users** → **Verticals** → **Projects** → **Sprints** → **Tasks**
- Tasks have: Comments, Attachments
- Tasks support hierarchy: Stories contain child tasks via `parent_task_id`

### Key Enums (ALWAYS USE THESE)
- `user.role`: admin | member
- `sprint.status`: planned | active | completed
- `task.status`: todo | progress | review | done
- `task.priority`: low | medium | high | critical
- `task.type`: story | task | bug

### Business Rules
1. **One active sprint per project** (enforced at DB transaction level)
2. **Admin-only operations**: Create projects, sprints; activate sprints; AI generation
3. **Member operations**: View assigned projects, create/update tasks, move tasks, comment
4. **AI features**:
   - Sprint planning: Generates structured backlog from natural language
   - Bug classification: Auto-assigns priority when task.type=bug

## Development Conventions

### When Editing Code
1. **Read before writing** - Always read existing files before modifying
2. **Type safety** - Maintain strict TypeScript; use Prisma types
3. **Avoid over-engineering** - Don't add features/abstractions beyond requirements
4. **Security first** - Validate inputs, check auth/authz, never expose API keys client-side
5. **Optimistic UI** - Kanban updates must be optimistic with error handling

### Server Actions Pattern
```typescript
// server/actions/[feature].ts
'use server'

export async function actionName(data: Schema) {
  // 1. Auth check
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  // 2. Authorization check (role + membership)
  await verifyProjectMembership(session.user.id, projectId)

  // 3. Validation
  const validated = schema.parse(data)

  // 4. Business logic + DB operations
  const result = await prisma.model.create({ ... })

  // 5. Revalidate cache
  revalidatePath('/path')

  return result
}
```

### AI Integration Pattern
```typescript
// lib/ai/[feature].ts
import Anthropic from '@anthropic-ai/sdk'

// Server-side only!
export async function aiFunction(input: string) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!
  })

  // Low temperature for structured output
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    temperature: 0.3,
    messages: [{
      role: 'user',
      content: `${SYSTEM_PROMPT}\n\n${input}`
    }]
  })

  // Strict JSON validation
  const parsed = schema.parse(JSON.parse(response.content))
  return parsed
}
```

### Component Pattern
```typescript
// components/[feature]/[component].tsx
'use client' // Only if needed for interactivity

interface Props {
  // Explicit props
}

export function Component({ prop }: Props) {
  // Use server actions for mutations
  const handleAction = async () => {
    await serverAction(data)
  }

  return <div>...</div>
}
```

## Environment Variables

### Required
- `DATABASE_URL` - Neon Postgres connection string
- `NEXTAUTH_SECRET` - Generated via `openssl rand -base64 32`
- `NEXTAUTH_URL` - Application URL (http://localhost:3000 for dev)
- `ANTHROPIC_API_KEY` - Claude API key

### Optional (for file uploads)
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

## Common Tasks

### Database Changes
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name descriptive_name
# 3. Generate client
npx prisma generate
```

### Adding AI Features
1. Create function in `lib/ai/`
2. Define strict Zod schema for output
3. Use low temperature (0.3)
4. Add retry logic for invalid JSON
5. Never expose API keys client-side
6. Validate and sanitize all AI outputs

### Adding Server Actions
1. Create in `server/actions/[feature].ts`
2. Mark with `'use server'`
3. Check auth + authz first
4. Use Prisma for DB ops
5. Revalidate relevant paths
6. Handle errors gracefully

### Security Checklist
- [ ] Auth check (authenticated user)
- [ ] Role check (admin/member)
- [ ] Membership check (vertical/project)
- [ ] Input validation (Zod schema)
- [ ] SQL injection prevention (use Prisma)
- [ ] XSS prevention (React handles this)
- [ ] Signed URLs for file uploads

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import repo in Vercel
3. Add environment variables
4. Deploy (migrations run automatically)

### Database Migrations
Production migrations run automatically via `postinstall` script in package.json:
```json
"postinstall": "prisma generate && prisma migrate deploy"
```

## AI Feature Details

### Sprint Planning
- **Input**: Natural language feature description
- **Output**: Structured JSON with stories and tasks
- **Schema**: `{ stories: [{ title, story_points, tasks: [...] }] }`
- **Validation**: Required fields, numeric story points, non-empty tasks
- **Error Handling**: Retry with stricter prompt, max 2 retries

### Bug Classification
- **Trigger**: When `task.type = bug` on creation
- **Output**: ENUM priority (low/medium/high/critical)
- **Rules**: crash/payment/auth → high/critical; UI/spacing → low
- **Fallback**: Keep default (medium) on failure

## Testing

### Manual Testing Flow
1. Register/login
2. Create vertical (admin)
3. Create project in vertical (admin)
4. Add members to project (admin)
5. Create sprint (admin)
6. Activate sprint (admin)
7. Create tasks or use AI generation
8. Move tasks on Kanban (member)
9. Add comments/attachments

### Key Edge Cases to Test
- One active sprint enforcement
- Concurrent task moves
- AI JSON validation failures
- Unauthorized access attempts
- File upload failures

## Performance Targets
- **Kanban latency**: < 300ms (optimistic UI required)
- **AI generation**: < 5s (with loading states)
- **Page loads**: < 1s (server-rendered)
- **Database queries**: < 50ms (use indexes)

## Non-Goals (DO NOT ADD)
- Analytics dashboards (not in MVP)
- External integrations (Slack/Jira/GitHub)
- Complex role hierarchies beyond admin/member
- Multi-workspace tenancy beyond verticals
- Advanced workflow automation

## When in Doubt
1. Check `prd.md` for product requirements
2. Follow existing patterns in codebase
3. Prioritize simplicity over flexibility
4. Ask user before adding new features
5. Security and type safety are non-negotiable

## Git Workflow
- Use clear, descriptive commit messages
- Format: `[type]: description` (e.g., `feat: add sprint creation`, `fix: kanban drag bug`)
- Co-author commits with: `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`
- Never force push to main
- Always run tests before committing (when tests exist)
