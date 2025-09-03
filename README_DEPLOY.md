# Live Server Deployment & Update Guide

This comprehensive guide covers deploying and updating the Inventory Management System on a live server.

## Quick Update Process

### For Regular Updates (Code Changes)

```bash
# 1. On live server - Pull latest changes
git pull origin main

# 2. Install/update dependencies
npm ci

# 3. Run database migrations (if any)
npx prisma migrate deploy
npx prisma generate

# 4. Rebuild application
npm run build

# 5. Restart the application
pm2 restart inventory-app
# OR for Docker:
# docker-compose down && docker-compose up -d --build
```

### Pre-Update Checklist

- [ ] Backup database: `mysqldump -u user -p inventory_db > backup_$(date +%Y%m%d_%H%M%S).sql`
- [ ] Backup application data via admin panel: Dashboard → Backup → Export Data
- [ ] Notify users of potential downtime
- [ ] Verify disk space and system resources
- [ ] Check that all environment variables are set correctly

## Deployment Methods

## 1) Docker Deployment (Recommended for Production)

Prerequisites:
- Docker Engine and Docker Compose on the host
- Git installed for pulling updates

### Initial Setup:
```bash
# Clone repository
git clone <your-repo-url>
cd inventory

# Configure environment
cp .env.local.example .env
# Edit .env with your production values

# Start services
docker-compose up -d --build

# Initialize database
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run db:seed  # Optional
```

### For Updates:
```bash
# Pull latest code
git pull origin main

# Rebuild and restart containers
docker-compose down
docker-compose up -d --build

# Apply any new migrations
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma generate
```

### Useful Docker Commands:
```bash
# View logs
docker-compose logs app
docker-compose logs -f app  # Follow logs

# Execute commands in container
docker-compose exec app bash
docker-compose exec app npx prisma studio

# Backup database from Docker MySQL
docker-compose exec db mysqldump -u root -p inventory > backup.sql
```

## 2) Direct Node.js Deployment

Prerequisites:
- Node.js 18+ 
- MySQL 8.x
- PM2 (recommended process manager)
- Git for updates

### Initial Setup:
```bash
# Clone and setup
git clone <your-repo-url>
cd inventory
npm ci

# Setup environment
cp .env.local.example .env
# Edit .env with production values

# Database setup
npx prisma migrate deploy
npx prisma generate
npm run db:seed  # Optional

# Build application
npm run build

# Install PM2 globally (if not installed)
npm install -g pm2

# Start application with PM2
pm2 start npm --name "inventory-app" -- run start
pm2 save  # Save PM2 process list
pm2 startup  # Enable PM2 startup script
```

### For Updates:
```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm ci

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Rebuild application
npm run build

# Restart with PM2
pm2 restart inventory-app
```

### PM2 Management Commands:
```bash
# Check status
pm2 status
pm2 logs inventory-app
pm2 monit

# Restart/Stop/Start
pm2 restart inventory-app
pm2 stop inventory-app  
pm2 start inventory-app

# Delete process
pm2 delete inventory-app
```

## Production Environment Variables

Create a `.env` file with the following variables:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/inventory_db"

# NextAuth Configuration
NEXTAUTH_URL="https://yourdomain.com"  # Your production URL
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"

# Email Configuration (Optional - for alerts)
SMTP_HOST="smtp.yourdomain.com"
SMTP_PORT=587
SMTP_SECURE=false  # true for 465, false for other ports
SMTP_USER="alerts@yourdomain.com"
SMTP_PASS="your-email-password"
SMTP_FROM="Inventory System <alerts@yourdomain.com>"

# Security Settings
COOKIE_SECURE=false  # Set to true for HTTPS, false for HTTP-only intranet

# Optional: Custom settings
NODE_ENV=production
PORT=3000
```

## Health Monitoring

### Application Health Check
```bash
# Check if app is running
curl http://localhost:3000/api/health

# Monitor with PM2
pm2 monit

# Check logs
tail -f /var/log/inventory/app.log  # if using custom logging
```

### Database Health Check
```bash
# Connect to MySQL
mysql -u username -p inventory_db

# Check database status
SHOW TABLES;
SELECT COUNT(*) FROM Inventory;
```

## Backup Strategies

### 1. Database Backup
```bash
# Create backup
mysqldump -u username -p inventory_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backup (add to crontab)
0 2 * * * mysqldump -u username -p'password' inventory_db > /backups/inventory_$(date +\%Y\%m\%d).sql
```

### 2. Application Data Backup
- Use the built-in backup feature: Dashboard → Backup → Export Data
- This creates a JSON export of all data

### 3. Full System Backup
```bash
# Backup entire application directory
tar -czf inventory_backup_$(date +%Y%m%d).tar.gz /path/to/inventory/
```

## Rollback Procedures

### Code Rollback
```bash
# Find previous working commit
git log --oneline -10

# Rollback to specific commit
git checkout <commit-hash>

# Rebuild and restart
npm run build
pm2 restart inventory-app
```

### Database Rollback
```bash
# Restore from backup
mysql -u username -p inventory_db < backup_file.sql

