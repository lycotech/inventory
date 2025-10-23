#!/bin/bash
# Deployment script for inventory management system

echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client with latest schema
echo "🔄 Generating Prisma client..."
npx prisma generate

# Apply database migrations
echo "🗄️ Applying database migrations..."
npx prisma db push

# Build the application
echo "🏗️ Building application..."
npm run build

# Restart the application (adjust based on your process manager)
echo "🔄 Restarting application..."
# Uncomment the line that matches your setup:
# pm2 restart inventory
# sudo systemctl restart inventory
# docker-compose restart

echo "✅ Deployment completed successfully!"
echo ""
echo "🔍 Key updates deployed:"
echo "  ✓ Decimal quantity system with proper TypeScript handling"
echo "  ✓ Complete user privilege system (menu, warehouse, operation permissions)"  
echo "  ✓ Privilege editing UI with modal interface"
echo "  ✓ Role-based quick setup functionality"
echo "  ✓ Fixed React Hooks compliance in navigation"
echo ""
echo "📋 Post-deployment checklist:"
echo "  □ Test privilege editing functionality"
echo "  □ Verify decimal quantities display correctly"
echo "  □ Check user role assignments work"
echo "  □ Test warehouse access permissions"
echo "  □ Confirm navigation filtering works"