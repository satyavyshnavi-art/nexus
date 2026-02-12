# Deployment Guide

This guide covers deploying Nexus to production using Vercel and Neon.

## Prerequisites

- GitHub account
- Vercel account (free tier)
- Neon account (free tier)
- Anthropic API key (optional, for AI features)
- Cloudflare account (optional, for file uploads)

## Option 1: Vercel (Recommended)

### Step 1: Prepare Your Database

1. **Create Neon Project**
   - Go to https://neon.tech
   - Create a new project
   - Note the connection string

2. **Run Migrations**
   ```bash
   # Set DATABASE_URL in .env
   DATABASE_URL="your-neon-connection-string"

   # Run migrations
   npx prisma migrate deploy
   ```

### Step 2: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add files
git add .
git commit -m "Initial commit"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/nexus.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

1. **Import Project**
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repository

2. **Configure Environment Variables**

   Add these in Vercel dashboard:

   ```
   DATABASE_URL=your-neon-connection-string
   NEXTAUTH_SECRET=generate-new-secret-for-production
   NEXTAUTH_URL=https://your-app.vercel.app
   ANTHROPIC_API_KEY=your-api-key
   ```

   Optional (for file uploads):
   ```
   R2_ACCOUNT_ID=your-account-id
   R2_ACCESS_KEY_ID=your-access-key
   R2_SECRET_ACCESS_KEY=your-secret-key
   R2_BUCKET_NAME=your-bucket-name
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your deployed app!

### Step 4: Seed Production Data

```bash
# Set production DATABASE_URL
DATABASE_URL="your-production-url" npm run db:seed
```

Or manually create an admin user via Prisma Studio:
```bash
DATABASE_URL="your-production-url" npm run db:studio
```

## Option 2: Docker Deployment

### Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - migrate

  migrate:
    build: .
    command: npx prisma migrate deploy
    environment:
      - DATABASE_URL=${DATABASE_URL}
```

### Deploy

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

## Option 3: Manual VPS Deployment

### Prerequisites
- Ubuntu 22.04+ server
- Node.js 18+
- Nginx
- SSL certificate (Let's Encrypt)

### Steps

1. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install nginx
   sudo apt install nginx -y

   # Install PM2
   sudo npm install -g pm2
   ```

2. **Clone and Build**
   ```bash
   cd /var/www
   git clone https://github.com/yourusername/nexus.git
   cd nexus
   npm install
   npm run build
   ```

3. **Configure Environment**
   ```bash
   nano .env.production
   # Add your production env vars
   ```

4. **Run with PM2**
   ```bash
   pm2 start npm --name "nexus" -- start
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Enable SSL**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d yourdomain.com
   ```

## Post-Deployment Checklist

### Security
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] Database credentials are secure
- [ ] API keys are not exposed in client-side code
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled (consider Vercel's built-in)

### Performance
- [ ] Database indexes are created (Prisma handles this)
- [ ] Images are optimized
- [ ] Bundle size is acceptable (`npm run build` shows size)
- [ ] Caching headers are set

### Monitoring
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure logging
- [ ] Set up analytics (optional)

### Database
- [ ] Migrations are applied
- [ ] Backups are configured (Neon handles this)
- [ ] Connection pooling is enabled
- [ ] Admin user is created

### Testing
- [ ] Test user registration
- [ ] Test login flow
- [ ] Test project creation (admin)
- [ ] Test sprint activation (admin)
- [ ] Test Kanban board drag & drop
- [ ] Test on mobile devices
- [ ] Test AI features (if enabled)

## Environment Variables Reference

### Required
```env
DATABASE_URL=              # Neon Postgres connection string
NEXTAUTH_SECRET=           # Random 32+ character string
NEXTAUTH_URL=              # Your production URL
```

### Optional
```env
ANTHROPIC_API_KEY=         # For AI features
R2_ACCOUNT_ID=             # For file uploads
R2_ACCESS_KEY_ID=          # For file uploads
R2_SECRET_ACCESS_KEY=      # For file uploads
R2_BUCKET_NAME=            # For file uploads
```

## Troubleshooting

### Build Fails on Vercel
- Check environment variables are set
- Verify DATABASE_URL is accessible from Vercel
- Check build logs for specific errors

### Database Connection Errors
- Verify DATABASE_URL includes `?sslmode=require` for Neon
- Check database is accessible from your deployment platform
- Verify connection string credentials

### NextAuth Errors
- Ensure NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your production URL
- Check database has User table (run migrations)

### AI Features Not Working
- Verify ANTHROPIC_API_KEY is set
- Check you have API credits
- Look for error logs in deployment platform

## Scaling Considerations

### Database
- Neon Free Tier: 3GB storage, shared compute
- For production load, consider paid tier with dedicated compute
- Monitor connection count (max 100 on free tier)

### File Storage
- R2 Free Tier: 10GB storage, 1M Class A requests/month
- Configure CDN for public files
- Set up bucket policies for security

### Application
- Vercel automatically scales
- For VPS, use PM2 cluster mode:
  ```bash
  pm2 start npm --name "nexus" -i max -- start
  ```

## Backup Strategy

### Database Backups (Neon)
- Neon automatically backs up every hour
- Point-in-time recovery available
- Manual backups via `pg_dump`:
  ```bash
  pg_dump $DATABASE_URL > backup.sql
  ```

### File Backups (R2)
- Configure versioning in R2 bucket
- Set up periodic exports to another bucket
- Use Cloudflare's backup features

## Monitoring

### Recommended Tools
- **Vercel Analytics** - Built-in performance monitoring
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **UptimeRobot** - Uptime monitoring

### Key Metrics to Track
- Response time
- Error rate
- Database query performance
- AI API usage and cost
- Storage usage

## Cost Optimization

### Free Tier Limits
- Vercel: 100GB bandwidth/month
- Neon: 3GB storage, shared compute
- R2: 10GB storage, 1M requests/month
- Anthropic: Pay-per-use (~$3/1M input tokens)

### Tips
- Monitor AI API usage
- Implement caching where possible
- Optimize database queries
- Use CDN for static assets
- Consider Vercel Edge Functions for performance

---

For questions or issues, check the main README or open an issue on GitHub.
