# Nexus - AI-First Project Management Portal

An AI-powered sprint planning and project management platform built with Next.js 14, Prisma, and Claude AI.

## Features

- 🤖 **AI Sprint Planning**: Generate sprint backlogs from natural language descriptions using Claude Sonnet 4.5
- 🐛 **AI Bug Classification**: Automatic bug priority classification
- 📋 **Kanban Board**: Drag-and-drop task management with real-time updates
- 👥 **Multi-tenant**: Vertical-based organization structure
- 🔐 **Secure Authentication**: NextAuth.js with credentials provider
- 📎 **File Attachments**: Cloudflare R2 storage integration
- 🎯 **Sprint Management**: One active sprint per project enforcement
- 📊 **Story Points**: Track effort estimation

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database**: Neon Serverless Postgres
- **ORM**: Prisma
- **Auth**: NextAuth.js v5
- **File Storage**: Cloudflare R2
- **AI**: Anthropic Claude Sonnet 4.5
- **State Management**: Zustand (Kanban only)
- **Drag & Drop**: dnd-kit

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Neon database account (free tier)
- Anthropic API key
- Cloudflare R2 bucket (optional, for file uploads)

### Installation

1. **Clone and install dependencies**

```bash
cd nexus
npm install
```

2. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: Your Neon Postgres connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: http://localhost:3000 (for development)
- `ANTHROPIC_API_KEY`: Your Anthropic API key

Optional (for file uploads):
- `R2_ACCOUNT_ID`: Cloudflare account ID
- `R2_ACCESS_KEY_ID`: R2 access key
- `R2_SECRET_ACCESS_KEY`: R2 secret key
- `R2_BUCKET_NAME`: R2 bucket name

3. **Set up the database**

```bash
# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

4. **Create an admin user**

After starting the dev server, register a user, then manually update their role in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

5. **Start the development server**

```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
nexus/
├── app/                      # Next.js app directory
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Protected dashboard pages
│   └── api/                 # API routes
├── components/              # React components
│   ├── ui/                  # Base UI components
│   ├── kanban/              # Kanban board components
│   └── ...
├── lib/                     # Utilities
│   ├── auth/               # Auth configuration
│   ├── ai/                 # AI utilities (Claude)
│   └── storage/            # R2 storage client
├── server/                  # Server-side code
│   ├── actions/            # Server actions
│   └── queries/            # Database queries
├── prisma/                  # Database schema
└── types/                   # TypeScript types
```

## Usage

### Admin Workflow

1. **Create Verticals**: Organize your teams into verticals
2. **Assign Users**: Add users to verticals
3. **Create Projects**: Create projects within verticals
4. **Add Members**: Assign users to projects
5. **Create Sprints**: Set up sprint cycles
6. **AI Sprint Planning**: Use natural language to generate tasks
7. **Activate Sprint**: Start working on tasks

### Member Workflow

1. **View Projects**: See assigned projects on dashboard
2. **Manage Tasks**: Create, update, and move tasks on Kanban board
3. **Collaborate**: Add comments and attachments
4. **Track Progress**: Monitor sprint progress

## AI Features

### Sprint Planning

Describe your feature in natural language, and Claude will generate:
- User stories with story points
- Breakdown tasks for each story
- Organized backlog ready for sprint

### Bug Classification

When creating a bug task, Claude automatically:
- Analyzes the bug description
- Assigns appropriate priority (low/medium/high/critical)
- Updates the task in real-time

## Database Schema

- **Users**: Authentication and authorization
- **Verticals**: Top-level organization units
- **Projects**: Vertical-specific projects
- **Sprints**: Time-boxed iterations (one active per project)
- **Tasks**: Work items with hierarchy (stories → tasks)
- **Comments**: Task discussions
- **Attachments**: File uploads linked to tasks

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

The database migrations will run automatically during build.

### Manual Deployment

```bash
# Build for production
npm run build

# Run migrations
npx prisma migrate deploy

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | Neon Postgres connection string | Yes |
| NEXTAUTH_SECRET | Secret for NextAuth.js | Yes |
| NEXTAUTH_URL | Application URL | Yes |
| ANTHROPIC_API_KEY | Claude API key | Yes |
| R2_ACCOUNT_ID | Cloudflare account ID | No |
| R2_ACCESS_KEY_ID | R2 access key | No |
| R2_SECRET_ACCESS_KEY | R2 secret key | No |
| R2_BUCKET_NAME | R2 bucket name | No |

## Cost Breakdown

- **Hosting (Vercel)**: Free tier
- **Database (Neon)**: Free tier (3GB)
- **Storage (R2)**: Free tier (10GB)
- **AI (Anthropic)**: Pay per use (~$0.003 per 1K tokens)

**Expected monthly cost**: $0-5 for small teams

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
