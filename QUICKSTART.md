# Nexus Quickstart Guide

Get Nexus up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

### Minimal Setup (AI features disabled)

For a quick test without AI features, you only need:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/nexus"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY=""  # Leave empty to skip AI features
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### Full Setup (With AI)

1. **Get a Neon Database** (Free)
   - Sign up at https://neon.tech
   - Create a new project
   - Copy the connection string to `DATABASE_URL`

2. **Get Anthropic API Key**
   - Sign up at https://console.anthropic.com
   - Create an API key
   - Add to `ANTHROPIC_API_KEY`

3. **(Optional) Cloudflare R2** for file uploads
   - Create R2 bucket at https://dash.cloudflare.com
   - Generate API keys
   - Add R2 credentials

## Step 3: Initialize Database

```bash
# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed demo data (optional but recommended)
npm run db:seed
```

The seed script creates:
- Admin user: `admin@nexus.com` / `admin123`
- Demo user: `user@nexus.com` / `user123`
- Sample vertical, project, and sprint with tasks

## Step 4: Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Step 5: Login

Use the seeded credentials:
- **Admin**: admin@nexus.com / admin123
- **User**: user@nexus.com / user123

Or create a new account and manually promote to admin:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Quick Tour

### As Admin

1. **Dashboard** - View all your projects
2. **Verticals** - Create organizational units
3. **Projects** - Create projects and assign members
4. **Sprints** - Create and activate sprints
5. **AI Sprint Planning** - Describe features in natural language
6. **Kanban Board** - Drag and drop tasks

### As Member

1. **Dashboard** - See assigned projects
2. **Project View** - Access active sprint Kanban board
3. **Task Management** - Create, update, move tasks
4. **Collaboration** - Add comments and attachments

## Database Management

```bash
# Open Prisma Studio (visual database editor)
npm run db:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Troubleshooting

### "Database connection failed"
- Check DATABASE_URL is correct
- Ensure database is accessible
- For Neon, make sure `?sslmode=require` is in the URL

### "NextAuth configuration error"
- Verify NEXTAUTH_SECRET is set
- Make sure NEXTAUTH_URL matches your dev URL

### "AI features not working"
- Check ANTHROPIC_API_KEY is valid
- Ensure you have API credits
- AI features gracefully degrade if key is missing

### Port 3000 already in use
```bash
# Run on different port
PORT=3001 npm run dev
```

## What's Next?

1. **Customize** - Modify the schema in `prisma/schema.prisma`
2. **Extend** - Add new features in `app/` and `components/`
3. **Deploy** - Push to Vercel for production

Check the main [README.md](./README.md) for detailed documentation.

## Need Help?

- Check the implementation plan in your `.claude/` directory
- Review the PRD in `prd.md`
- Open an issue on GitHub

Happy project managing! 🚀
