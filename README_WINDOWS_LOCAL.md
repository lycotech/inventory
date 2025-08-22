# Local Development Setup - Windows 10

This guide walks you through setting up the Inventory Management System locally on Windows 10.

## 🔧 Prerequisites

### Required Software
1. **Node.js 18+ and npm**
   - Download from [nodejs.org](https://nodejs.org/)
   - Choose LTS version (recommended)
   - Verify installation: Open PowerShell and run:
     ```powershell
     node --version
     npm --version
     ```

2. **MySQL Database**
   - **Option A**: Install MySQL Community Server from [mysql.com](https://dev.mysql.com/downloads/mysql/)
   - **Option B**: Use XAMPP (includes MySQL + phpMyAdmin): [apachefriends.org](https://www.apachefriends.org/)
   - **Option C**: Use Docker Desktop with MySQL container (see Docker section below)

3. **Git** (if not already installed)
   - Download from [git-scm.com](https://git-scm.com/)

## 🚀 Quick Setup (Recommended)

### Step 1: Clone Repository
```powershell
# Open PowerShell as Administrator (recommended)
cd C:\
git clone https://github.com/lycotech/inventory.git
cd inventory
```

### Step 2: Install Dependencies
```powershell
npm install
```

### Step 3: Environment Configuration
1. Copy the example environment file:
   ```powershell
   copy .env.local.example .env
   ```

2. Edit `.env` file with your local settings:
   ```env
   # Database Connection
   DATABASE_URL="mysql://root:yourpassword@localhost:3306/inventory_db"
   
   # Session Secret (generate a random string)
   SESSION_SECRET="your-super-secret-random-string-here"
   
   # Email Configuration (optional for development)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   SMTP_FROM="your-email@gmail.com"
   ```

### Step 4: Database Setup

#### Option A: MySQL Server Setup
1. **Start MySQL Service:**
   - Open Services (`services.msc`) and ensure MySQL service is running
   - Or use MySQL Workbench to connect

2. **Create Database:**
   ```sql
   CREATE DATABASE inventory_db;
   ```

#### Option B: XAMPP Setup
1. Start XAMPP Control Panel
2. Start Apache and MySQL services
3. Open phpMyAdmin (http://localhost/phpmyadmin)
4. Create new database: `inventory_db`

### Step 5: Database Migration & Seeding
```powershell
# Run database migrations
npx prisma migrate deploy

# Optional: Seed with sample data
npm run db:seed
```

### Step 6: Start Development Server
```powershell
npm run dev
```

🎉 **Application will be available at:** http://localhost:3000

## 🏭 **Warehouse Management System**

The application now includes a **Central Warehouse Management System**:
- **Central Warehouse Policy**: All stock must be received into a designated central warehouse first
- **Warehouse Transfers**: Move stock between warehouses with full audit trail  
- **Multi-Location Support**: Manage inventory across multiple warehouse locations
- **Import Templates**: Bulk warehouse transfer operations via CSV/Excel

See `README_WAREHOUSE_MANAGEMENT.md` for detailed warehouse management documentation.

## 🐳 Docker Alternative (Advanced)

If you prefer using Docker on Windows 10:

### Prerequisites
- Docker Desktop for Windows
- WSL 2 (recommended)

### Setup
```powershell
# Start with Docker Compose
docker-compose up -d --build

# Initialize database (first time only)
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run db:seed
```

Access at: http://localhost:3000

## 🔧 Troubleshooting

### Common Issues

#### 1. Node.js Version Issues
```powershell
# Check Node.js version
node --version

# If version is less than 18, update Node.js
# Download latest LTS from nodejs.org
```

#### 2. MySQL Connection Issues
```powershell
# Test MySQL connection
mysql -u root -p -h localhost

# If connection fails, check:
# - MySQL service is running (services.msc)
# - Port 3306 is not blocked by firewall
# - Credentials in .env are correct
```

#### 3. Prisma Issues
```powershell
# Reset Prisma client
npx prisma generate

# Reset database (⚠️ DESTROYS DATA)
npx prisma migrate reset
```

#### 4. Turbopack Font Loading Error
If you encounter `Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'`:
```powershell
# This error occurs with Next.js Turbopack and Google Fonts
# Solution: The project has been updated to use CSS font imports instead
# If you still see this error, ensure your app/layout.tsx doesn't use:
# import { Inter } from "next/font/google";

# The fix uses CSS imports in globals.css instead:
# @import url('https://fonts.googleapis.com/css2?family=Inter...');
```

#### 5. Port Already in Use
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use different port
$env:PORT=3001; npm run dev
```

### Windows-Specific Issues

#### PowerShell Execution Policy
If you get execution policy errors:
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Windows Firewall
If other devices can't access your dev server:
1. Open Windows Defender Firewall
2. Allow Node.js through firewall
3. Or run dev server with host binding:
   ```powershell
   npm run dev -- --hostname 0.0.0.0
   ```

## 📁 Project Structure

```
inventory/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utility libraries
├── prisma/               # Database schema & migrations
├── public/               # Static assets
└── scripts/              # Utility scripts
```

## 🎯 Default Login

After seeding the database, you can login with:
- **Username:** admin
- **Password:** admin

⚠️ **Change the default password immediately in production!**

## 🔧 Development Commands

```powershell
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Seed database
npm run db:seed

# Generate Prisma client
npx prisma generate

# View database in Prisma Studio
npx prisma studio
```

## 🏗️ Production Build

To test production build locally:
```powershell
# Build the application
npm run build

# Start production server
npm start
```

## 📧 Email Configuration (Optional)

For email notifications (alerts, reports):

### Gmail Setup
1. Enable 2FA on your Gmail account
2. Generate App Password: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Update `.env`:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-16-digit-app-password"
   SMTP_FROM="your-email@gmail.com"
   ```

## 🛠️ VS Code Setup (Recommended)

Install these extensions for better development experience:
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prisma
- TypeScript Importer
- Thunder Client (API testing)

## 📱 Accessing from Mobile/Other Devices

To access your dev server from mobile devices on the same network:

1. Find your Windows machine's IP address:
   ```powershell
   ipconfig
   ```

2. Start dev server with host binding:
   ```powershell
   npm run dev -- --hostname 0.0.0.0
   ```

3. Access from mobile: `http://YOUR_IP_ADDRESS:3000`

## 🔒 Security Notes

- Default setup is for development only
- Change default passwords before any production use
- Use environment variables for sensitive data
- Consider using HTTPS in production
- Regularly update dependencies: `npm audit fix`

## 🆘 Getting Help

If you encounter issues:

1. Check the terminal output for error messages
2. Verify all prerequisites are installed correctly
3. Ensure database is running and accessible
4. Check firewall/antivirus isn't blocking Node.js
5. Try running as Administrator if permission issues occur

## 🔄 Updates

To update the application:
```powershell
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Run migrations (if any)
npx prisma migrate deploy

# Restart development server
npm run dev
```

---

**Happy coding! 🚀**

For deployment to production environments, see `README_DEPLOY.md` for Docker and server deployment options.
