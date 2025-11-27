# Admin Panel Environment Setup

## Required Environment Variables

Create a `.env.local` file in the admin-panel directory with the following variables:

### Database Connection

```bash
# Main admin database URL (MySQL/PostgreSQL)
DATABASE_URL="mysql://username:password@host:3306/database_name"
```

**Example MySQL:**

```
DATABASE_URL="mysql://admin:password@localhost:3306/ns_aisearch_admin"
```

**Example PostgreSQL:**

```
DATABASE_URL="postgresql://admin:password@localhost:5432/ns_aisearch_admin"
```

### Better Auth Configuration

```bash
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
BETTER_AUTH_SECRET="your-secret-key-here-min-32-chars"

# Your app URL (development)
BETTER_AUTH_URL="http://localhost:3000"

# Production:
# BETTER_AUTH_URL="https://admin.yoursite.com"
```

### Cloudflare Worker Integration

```bash
# Your Cloudflare Worker URL
CLOUDFLARE_WORKER_URL="https://your-worker.workers.dev"

# Admin token (must match worker's ADMIN_TOKEN)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CLOUDFLARE_ADMIN_TOKEN="your-admin-token-here"
```

### Next.js Configuration

```bash
NODE_ENV="development"
NEXT_PUBLIC_APP_NAME="NS AI Search Admin"
```

## Setup Steps

### 1. Install Dependencies

```bash
cd admin-panel
npm install
```

### 2. Create Environment File

```bash
cp ENVIRONMENT_SETUP.md .env.local
# Edit .env.local with your actual values
```

### 3. Setup Database

**Create database:**

```sql
CREATE DATABASE ns_aisearch_admin;
```

**Run schema:**

```bash
mysql -u username -p ns_aisearch_admin < ../admin-database-schema.sql
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. (Optional) Push Schema to Database

If you prefer using Prisma migrations:

```bash
npx prisma db push
```

### 6. Create First Admin User

**Option A: Direct SQL**

```sql
USE ns_aisearch_admin;

INSERT INTO admin_users (username, email, password, created_at, updated_at)
VALUES (
  'admin',
  'admin@yoursite.com',
  '$2a$10$YourHashedPasswordHere',
  NOW(),
  NOW()
);
```

**Generate password hash with bcrypt:**

```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

**Option B: Using Prisma Studio**

```bash
npx prisma studio
```

Then add user manually in the UI.

### 7. Run Development Server

```bash
npm run dev
```

Access at: http://localhost:3000

## Production Deployment

### Vercel (Recommended for Testing)

1. **Connect Repository:**

   ```bash
   vercel
   ```

2. **Set Environment Variables:**
   Go to Project Settings → Environment Variables

   Add all variables from `.env.local`

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### Self-Hosted (Docker)

1. **Build:**

   ```bash
   npm run build
   ```

2. **Create Dockerfile:**

   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npx prisma generate
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

3. **Run:**
   ```bash
   docker build -t ns-aisearch-admin .
   docker run -p 3000:3000 --env-file .env.production ns-aisearch-admin
   ```

### Self-Hosted (PM2)

1. **Install PM2:**

   ```bash
   npm install -g pm2
   ```

2. **Build:**

   ```bash
   npm run build
   ```

3. **Start:**
   ```bash
   pm2 start npm --name "ns-aisearch-admin" -- start
   pm2 save
   pm2 startup
   ```

## Environment Variable Reference

| Variable                 | Required | Description                               | Example                          |
| ------------------------ | -------- | ----------------------------------------- | -------------------------------- |
| `DATABASE_URL`           | ✅       | MySQL/PostgreSQL connection string        | `mysql://user:pass@host:3306/db` |
| `BETTER_AUTH_SECRET`     | ✅       | Secret for session encryption (32+ chars) | Generated via crypto             |
| `BETTER_AUTH_URL`        | ✅       | Full URL of admin panel                   | `http://localhost:3000`          |
| `CLOUDFLARE_WORKER_URL`  | ✅       | Your Cloudflare Worker URL                | `https://worker.workers.dev`     |
| `CLOUDFLARE_ADMIN_TOKEN` | ✅       | Admin token (must match worker)           | Generated via crypto             |
| `NODE_ENV`               | ✅       | Environment mode                          | `development` or `production`    |
| `NEXT_PUBLIC_APP_NAME`   | ❌       | Application name                          | `NS AI Search Admin`             |

## Troubleshooting

### Database Connection Error

**Issue:** Can't connect to database

**Solutions:**

1. Verify `DATABASE_URL` is correct
2. Check database server is running
3. Verify user has permissions
4. Test connection:
   ```bash
   npx prisma db pull
   ```

### Prisma Client Not Found

**Issue:** `@prisma/client` module not found

**Solution:**

```bash
npx prisma generate
```

### Auth Not Working

**Issue:** Can't login or session expired

**Solutions:**

1. Verify `BETTER_AUTH_SECRET` is set
2. Check `BETTER_AUTH_URL` matches current URL
3. Clear cookies and try again
4. Check logs for auth errors

### Cloudflare API Errors

**Issue:** Can't sync credits or fetch data

**Solutions:**

1. Verify `CLOUDFLARE_WORKER_URL` is correct
2. Check `CLOUDFLARE_ADMIN_TOKEN` matches worker
3. Test worker endpoint:
   ```bash
   curl https://your-worker.workers.dev/health
   ```
4. Check Cloudflare Worker logs

### Build Errors

**Issue:** Next.js build fails

**Solutions:**

1. Clear cache:
   ```bash
   rm -rf .next node_modules
   npm install
   ```
2. Check all dependencies installed:
   ```bash
   npm install
   ```
3. Verify environment variables are set

## Security Best Practices

1. **Never commit `.env.local` or `.env.production`**

   - Already in `.gitignore`

2. **Use strong secrets**

   - Generate with crypto (32+ chars)
   - Different for each environment

3. **Restrict database access**

   - Use specific user for app
   - Grant only needed permissions

4. **Use HTTPS in production**

   - Update `BETTER_AUTH_URL` to `https://`
   - Setup SSL certificate

5. **Regular backups**
   - Backup database daily
   - Test restore process

## Support

For additional help:

- Review main `DEPLOYMENT.md`
- Check logs: `npm run dev` shows errors
- Database issues: Use Prisma Studio
- Contact: support@netscriper.com
