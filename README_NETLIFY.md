# Netlify Deployment Configuration

## Environment Variables Setup

Set the following environment variables in your Netlify dashboard:

### Database Configuration
```
DATABASE_URL=mysql://cnbezvte_westuser:%7E%7B3%24%28%2Bt%3FjBpA@gator4410.hostgator.com:3306/cnbezvte_westgatedb
```
**Note:** Special characters in password are URL-encoded:
- Original password: `~{3$(+t?jBpA`
- URL-encoded: `%7E%7B3%24%28%2Bt%3FjBpA`

### Authentication Secret
```
AUTH_SESSION_SECRET=your-secure-random-secret-here
```
*Generate a secure random string for production*

### Admin User Setup (Optional)
```
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=your-secure-admin-password
SEED_ADMIN_EMAIL=admin@yourdomain.com
```

### Security Settings
```
COOKIE_SECURE=true
```
*Set to `true` for HTTPS deployments*

## Build Configuration

### Build Command
```
npm run build
```

### Publish Directory
```
.next
```

### Node Version
Ensure Node.js version 18+ is used in the build environment.

## Deployment Notes

1. **Database Migration**: Run database migrations if needed
2. **Environment Variables**: All sensitive data should be set in Netlify dashboard
3. **HTTPS**: Ensure your deployment uses HTTPS for secure cookies
4. **First Deploy**: Consider running the seed script to create an admin user

## Troubleshooting

### Common Build Issues

**"Failed to collect page data for /api/xxx" Errors**
- ✅ **FULLY FIXED**: ALL API routes now configured with `dynamic = "force-dynamic"`
- ✅ **Comprehensive Coverage**: Applied to all database-dependent routes:
  - Dashboard APIs (`/api/dashboard/*`)
  - Inventory management (`/api/inventory/*`)
  - User management (`/api/users/*`)
  - Categories & warehouses (`/api/categories/*`, `/api/warehouses/*`)
  - Alerts & aging (`/api/alerts/*`, `/api/aging-categories/*`, `/api/stock-aging/*`)
  - Settings & auth (`/api/settings`, `/api/auth/*`)
- ✅ **Build Optimization**: Only 12 static pages generated (optimal for dynamic app)
- ✅ **Database connections handled gracefully during build process**

**Database Connection Errors**
- Verify the DATABASE_URL format matches: `mysql://user:password@host:port/database`
- Ensure all special characters in password are URL-encoded (@ becomes %40, etc.)

**Authentication Issues**
- Ensure AUTH_SESSION_SECRET is set and is at least 32 characters long
- Verify COOKIE_SECURE setting matches your deployment protocol (true for HTTPS)

**Build Process**
- All dynamic pages are configured to render on-demand
- API routes return empty data gracefully when database is unavailable during build
- No static site generation attempted for database-dependent routes

## Post-Deployment

After successful deployment:
1. Access your site and try logging in with admin credentials
2. Create additional users as needed
3. Configure application settings through the Settings page
4. Import your inventory data

---
*Generated on: August 20, 2025*
