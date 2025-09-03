# Inventory Management System

A comprehensive inventory management system built with Next.js, Prisma, and MySQL. This application provides real-time stock tracking, automated alerts, warehouse management, and detailed reporting capabilities.

## Features

- **Stock Management**: Track inventory levels across multiple warehouses
- **Real-time Alerts**: Automated notifications for low stock and expiring items
- **Bulk Operations**: CSV import/export for inventory data, stock updates, and transfers
- **User Management**: Role-based access control (Admin, Manager, User)
- **Reporting**: Generate detailed inventory and transaction reports
- **Stock Aging**: Monitor product aging with customizable categories
- **Responsive UI**: Modern, dark-mode enabled interface

## Tech Stack

- **Frontend**: Next.js 15.4.6 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js for authentication
- **Database**: MySQL with Prisma ORM
- **File Processing**: XLSX parsing for bulk imports
- **Email**: SMTP integration for automated alerts

## Getting Started

### Prerequisites
- Node.js 18+ 
- MySQL 8.x
- npm or yarn

### Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd inventory
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env
# Edit .env with your database and SMTP settings
```

4. Set up the database:
```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed  # Optional: Add sample data
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Live Server Deployment

### For Production Updates

When deploying updates to the live server, follow these steps:

#### 1. Prepare the Update
```bash
# Ensure all changes are committed
git add .
git commit -m "Your update description"
git push origin main
```

#### 2. Deploy to Live Server

**Option A: Docker Deployment (Recommended)**
```bash
# On the live server
git pull origin main
docker-compose down
docker-compose up -d --build

# Run any pending migrations
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma generate
```

**Option B: Direct Node.js Deployment**
```bash
# On the live server
git pull origin main
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart inventory-app  # or your process manager
```

#### 3. Database Migrations
Always run database migrations when updating:
```bash
npx prisma migrate deploy
```

#### 4. Health Check
- Verify the application is running: `http://your-server:3000`
- Check logs for any errors
- Test critical functionality (login, inventory operations)

### Environment Variables for Production

Ensure these are set on your live server:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/inventory_db"

# Authentication
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"

# Email (Optional - for alerts)
SMTP_HOST="your-smtp-server"
SMTP_PORT=587
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-password"
SMTP_FROM="Inventory System <noreply@yourdomain.com>"

# Security (for HTTP-only intranet)
COOKIE_SECURE=false  # Only for HTTP deployments
```

### Backup Before Updates

Before deploying updates to production:

1. **Database Backup**:
```bash
mysqldump -u username -p inventory_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

2. **Application Backup** (via the app's built-in feature):
   - Login as admin → Dashboard → Backup → Export Data

### Rollback Plan

If issues occur after deployment:

1. **Quick Rollback**:
```bash
git checkout previous-working-commit
npm run build
pm2 restart inventory-app
```

2. **Database Rollback** (if needed):
```bash
mysql -u username -p inventory_db < backup_file.sql
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with sample data

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Main application pages
│   └── globals.css        # Global styles
├── components/            # Reusable React components
├── lib/                   # Utility libraries (auth, prisma, etc.)
├── prisma/                # Database schema and migrations
├── public/                # Static assets
└── scripts/               # Database and utility scripts
```

## Documentation

- [Deployment Guide](./README_DEPLOY.md) - Detailed deployment instructions
- [Data Migration](./README_LIVE_DATA_MIGRATION.md) - Database migration procedures
- [Warehouse Management](./README_WAREHOUSE_MANAGEMENT.md) - Warehouse setup guide

## Support

For issues or questions:
1. Check the application logs
2. Verify database connectivity
3. Ensure all environment variables are set correctly
4. Review the deployment documentation
