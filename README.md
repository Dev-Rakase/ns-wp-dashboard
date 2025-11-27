# NS AI Search Admin Panel

Central management panel for the NS AI Search WordPress plugin infrastructure.

## Features

- **Website Management**: Add, edit, and monitor WordPress installations
- **Credits Control**: Manage credit allocations and track usage
- **Real-time Sync**: Sync credits with Cloudflare Durable Objects
- **Activity Logs**: Track all administrative actions
- **Usage Analytics**: Monitor API usage across all sites

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: Better-Auth
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL="mysql://username:password@localhost:3306/ns_aisearch_admin"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
CLOUDFLARE_WORKER_URL="https://your-worker.workers.dev"
CLOUDFLARE_ADMIN_TOKEN="your-admin-token"
```

### 3. Setup Database

Run the SQL schema or use Prisma migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Or run migrations (production)
npx prisma migrate deploy
```

### 4. Create Admin User

Run the SQL from `admin-database-schema.sql` or create manually:

```sql
INSERT INTO admin_users (username, email, password_hash, role) 
VALUES ('admin', 'admin@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYk3H.sBg.e', 'ADMIN');
```

Default password: `admin123` (change immediately!)

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and login with your credentials.

## Deployment

### Vercel (Recommended for Testing)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Self-Hosted (Production)

1. Build the application:

```bash
npm run build
```

2. Start production server:

```bash
npm start
```

3. Configure reverse proxy (Nginx/Apache)
4. Setup SSL certificate

## Usage

### Adding a Website

1. Navigate to **Websites** → **Add Website**
2. Enter domain (e.g., `example.com`)
3. Enter website title
4. Select plan (Free/Basic/Pro/Enterprise)
5. Set initial credits
6. Click **Create Website**

The admin panel will automatically sync credits with Cloudflare Durable Objects.

### Managing Credits

1. Go to **Websites** → Select a website
2. Click **Add** or **Deduct** buttons
3. Enter amount and reason
4. Credits are automatically synced with Cloudflare

### Monitoring Usage

- View dashboard for overview statistics
- Check individual website pages for detailed usage logs
- Review admin logs for all actions taken

## API Integration

The admin panel communicates with Cloudflare Workers via REST API:

- `POST /admin/set-credits`: Sync credits to Durable Object
- `GET /admin/usage-logs`: Fetch usage logs from DO
- `GET /admin/admin-logs`: Fetch admin action logs from DO

All requests include the `X-Admin-Token` header for authentication.

## Security

- Password hashing with bcrypt
- Session-based authentication
- CSRF protection
- SQL injection prevention (Prisma)
- Environment variable secrets

## Troubleshooting

### Cannot connect to database

- Check `DATABASE_URL` in `.env`
- Ensure MySQL server is running
- Verify database exists

### Cloudflare sync fails

- Check `CLOUDFLARE_WORKER_URL` is correct
- Verify `CLOUDFLARE_ADMIN_TOKEN` matches worker configuration
- Check worker deployment status

### Login fails

- Verify admin user exists in database
- Check password hash is correct
- Clear browser cookies and try again

## Support

For issues and questions, contact support@netscriper.com
