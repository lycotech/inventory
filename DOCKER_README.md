# Quick Docker Deployment

## Ultra-Fast Deployment (3 commands)

### Prerequisites
- Install Docker Desktop: https://www.docker.com/products/docker-desktop/

### Windows Quick Start
```powershell
# 1. Run the deployment script
.\docker-deploy.ps1

# 2. Select option 1 (Fresh Install)
# 3. Wait 5-10 minutes for build

# Access: http://localhost:3000
# Login: admin / admin@123
```

### Linux/Mac Quick Start
```bash
# 1. Make script executable
chmod +x docker-deploy.sh

# 2. Run the deployment script
./docker-deploy.sh

# 3. Select option 1 (Fresh Install)
# 4. Wait 5-10 minutes for build

# Access: http://localhost:3000
# Login: admin / admin@123
```

---

## Manual Deployment

### Step 1: Create Configuration
```bash
cat > .env.docker << 'EOF'
MYSQL_ROOT_PASSWORD=SecureRootPassword123!
MYSQL_DATABASE=westgatedb
MYSQL_USER=westuser
MYSQL_PASSWORD=SecureUserPassword123!
APP_PORT=3000
AUTH_SESSION_SECRET=your-secure-random-secret-min-32-chars
COOKIE_SECURE=false
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=admin@123
SEED_ADMIN_EMAIL=admin@example.com
EOF
```

### Step 2: Build and Start
```bash
# Build images
docker compose build

# Start services
docker compose --env-file .env.docker up -d

# Check status
docker compose ps
```

### Step 3: Access Application
- URL: http://localhost:3000
- Username: admin
- Password: admin@123

---

## Network Access

### From Other Computers

**Find your server IP:**
- Windows: `ipconfig` (look for IPv4)
- Linux/Mac: `hostname -I`

**Access URL:**
- `http://[YOUR-IP]:3000`
- Example: `http://192.168.1.100:3000`

---

## Common Commands

```bash
# Start services
docker compose --env-file .env.docker up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Check status
docker compose ps

# Restart
docker compose restart

# Update application
git pull
docker compose build
docker compose up -d

# Backup database
docker compose exec db mysqldump -u root -p westgatedb > backup.sql

# Access database
docker compose exec db mysql -u westuser -p westgatedb
```

---

## Troubleshooting

### Port 3000 already in use
```bash
# Change port in .env.docker
APP_PORT=3001

# Restart
docker compose down
docker compose --env-file .env.docker up -d
```

### Cannot connect to database
```bash
# Check database is running
docker compose ps db

# View database logs
docker compose logs db

# Restart database
docker compose restart db
```

### Application errors
```bash
# View application logs
docker compose logs app

# Restart application
docker compose restart app

# Rebuild if needed
docker compose build --no-cache
docker compose up -d
```

---

## File Structure

- `Dockerfile` - Application container configuration
- `docker-compose.yml` - Multi-container orchestration
- `.env.docker` - Environment variables (create this)
- `docker-deploy.ps1` - Windows quick start script
- `docker-deploy.sh` - Linux/Mac quick start script
- `DOCKER_DEPLOYMENT_GUIDE.md` - Complete documentation

---

## Security Notes

⚠️ **IMPORTANT:** Before production use:

1. Change all default passwords in `.env.docker`
2. Generate secure `AUTH_SESSION_SECRET` (min 32 characters)
3. Update admin password after first login
4. Set `COOKIE_SECURE=true` if using HTTPS
5. Configure firewall to restrict access

---

## Support

📖 **Full Documentation:** See `DOCKER_DEPLOYMENT_GUIDE.md`

🐛 **Issues:** https://github.com/lycotech/inventory/issues

---

**Last Updated:** November 14, 2025
