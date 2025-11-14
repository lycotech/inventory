# Docker Deployment Guide - Local Server

Complete step-by-step guide to deploy the Inventory Management System using Docker on a local server.

## Prerequisites

### Required Software
1. **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
   - Download: https://docs.docker.com/get-docker/
   - Version: 20.10 or higher
   
2. **Docker Compose**
   - Included with Docker Desktop
   - Linux: Install separately - https://docs.docker.com/compose/install/

3. **Git** (to clone the repository)
   - Download: https://git-scm.com/downloads

### System Requirements
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Disk Space**: 5GB free space
- **OS**: Windows 10/11, macOS, or Linux
- **Network**: Port 3000 and 3306 available

---

## Step-by-Step Deployment

### Step 1: Install Docker

**Windows:**
```powershell
# Download Docker Desktop from https://www.docker.com/products/docker-desktop/
# Install and restart your computer
# Verify installation
docker --version
docker-compose --version
```

**Linux (Ubuntu/Debian):**
```bash
# Update package index
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Add your user to docker group
sudo usermod -aG docker $USER

# Restart or log out and back in
newgrp docker

# Verify installation
docker --version
docker compose version
```

### Step 2: Clone the Repository

```bash
# Navigate to your desired directory
cd /path/to/your/projects

# Clone the repository
git clone https://github.com/lycotech/inventory.git

# Navigate into the project
cd inventory
```

### Step 3: Configure Environment Variables

Create a `.env.docker` file for Docker-specific configuration:

```bash
# Create .env.docker file
cat > .env.docker << 'EOF'
# MySQL Database Configuration
MYSQL_ROOT_PASSWORD=SecureRootPassword123!
MYSQL_DATABASE=westgatedb
MYSQL_USER=westuser
MYSQL_PASSWORD=SecureUserPassword123!

# Application Configuration
APP_PORT=3000
AUTH_SESSION_SECRET=your-very-secure-random-secret-key-min-32-chars
COOKIE_SECURE=false

# Admin User Credentials
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=admin@123
SEED_ADMIN_EMAIL=admin@yourdomain.com

# Optional: SMTP Configuration (for email alerts)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# SMTP_FROM=noreply@yourdomain.com
EOF
```

**Important Security Notes:**
- Change `MYSQL_ROOT_PASSWORD` to a strong password
- Change `MYSQL_PASSWORD` to a strong password
- Generate a secure random string for `AUTH_SESSION_SECRET` (min 32 characters)
- Change `SEED_ADMIN_PASSWORD` to a secure password

**Generate Secure Random Secret:**
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String((1..32|%{Get-Random -Min 0 -Max 255}))
```

### Step 4: Update next.config.ts for Docker

The application needs standalone output for Docker. Verify `next.config.ts` contains:

```typescript
output: 'standalone'
```

This is already configured in your project.

### Step 5: Build Docker Images

```bash
# Build the Docker images (this may take 5-10 minutes first time)
docker compose build

# You should see output like:
# [+] Building 234.5s (25/25) FINISHED
```

**Troubleshooting Build Issues:**
- If build fails, check Docker has enough memory (increase in Docker Desktop settings)
- Clear Docker cache: `docker builder prune -a`
- Retry: `docker compose build --no-cache`

### Step 6: Start the Services

```bash
# Start all services (database + application)
docker compose --env-file .env.docker up -d

# Check service status
docker compose ps

# You should see:
# NAME              STATUS         PORTS
# inventory-mysql   Up (healthy)   0.0.0.0:3306->3306/tcp
# inventory-app     Up             0.0.0.0:3000->3000/tcp
```

**What happens during startup:**
1. MySQL database starts and initializes
2. Database health check runs (waits for MySQL to be ready)
3. Application starts
4. Prisma migrations run automatically
5. Seed script creates admin user and default data
6. Application server starts on port 3000

### Step 7: Verify Deployment

**Check Logs:**
```bash
# View application logs
docker compose logs app

# View database logs
docker compose logs db

# Follow logs in real-time
docker compose logs -f app

# Look for success messages:
# ✅ Admin user created: admin
# ✅ Aging categories already exist
# ✅ App settings already exist
# ▲ Next.js started on http://0.0.0.0:3000
```

**Access the Application:**
1. Open browser: http://localhost:3000
2. You should see the login page
3. Login with:
   - Username: `admin` (or your SEED_ADMIN_USERNAME)
   - Password: `admin@123` (or your SEED_ADMIN_PASSWORD)

### Step 8: Access from Other Computers (Network Access)

**Find your server's IP address:**

Windows:
```powershell
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

Linux/Mac:
```bash
hostname -I
# or
ip addr show
```

**Access from other computers:**
- URL: `http://[YOUR-SERVER-IP]:3000`
- Example: `http://192.168.1.100:3000`

**Configure Firewall (if needed):**

Windows:
```powershell
# Allow port 3000
New-NetFirewallRule -DisplayName "Inventory App" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

Linux (Ubuntu):
```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

---

## Daily Operations

### Start Services
```bash
docker compose --env-file .env.docker up -d
```

### Stop Services
```bash
docker compose down
```

