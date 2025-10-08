const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupDefaultPrivileges() {
  console.log('Setting up default privileges for existing users...');

  try {
    // Get all users who don't have privileges set yet
    const users = await prisma.user.findMany({
      include: {
        menuPermissions: true,
        operationPrivileges: true
      }
    });

    const menuItems = ['dashboard', 'inventory', 'batches', 'alerts', 'reports', 'users', 'settings', 'backup', 'logs', 'warehouse_transfer', 'stock_aging', 'import'];
    const operations = ['create', 'read', 'update', 'delete', 'import', 'export', 'transfer', 'adjust_stock', 'reset_stock', 'acknowledge_alerts'];

    for (const user of users) {
      console.log(`Setting up privileges for user: ${user.username} (${user.role})`);

      // Only set up if user has no privileges yet
      if (user.menuPermissions.length === 0 && user.operationPrivileges.length === 0) {
        // Define default permissions based on role
        let defaultMenuPermissions = {};
        let defaultOperationPrivileges = {};

        if (user.role === 'admin') {
          // Admin gets full access
          menuItems.forEach(item => defaultMenuPermissions[item] = true);
          operations.forEach(op => defaultOperationPrivileges[op] = true);
        } else if (user.role === 'manager') {
          // Manager gets inventory management access
          ['dashboard', 'inventory', 'batches', 'alerts', 'reports', 'warehouse_transfer', 'stock_aging', 'import'].forEach(item => 
            defaultMenuPermissions[item] = true
          );
          ['create', 'read', 'update', 'import', 'export', 'transfer', 'adjust_stock', 'acknowledge_alerts'].forEach(op => 
            defaultOperationPrivileges[op] = true
          );
        } else if (user.role === 'user') {
          // User gets basic read access
          ['dashboard', 'inventory', 'alerts'].forEach(item => defaultMenuPermissions[item] = true);
          ['read', 'acknowledge_alerts'].forEach(op => defaultOperationPrivileges[op] = true);
        }

        // Create menu permissions
        for (const [menuItem, hasAccess] of Object.entries(defaultMenuPermissions)) {
          await prisma.userMenuPermission.create({
            data: {
              userId: user.id,
              menuItem: menuItem,
              canAccess: hasAccess
            }
          });
        }

        // Create operation privileges
        for (const [operation, hasAccess] of Object.entries(defaultOperationPrivileges)) {
          await prisma.userOperationPrivilege.create({
            data: {
              userId: user.id,
              operation: operation,
              hasAccess: hasAccess
            }
          });
        }

        console.log(`✓ Set up ${Object.keys(defaultMenuPermissions).filter(k => defaultMenuPermissions[k]).length} menu permissions and ${Object.keys(defaultOperationPrivileges).filter(k => defaultOperationPrivileges[k]).length} operation privileges for ${user.username}`);
      } else {
        console.log(`⚠ User ${user.username} already has privileges configured, skipping...`);
      }
    }

    console.log('✅ Default privilege setup completed!');
  } catch (error) {
    console.error('❌ Error setting up default privileges:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDefaultPrivileges();