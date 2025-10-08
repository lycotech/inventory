# User Privilege System Documentation

## Overview

The inventory system now includes a comprehensive user privilege system that allows fine-grained control over:
- **Menu Access**: Which pages/sections users can view
- **Warehouse Access**: Which warehouses users can see and interact with
- **Operation Privileges**: What actions users can perform (create, edit, delete, etc.)

## Architecture

### Database Schema

The privilege system consists of three main tables:

1. **user_menu_permissions**: Controls access to different menu items/pages
2. **user_warehouse_access**: Controls access to specific warehouses with view/edit/transfer permissions
3. **user_operation_privileges**: Controls what operations users can perform system-wide

### Menu Access Types

- `dashboard`: Dashboard page access
- `inventory`: Inventory management pages
- `batches`: Batch management access
- `alerts`: Alerts and notifications
- `reports`: Reporting functionality
- `users`: User management (typically admin only)
- `settings`: System settings
- `backup`: Backup and export features
- `logs`: System logs
- `warehouse_transfer`: Warehouse transfer functionality
- `stock_aging`: Stock aging reports
- `import`: Data import functionality

### Operation Privileges

- `create`: Create new records
- `read`: View/read records
- `update`: Edit existing records
- `delete`: Delete records
- `import`: Import data from files
- `export`: Export data
- `transfer`: Transfer stock between warehouses
- `adjust_stock`: Adjust stock quantities
- `reset_stock`: Reset stock quantities
- `acknowledge_alerts`: Acknowledge system alerts

### Warehouse Access Permissions

For each warehouse, users can have:
- `canView`: View warehouse inventory and data
- `canEdit`: Edit warehouse inventory
- `canTransfer`: Transfer stock to/from this warehouse

## Usage

### Creating Users with Privileges

When creating a new user through the admin interface:

1. Fill in basic user information (username, email, password, role)
2. Click "Configure User Privileges" to expand the privilege assignment section
3. Set menu permissions using the toggles
4. Configure warehouse access for each warehouse
5. Set operation privileges
6. Click "Create User"

### Default Privileges by Role

#### Admin
- **Menu Access**: All menus
- **Operations**: All operations
- **Warehouses**: Full access to all warehouses

#### Manager
- **Menu Access**: Dashboard, inventory, batches, alerts, reports, warehouse transfer, stock aging, import
- **Operations**: Create, read, update, import, export, transfer, adjust stock, acknowledge alerts
- **Warehouses**: No restrictions by default

#### User
- **Menu Access**: Dashboard, inventory (read-only), alerts
- **Operations**: Read, acknowledge alerts
- **Warehouses**: No restrictions by default

### API Endpoints

#### User Management
- `POST /api/users/create` - Create user with privileges
- `POST /api/users/[id]/update` - Update user and privileges
- `GET /api/users/[id]/privileges` - Get user privileges
- `GET /api/users/warehouses` - Get warehouses for privilege assignment

#### Authentication
- `GET /api/auth/me` - Get current user with privileges

### Frontend Components

#### PrivilegeAssignment Component
Used in user creation/editing forms to set up user privileges:

```tsx
import { PrivilegeAssignment } from "@/components/privilege-assignment";

<PrivilegeAssignment
  onPrivilegesChange={setPrivileges}
  initialPrivileges={existingPrivileges} // For editing
/>
```

### Utility Functions

#### lib/privileges.ts
- `getUserWithPrivileges(userId)`: Get user with full privilege data
- `hasMenuAccess(privileges, menuItem)`: Check menu access
- `hasWarehouseAccess(privileges, warehouse, permission)`: Check warehouse access
- `hasOperationPrivilege(privileges, operation)`: Check operation privilege
- `getUserAccessibleWarehouses(privileges)`: Get list of accessible warehouses
- `filterByWarehouseAccess(items, privileges)`: Filter data by warehouse access

#### lib/auth.ts
- `getSessionWithPrivileges()`: Get session with privilege data
- `hasPrivilege(userId, type, key, permission?)`: Check specific privilege

### Navigation Integration

The sidebar navigation automatically filters menu items based on user privileges. Menu items are shown/hidden based on:
1. Admin role (sees everything)
2. Specific menu permissions for the user
3. Operation privileges for certain actions

### Warehouse Filtering

Inventory and warehouse-related data can be filtered based on user's warehouse access permissions. Use the `filterByWarehouseAccess` utility function to filter data arrays.

## Security Considerations

1. **Role-based Defaults**: Admin role bypasses privilege checks for convenience
2. **Graceful Fallbacks**: If privileges aren't loaded, falls back to role-based access
3. **Server-side Validation**: All API endpoints should validate privileges server-side
4. **Client-side UI**: Frontend uses privileges only for UI display, not security

## Migration and Setup

### For Existing Users
Run the setup script to create default privileges for existing users:

```bash
node scripts/setup-default-privileges.js
```

### Adding New Privileges
1. Add new enum values to the Prisma schema
2. Generate and apply migration
3. Update default privilege functions
4. Update UI components as needed

## Best Practices

1. **Principle of Least Privilege**: Give users only the minimum access they need
2. **Regular Audits**: Review user privileges periodically
3. **Role-based Templates**: Use role-based defaults as starting points
4. **Granular Control**: Combine menu, warehouse, and operation privileges for fine control
5. **Testing**: Test with different user roles to ensure proper access control

## Troubleshooting

### Common Issues

1. **User can't see expected menus**: Check menu permissions for the user
2. **User can't perform operations**: Verify operation privileges
3. **Warehouse data not visible**: Check warehouse access permissions
4. **Privileges not loading**: Check browser console for API errors

### Debug Steps

1. Check user privileges via `/api/users/[id]/privileges`
2. Verify API endpoint responses include privilege data
3. Check browser console for JavaScript errors
4. Verify database has privilege records for the user