# If using migrations, rollback specific migration
npx prisma migrate reset  # WARNING: This will reset entire database
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized after login**
   - Check `NEXTAUTH_URL` matches your domain
   - Verify `NEXTAUTH_SECRET` is set and >= 32 characters
   - For HTTP intranet: set `COOKIE_SECURE=false`

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Check MySQL service is running: `systemctl status mysql`
   - Test connection: `mysql -u username -p -h localhost`

3. **Build Failures**
   - Clear cache: `rm -rf .next node_modules package-lock.json`
   - Reinstall: `npm ci`
   - Check Node.js version compatibility

4. **Permission Issues**
   - Check file ownership: `chown -R app:app /path/to/inventory/`
   - Verify PM2 user permissions

### Log Locations
- PM2 logs: `~/.pm2/logs/`
- Application logs: Check PM2 output or custom log files
- MySQL logs: `/var/log/mysql/error.log`

## Performance Optimization

### For High Traffic
```bash
# Increase PM2 instances (cluster mode)
pm2 delete inventory-app
pm2 start npm --name "inventory-app" -i max -- run start

# Monitor resource usage
pm2 monit
```

### Database Optimization
- Regular maintenance: `OPTIMIZE TABLE Inventory;`
- Monitor slow queries
- Consider indexing frequently queried columns

## Reverse Proxy & SSL Setup

### Nginx Configuration (Recommended)

Create `/etc/nginx/sites-available/inventory`:

```nginx
server {
    listen 80;
    server_name inventory.yourdomain.com;
    
    # Redirect HTTP to HTTPS (if using SSL)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name inventory.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Proxy configuration
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Handle larger file uploads for imports
    client_max_body_size 10M;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/inventory /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### Apache Configuration

Create `/etc/apache2/sites-available/inventory.conf`:

```apache
<VirtualHost *:443>
    ServerName inventory.yourdomain.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/your/cert.crt
    SSLCertificateKeyFile /path/to/your/private.key
    
    # Proxy settings
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
    
    # Security headers
    Header always set X-Frame-Options SAMEORIGIN
    Header always set X-Content-Type-Options nosniff
</VirtualHost>
```

## Maintenance Tasks

### Regular Maintenance Schedule

#### Daily
```bash
# Check application status
pm2 status
curl -f http://localhost:3000/api/health || echo "App health check failed"

# Monitor disk space
df -h

# Check database size
mysql -u username -p -e "SELECT table_schema AS 'Database', 
ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' 
FROM information_schema.tables WHERE table_schema='inventory_db';"
```

#### Weekly
```bash
# Database backup with rotation (keep 4 weeks)
mkdir -p /backups/weekly
mysqldump -u username -p inventory_db > /backups/weekly/inventory_$(date +%Y%m%d).sql
find /backups/weekly -name "*.sql" -mtime +28 -delete

# Check for security updates
apt update && apt list --upgradable
```

#### Monthly
```bash
# Clean up old log files
find ~/.pm2/logs -name "*.log" -mtime +30 -delete

# Optimize database tables
mysql -u username -p inventory_db -e "OPTIMIZE TABLE Inventory, StockTransaction, ImportHistory;"

# Review user accounts and permissions
# Check via application admin panel
```

### Monitoring Setup

#### Basic Monitoring Script

Create `/usr/local/bin/inventory-monitor.sh`:

```bash
#!/bin/bash
APP_URL="http://localhost:3000"
LOG_FILE="/var/log/inventory-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check if application is responding
if curl -f $APP_URL/api/health &>/dev/null; then
    echo "[$DATE] Application is healthy" >> $LOG_FILE
else
    echo "[$DATE] Application health check failed" >> $LOG_FILE
    # Restart application
    pm2 restart inventory-app
    echo "[$DATE] Application restarted" >> $LOG_FILE
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check database connectivity
if mysql -u username -p'password' inventory_db -e "SELECT 1;" &>/dev/null; then
    echo "[$DATE] Database is accessible" >> $LOG_FILE
else
    echo "[$DATE] Database connection failed" >> $LOG_FILE
fi
```

Add to crontab:
```bash
# Check every 5 minutes
*/5 * * * * /usr/local/bin/inventory-monitor.sh
```

## Security Considerations

### Application Security
- Keep dependencies updated: `npm audit fix`
- Use HTTPS in production (set `COOKIE_SECURE=true`)
- Regularly rotate `NEXTAUTH_SECRET`
- Implement proper firewall rules
- Use strong database passwords

### Database Security
```sql
-- Create dedicated database user with limited privileges
CREATE USER 'inventory_app'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX ON inventory_db.* TO 'inventory_app'@'localhost';
FLUSH PRIVILEGES;
```

### Server Security
- Keep OS updated
- Use fail2ban for SSH protection
- Configure proper file permissions
- Regular security audits
- Monitor access logs

## Scaling Considerations

### Horizontal Scaling
```bash
# Run multiple instances behind load balancer
pm2 start npm --name "inventory-app-1" -i 4 -- run start
# Configure Nginx upstream for load balancing
```

### Database Scaling
- Consider read replicas for heavy read workloads
- Implement connection pooling
- Monitor slow query log
- Regular performance tuning

This deployment guide ensures your inventory management system runs smoothly in production with proper monitoring, backup, and maintenance procedures.
