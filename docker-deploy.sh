#!/bin/bash

# Inventory System - Docker Quick Start Script
# This script helps you deploy the inventory system quickly

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================${NC}"
echo -e "${CYAN}Inventory System - Docker Deployment${NC}"
echo -e "${CYAN}=====================================${NC}"
echo ""

# Check if Docker is installed
echo -e "${YELLOW}Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not installed!${NC}"
    echo -e "${YELLOW}Please install Docker from: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

DOCKER_VERSION=$(docker --version)
echo -e "${GREEN}✓ Docker found: $DOCKER_VERSION${NC}"

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}ERROR: Docker Compose is not installed!${NC}"
    echo -e "${YELLOW}Please install Docker Compose from: https://docs.docker.com/compose/install/${NC}"
    exit 1
fi

COMPOSE_VERSION=$(docker compose version)
echo -e "${GREEN}✓ Docker Compose found: $COMPOSE_VERSION${NC}"

# Check if .env.docker exists
if [ ! -f ".env.docker" ]; then
    echo ""
    echo -e "${YELLOW}Creating .env.docker configuration file...${NC}"
    
    cat > .env.docker << 'EOF'
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
EOF
    
    echo -e "${GREEN}✓ Created .env.docker file${NC}"
    echo ""
    echo -e "${RED}IMPORTANT: Please edit .env.docker and change the default passwords!${NC}"
    echo ""
    
    read -p "Do you want to continue with default passwords? (yes/no): " continue
    if [ "$continue" != "yes" ]; then
        echo -e "${YELLOW}Please edit .env.docker file and run this script again.${NC}"
        exit 0
    fi
fi

echo ""
echo -e "${CYAN}=====================================${NC}"
echo -e "${CYAN}Deployment Options${NC}"
echo -e "${CYAN}=====================================${NC}"
echo "1. Fresh Install (clean start)"
echo "2. Start Services"
echo "3. Stop Services"
echo "4. Restart Services"
echo "5. View Logs"
echo "6. Rebuild Application"
echo "7. Backup Database"
echo "8. Status Check"
echo "9. Exit"
echo ""

read -p "Enter your choice (1-9): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}Starting Fresh Installation...${NC}"
        echo ""
        
        # Stop and remove existing containers
        echo -e "${YELLOW}Stopping existing containers...${NC}"
        docker compose down -v
        
        # Build images
        echo -e "${YELLOW}Building Docker images (this may take 5-10 minutes)...${NC}"
        docker compose build
        
        # Start services
        echo -e "${YELLOW}Starting services...${NC}"
        docker compose --env-file .env.docker up -d
        
        echo ""
        echo -e "${YELLOW}Waiting for services to be ready (30 seconds)...${NC}"
        sleep 30
        
        echo ""
        echo -e "${GREEN}✓ Deployment Complete!${NC}"
        echo ""
        echo -e "${CYAN}Access the application at: http://localhost:3000${NC}"
        
        # Get local IP
        if command -v hostname &> /dev/null; then
            LOCAL_IP=$(hostname -I | awk '{print $1}')
            if [ ! -z "$LOCAL_IP" ]; then
                echo -e "${CYAN}Or from other computers: http://$LOCAL_IP:3000${NC}"
            fi
        fi
        
        echo -e "${CYAN}Default login:${NC}"
        echo -e "${CYAN}  Username: admin${NC}"
        echo -e "${CYAN}  Password: admin@123${NC}"
        echo ""
        echo -e "${YELLOW}To view logs, run: docker compose logs -f${NC}"
        ;;
    
    2)
        echo ""
        echo -e "${YELLOW}Starting services...${NC}"
        docker compose --env-file .env.docker up -d
        echo -e "${GREEN}✓ Services started!${NC}"
        echo -e "${CYAN}Access at: http://localhost:3000${NC}"
        ;;
    
    3)
        echo ""
        echo -e "${YELLOW}Stopping services...${NC}"
        docker compose down
        echo -e "${GREEN}✓ Services stopped!${NC}"
        ;;
    
    4)
        echo ""
        echo -e "${YELLOW}Restarting services...${NC}"
        docker compose restart
        echo -e "${GREEN}✓ Services restarted!${NC}"
        ;;
    
    5)
        echo ""
        echo -e "${YELLOW}Showing logs (press Ctrl+C to exit)...${NC}"
        docker compose logs -f
        ;;
    
    6)
        echo ""
        echo -e "${YELLOW}Rebuilding application...${NC}"
        docker compose down
        docker compose build
        docker compose --env-file .env.docker up -d
        echo -e "${GREEN}✓ Rebuild complete!${NC}"
        ;;
    
    7)
        echo ""
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        echo -e "${YELLOW}Creating database backup: $BACKUP_FILE${NC}"
        
        # Load password from .env.docker
        source .env.docker
        docker compose exec -T db mysqldump -u root -p$MYSQL_ROOT_PASSWORD westgatedb > "$BACKUP_FILE"
        
        echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
        ;;
    
    8)
        echo ""
        echo -e "${YELLOW}Service Status:${NC}"
        docker compose ps
        echo ""
        echo -e "${YELLOW}Container Stats:${NC}"
        docker stats --no-stream
        ;;
    
    9)
        echo -e "${CYAN}Goodbye!${NC}"
        exit 0
        ;;
    
    *)
        echo -e "${RED}Invalid choice!${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${CYAN}=====================================${NC}"
echo -e "${CYAN}Done!${NC}"
echo -e "${CYAN}=====================================${NC}"
