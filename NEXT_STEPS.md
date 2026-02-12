# Next Steps - Getting Nexus Running

This guide walks you through getting Nexus up and running for the first time.

## Prerequisites Check

Before starting, ensure you have:
- [ ] Node.js 18 or higher installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] A code editor (VS Code recommended)
- [ ] Git installed

## Step 1: Set Up Database (Neon - Free)

### Option A: Use Neon (Recommended - No local PostgreSQL needed)

1. **Create Neon Account**
   - Go to https://neon.tech
   - Sign up (free, no credit card required)
   - Click "Create Project"

2. **Get Connection String**
   - On project dashboard, click "Connection Details"
   - Copy the connection string
   - It looks like: `postgresql://user:pass@ep-xxxxx.neon.tech/neondb?sslmode=require`

3. **Save Connection String**
   - We'll use it in the next step

### Option B: Use Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb nexus
```

Your connection string: `postgresql://localhost:5432/nexus`

## Step 2: Configure Environment

1. **Create .env file**
   ```bash
   cp .env.example .env
   ```

2. **Edit .env file**
   ```env
   # Required - Your database from Step 1
   DATABASE_URL="postgresql://your-connection-string"

   # Required - Generate a secret
   NEXTAUTH_SECRET="<run: openssl rand -base64 32>"

   # Required - Your local dev URL
   NEXTAUTH_URL="http://localhost:3000"

   # Optional - For AI features (get from https://console.anthropic.com)
   ANTHROPIC_API_KEY=""

   # Optional - For file uploads (skip for now)
   R2_ACCOUNT_ID=""
   R2_ACCESS_KEY_ID=""
   R2_SECRET_ACCESS_KEY=""
   R2_BUCKET_NAME=""
   ```

3. **Generate NEXTAUTH_SECRET**
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste into .env

## Step 3: Initialize the Application

```bash
# Install all dependencies (takes 1-2 minutes)
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations (creates tables)
npm run db:migrate

# Seed with demo data (optional but recommended)
npm run db:seed
```

If seed succeeds, you'll see:
```
✅ Database seeded successfully!

Login credentials:
Admin: admin@nexus.com / admin123
User: user@nexus.com / user123
```

## Step 4: Start Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- ready in X seconds
```

## Step 5: Test the Application

1. **Open Browser**
   - Go to http://localhost:3000
   - Should redirect to login page

2. **Login as Admin**
   - Email: `admin@nexus.com`
   - Password: `admin123`
   - Should redirect to dashboard

3. **View Dashboard**
   - See "Welcome back, Admin User"
   - See "Demo Project" card
   - Click the project card

4. **View Kanban Board**
   - See "Demo Project" title
   - See "Sprint 1" section
   - See 4 columns: To Do, In Progress, Review, Done
   - See tasks in each column

5. **Test Drag and Drop**
   - Drag a task from "To Do" to "In Progress"
   - Task should move smoothly
   - Refresh page - task stays in new position

## Troubleshooting

### "Database connection failed"
**Problem**: Can't connect to database

**Solution**:
```bash
# Check DATABASE_URL in .env
# For Neon, ensure it ends with ?sslmode=require
# Test connection
npm run db:studio
```

### "Module not found" errors
**Problem**: Dependencies not installed

**Solution**:
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Prisma Client not generated"
**Problem**: Prisma client missing

**Solution**:
```bash
npm run db:generate
```

### Port 3000 in use
**Problem**: Another app using port 3000

**Solution**:
```bash
# Use different port
PORT=3001 npm run dev
```

### Seed script fails
**Problem**: Database already has data

**Solution**:
```bash
# Reset and try again
npx prisma migrate reset
npm run db:seed
```

## What to Do Next

### If Everything Works ✅

Great! Now you can:

1. **Explore the App**
   - Login as admin and user
   - Create more projects (via Prisma Studio)
   - Test drag and drop
   - Check responsive design

2. **Enable AI Features** (Optional)
   - Get API key from https://console.anthropic.com
   - Add to ANTHROPIC_API_KEY in .env
   - Restart server
   - AI features now work!

3. **Start Development**
   - Check IMPLEMENTATION_STATUS.md for what's done
   - Pick a feature from "Not Yet Implemented"
   - Read CONTRIBUTING.md
   - Start coding!

### If You Hit Issues ❌

1. **Check Error Messages**
   - Read the error carefully
   - Check the terminal output
   - Look for file paths or line numbers

2. **Common Fixes**
   - Restart dev server (Ctrl+C, then `npm run dev`)
   - Clear .next folder (`rm -rf .next`)
   - Regenerate Prisma client (`npm run db:generate`)

3. **Still Stuck?**
   - Check TESTING_CHECKLIST.md
   - Review error in browser console
   - Search error message online

## Development Workflow

Once everything is running:

```bash
# Daily workflow
npm run dev              # Start server
npm run db:studio        # View database (optional)

# When changing database
# Edit prisma/schema.prisma, then:
npm run db:migrate

# When pulling new code
npm install              # Update dependencies
npm run db:generate      # Regenerate client
npm run db:migrate       # Apply new migrations
```

## Quick Reference

### NPM Scripts
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Run production build
npm run db:migrate   # Run migrations
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed database
npm run db:studio    # Open database GUI
```

### Default Credentials
```
Admin:
- Email: admin@nexus.com
- Password: admin123
- Role: Admin (can create verticals, projects, sprints)

User:
- Email: user@nexus.com
- Password: user123
- Role: Member (can manage tasks)
```

### URLs
```
Landing:    http://localhost:3000
Login:      http://localhost:3000/login
Register:   http://localhost:3000/register
Dashboard:  http://localhost:3000/dashboard
```

## Project Files to Know

```
.env                    # Your environment variables (don't commit!)
package.json           # Dependencies and scripts
prisma/schema.prisma   # Database schema
README.md              # Project overview
QUICKSTART.md          # 5-minute setup
IMPLEMENTATION_STATUS  # What's built
```

## Success Criteria

You've successfully set up Nexus when:
- ✅ Dev server runs without errors
- ✅ Login page loads
- ✅ Can login with demo credentials
- ✅ Dashboard shows demo project
- ✅ Kanban board displays
- ✅ Drag and drop works
- ✅ No console errors

## Ready to Deploy?

See DEPLOYMENT.md for production deployment to Vercel.

## Need Help?

1. Check error message carefully
2. Review this guide
3. Check TROUBLESHOOTING section in README
4. Review TESTING_CHECKLIST.md
5. Open an issue on GitHub

---

**Estimated Setup Time**: 10-15 minutes
**Difficulty**: Beginner-friendly

Happy coding! 🚀
