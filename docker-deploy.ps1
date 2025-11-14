# Inventory System - Docker Quick Start Script
# This script helps you deploy the inventory system quickly

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Inventory System - Docker Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "ERROR: Docker is not installed!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

$dockerVersion = docker --version
Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green

# Check if .env.docker exists
if (-not (Test-Path ".env.docker")) {
    Write-Host ""
    Write-Host "Creating .env.docker configuration file..." -ForegroundColor Yellow
    
    $envContent = @"
# MySQL Database Configuration
MYSQL_ROOT_PASSWORD=SecureRootPassword123!
MYSQL_DATABASE=westgatedb
MYSQL_USER=westuser
MYSQL_PASSWORD=SecureUserPassword123!

# Application Configuration
APP_PORT=3000
AUTH_SESSION_SECRET=change-me-to-secure-random-secret-key-min-32-chars
COOKIE_SECURE=false

# Admin User Credentials
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=admin@123
SEED_ADMIN_EMAIL=admin@example.com

# Optional: SMTP Configuration (for email alerts)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# SMTP_FROM=noreply@yourdomain.com
"@
    
    $envContent | Out-File -FilePath ".env.docker" -Encoding utf8
    Write-Host "✓ Created .env.docker file" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Please edit .env.docker and change the default passwords!" -ForegroundColor Red
    Write-Host ""
    
    $continue = Read-Host "Do you want to continue with default passwords? (yes/no)"
    if ($continue -ne "yes") {
        Write-Host "Please edit .env.docker file and run this script again." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Deployment Options" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "1. Fresh Install (clean start)"
Write-Host "2. Start Services"
Write-Host "3. Stop Services"
Write-Host "4. Restart Services"
Write-Host "5. View Logs"
Write-Host "6. Rebuild Application"
Write-Host "7. Backup Database"
Write-Host "8. Status Check"
Write-Host "9. Exit"
Write-Host ""

$choice = Read-Host "Enter your choice (1-9)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Starting Fresh Installation..." -ForegroundColor Yellow
        Write-Host ""
        
        # Stop and remove existing containers
        Write-Host "Stopping existing containers..." -ForegroundColor Yellow
        docker compose down -v
        
        # Build images
        Write-Host "Building Docker images (this may take 5-10 minutes)..." -ForegroundColor Yellow
        docker compose build
        
        # Start services
        Write-Host "Starting services..." -ForegroundColor Yellow
        docker compose --env-file .env.docker up -d
        
        Write-Host ""
        Write-Host "Waiting for services to be ready (30 seconds)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
        
        Write-Host ""
        Write-Host "✓ Deployment Complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access the application at: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "Default login:" -ForegroundColor Cyan
        Write-Host "  Username: admin" -ForegroundColor Cyan
        Write-Host "  Password: admin@123" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To view logs, run: docker compose logs -f" -ForegroundColor Yellow
    }
    
    "2" {
        Write-Host ""
        Write-Host "Starting services..." -ForegroundColor Yellow
        docker compose --env-file .env.docker up -d
        Write-Host "✓ Services started!" -ForegroundColor Green
        Write-Host "Access at: http://localhost:3000" -ForegroundColor Cyan
    }
    
    "3" {
        Write-Host ""
        Write-Host "Stopping services..." -ForegroundColor Yellow
        docker compose down
        Write-Host "✓ Services stopped!" -ForegroundColor Green
    }
    
    "4" {
        Write-Host ""
        Write-Host "Restarting services..." -ForegroundColor Yellow
        docker compose restart
        Write-Host "✓ Services restarted!" -ForegroundColor Green
    }
    
    "5" {
        Write-Host ""
        Write-Host "Showing logs (press Ctrl+C to exit)..." -ForegroundColor Yellow
        docker compose logs -f
    }
    
    "6" {
        Write-Host ""
        Write-Host "Rebuilding application..." -ForegroundColor Yellow
        docker compose down
        docker compose build
        docker compose --env-file .env.docker up -d
        Write-Host "✓ Rebuild complete!" -ForegroundColor Green
    }
    
    "7" {
        Write-Host ""
        $backupFile = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
        Write-Host "Creating database backup: $backupFile" -ForegroundColor Yellow
        Write-Host "Note: You will be prompted for the MySQL root password" -ForegroundColor Yellow
        
        docker compose exec -T db mysqldump -u root -p westgatedb | Out-File -FilePath $backupFile -Encoding utf8
        
        Write-Host "✓ Backup created: $backupFile" -ForegroundColor Green
    }
    
    "8" {
        Write-Host ""
        Write-Host "Service Status:" -ForegroundColor Yellow
        docker compose ps
        Write-Host ""
        Write-Host "Container Stats:" -ForegroundColor Yellow
        docker stats --no-stream
    }
    
    "9" {
        Write-Host "Goodbye!" -ForegroundColor Cyan
        exit 0
    }
    
    default {
        Write-Host "Invalid choice!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
