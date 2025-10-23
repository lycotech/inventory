# Quick Server Update Script
# Run these commands on your production server

# 1. Update code
git pull origin main

# 2. Install dependencies  
npm install

# 3. Apply database changes
npx prisma db push

# 4. Rebuild application
npm run build

# 5. Restart server (choose one based on your setup)
# For PM2:
pm2 restart all

# For systemd:
# sudo systemctl restart your-app-name

# For Docker:
# docker-compose restart

# 6. Verify deployment
curl http://localhost:3000/api/auth/me