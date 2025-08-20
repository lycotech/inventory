# Netlify Deployment Configuration

## Environment Variables Setup

Set the following environment variables in your Netlify dashboard:

### Database Configuration
```
DATABASE_URL=mysql://cnbezvte_invalertuserner:Ci1.N5jo}UST@gator4410.hostgator.com:2083/cnbezvte_invalert
```

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

- If you get database connection errors, verify the DATABASE_URL format
- For authentication issues, ensure AUTH_SESSION_SECRET is set
- For HTTPS/cookie issues, verify COOKIE_SECURE setting matches your deployment protocol

## Post-Deployment

After successful deployment:
1. Access your site and try logging in with admin credentials
2. Create additional users as needed
3. Configure application settings through the Settings page
4. Import your inventory data

---
*Generated on: August 20, 2025*
