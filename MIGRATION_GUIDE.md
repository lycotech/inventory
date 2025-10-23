# Database Migration Checklist

## Critical Changes Applied:

### 1. Decimal Quantity System
- ✅ Changed `stockQty` from Int to Decimal(15,4) 
- ✅ Updated all API routes to handle Decimal types
- ✅ Created decimal-utils.ts for type conversions
- ✅ Fixed TypeScript compilation errors

### 2. User Privilege System  
- ✅ Added `UserMenuPermission` table
- ✅ Added `UserWarehouseAccess` table  
- ✅ Added `UserOperationPrivilege` table
- ✅ Created privilege management APIs
- ✅ Built privilege assignment UI

## Pre-Migration Backup Recommendation:
```sql
-- Create backup before applying changes
mysqldump -u username -p inventory_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Migration Commands:
```bash
# Apply schema changes
npx prisma db push

# OR if using migration files
npx prisma migrate deploy

# Verify changes
npx prisma studio
```

## Post-Migration Validation:
1. Check that existing inventory records have decimal quantities
2. Verify privilege tables are created
3. Test user login and navigation filtering
4. Confirm decimal calculations work in stock operations