### Restart Services
```bash
docker compose restart
```

### View Logs
```bash
# All services
docker compose logs -f

# Application only
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100 app
```

### Access Database Directly
```bash
# Connect to MySQL
docker compose exec db mysql -u westuser -p westgatedb

# Enter password when prompted (MYSQL_PASSWORD from .env.docker)
```

### Backup Database
```bash
# Create backup
docker compose exec db mysqldump -u root -p westgatedb > backup_$(date +%Y%m%d).sql

# Enter MYSQL_ROOT_PASSWORD when prompted
```

### Restore Database
```bash
# Restore from backup
docker compose exec -T db mysql -u root -p westgatedb < backup_20250114.sql
```

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose down
docker compose build
docker compose --env-file .env.docker up -d
```

---

## Monitoring and Maintenance

### Check Container Health
```bash
docker compose ps
docker stats
```

### Disk Space Management
```bash
# View disk usage
docker system df

# Clean up unused images/containers
docker system prune -a

# Remove old volumes (WARNING: This deletes data)
docker volume prune
```

### Performance Tuning

**Increase MySQL Memory (if needed):**

Edit `docker-compose.yml` and add under `db` service:
```yaml
command: --max_allowed_packet=256M --innodb_buffer_pool_size=512M
```

**Increase Application Memory:**

Edit `docker-compose.yml` and add under `app` service:
```yaml
deploy:
  resources:
    limits:
      memory: 2G
```

---

## Troubleshooting

### Problem: Application won't start

**Check logs:**
```bash
docker compose logs app
```

**Common fixes:**
```bash
# Restart services
docker compose restart

# Rebuild if code changed
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Problem: Database connection errors

**Check database is healthy:**
```bash
docker compose ps db
# Should show "Up (healthy)"
```

**Verify connection:**
```bash
docker compose exec db mysql -u westuser -p -e "SHOW DATABASES;"
```

**Check DATABASE_URL format in logs:**
```bash
docker compose logs app | grep DATABASE_URL
```

### Problem: Port already in use

**Find what's using the port:**

Windows:
```powershell
netstat -ano | findstr :3000
```

Linux/Mac:
```bash
lsof -i :3000
```

**Change the port:**
Edit `.env.docker`:
```env
APP_PORT=3001  # or any other available port
```

Then restart:
```bash
docker compose down
docker compose --env-file .env.docker up -d
```

### Problem: Slow performance

1. **Increase Docker resources** (Docker Desktop → Settings → Resources)
   - Memory: 4GB minimum, 8GB recommended
   - CPUs: 2 minimum, 4 recommended

2. **Check disk space:**
```bash
docker system df
df -h  # Linux/Mac
```

3. **Optimize MySQL:**
```bash
# Add to docker-compose.yml under db service:
command: --innodb_buffer_pool_size=512M --max_connections=200
```

---

## Security Best Practices

### 1. Change Default Passwords
- Update all passwords in `.env.docker`
- Never use default passwords in production

### 2. Restrict Network Access
- Use firewall to limit access to trusted IPs
- Consider using a reverse proxy (Nginx) with SSL

### 3. Regular Backups
```bash
# Create automated backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T db mysqldump -u root -p$MYSQL_ROOT_PASSWORD westgatedb > "$BACKUP_DIR/backup_$DATE.sql"
# Keep only last 7 days
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### 4. Update Regularly
```bash
# Pull latest code
git pull

# Rebuild with latest security updates
docker compose build --pull
docker compose up -d
```

### 5. Monitor Logs
```bash
# Check for suspicious activity
docker compose logs app | grep -i "error\|fail\|unauthorized"
```

---

## Production Deployment Checklist

- [ ] Changed all default passwords
- [ ] Generated secure `AUTH_SESSION_SECRET`
- [ ] Set up automated backups
- [ ] Configured firewall rules
- [ ] Tested database backup/restore
- [ ] Set `COOKIE_SECURE=true` if using HTTPS
- [ ] Configured SMTP for email alerts (optional)
- [ ] Set up monitoring/alerting
- [ ] Documented server access procedures
- [ ] Tested application from multiple client computers
- [ ] Created admin user with strong password

---

## Quick Reference Commands

```bash
# Start everything
docker compose --env-file .env.docker up -d

# Stop everything
docker compose down

# View logs
docker compose logs -f

# Restart application only
docker compose restart app

# Rebuild after code changes
docker compose build && docker compose up -d

# Database backup
docker compose exec db mysqldump -u root -p westgatedb > backup.sql

# Database restore
docker compose exec -T db mysql -u root -p westgatedb < backup.sql

# Access database
docker compose exec db mysql -u westuser -p westgatedb

# Check status
docker compose ps

# Clean up
docker compose down -v  # WARNING: Deletes all data
```

---

## Getting Help

- **Check logs:** `docker compose logs -f app`
- **Database logs:** `docker compose logs -f db`
- **System status:** `docker compose ps`
- **GitHub Issues:** https://github.com/lycotech/inventory/issues

---

**Deployment Date:** November 14, 2025
**Version:** 1.0.0
**Maintained by:** Lycotech
