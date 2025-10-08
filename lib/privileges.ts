import { prisma } from "./prisma";

export interface UserPrivileges {
  menuPermissions: { [key: string]: boolean };
  warehouseAccess: { [key: string]: { canView: boolean; canEdit: boolean; canTransfer: boolean } };
  operationPrivileges: { [key: string]: boolean };
}

export interface UserWithPrivileges {
  id: number;
  username: string;
  email: string;
  role: "admin" | "manager" | "user";
  privileges: UserPrivileges;
}

export async function getUserWithPrivileges(userId: number): Promise<UserWithPrivileges | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        menuPermissions: true,
        warehouseAccess: true,
        operationPrivileges: true
      }
    });

    if (!user) return null;

    // Transform privileges into a more usable format
    const menuPermissions: { [key: string]: boolean } = {};
    user.menuPermissions.forEach(perm => {
      menuPermissions[perm.menuItem] = perm.canAccess;
    });

    const warehouseAccess: { [key: string]: { canView: boolean; canEdit: boolean; canTransfer: boolean } } = {};
    user.warehouseAccess.forEach(access => {
      warehouseAccess[access.warehouseName] = {
        canView: access.canView,
        canEdit: access.canEdit,
        canTransfer: access.canTransfer
      };
    });

    const operationPrivileges: { [key: string]: boolean } = {};
    user.operationPrivileges.forEach(priv => {
      operationPrivileges[priv.operation] = priv.hasAccess;
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      privileges: {
        menuPermissions,
        warehouseAccess,
        operationPrivileges
      }
    };
  } catch (error) {
    console.error("Error fetching user privileges:", error);
    return null;
  }
}

export function hasMenuAccess(privileges: UserPrivileges, menuItem: string): boolean {
  return privileges.menuPermissions[menuItem] === true;
}

export function hasWarehouseAccess(privileges: UserPrivileges, warehouseName: string, permission: 'canView' | 'canEdit' | 'canTransfer'): boolean {
  const access = privileges.warehouseAccess[warehouseName];
  return access && access[permission] === true;
}

export function hasOperationPrivilege(privileges: UserPrivileges, operation: string): boolean {
  return privileges.operationPrivileges[operation] === true;
}

export function getUserAccessibleWarehouses(privileges: UserPrivileges, permission: 'canView' | 'canEdit' | 'canTransfer' = 'canView'): string[] {
  return Object.entries(privileges.warehouseAccess)
    .filter(([_, access]) => access[permission])
    .map(([warehouseName]) => warehouseName);
}

// Check if user can perform specific operations based on role and privileges
export function canUserPerformOperation(user: { role: string; privileges: UserPrivileges }, operation: string): boolean {
  // Admin can do everything by default
  if (user.role === "admin") return true;

  // For other roles, check specific privilege
  return hasOperationPrivilege(user.privileges, operation);
}

// Check if user has access to a menu item based on role and privileges
export function canUserAccessMenu(user: { role: string; privileges: UserPrivileges }, menuItem: string): boolean {
  // Admin can access everything by default
  if (user.role === "admin") return true;

  // For other roles, check specific permission
  return hasMenuAccess(user.privileges, menuItem);
}

// Filter inventory/data based on warehouse access
export function filterByWarehouseAccess(
  items: Array<{ warehouseName: string }>, 
  privileges: UserPrivileges, 
  permission: 'canView' | 'canEdit' | 'canTransfer' = 'canView'
): Array<{ warehouseName: string }> {
  const accessibleWarehouses = getUserAccessibleWarehouses(privileges, permission);
  
  // If no warehouse restrictions (empty access list), return all items
  if (accessibleWarehouses.length === 0) {
    return items;
  }
  
  return items.filter(item => accessibleWarehouses.includes(item.warehouseName));
}

// Get default privileges for new users based on role
export function getDefaultPrivilegesForRole(role: "admin" | "manager" | "user"): UserPrivileges {
  const menuItems = ['dashboard', 'inventory', 'batches', 'alerts', 'reports', 'users', 'settings', 'backup', 'logs', 'warehouse_transfer', 'stock_aging', 'import'];
  const operations = ['create', 'read', 'update', 'delete', 'import', 'export', 'transfer', 'adjust_stock', 'reset_stock', 'acknowledge_alerts'];

  const menuPermissions: { [key: string]: boolean } = {};
  const operationPrivileges: { [key: string]: boolean } = {};

  // Set permissions based on role
  if (role === "admin") {
    // Admin gets full access by default
    menuItems.forEach(item => menuPermissions[item] = true);
    operations.forEach(op => operationPrivileges[op] = true);
  } else if (role === "manager") {
    // Manager gets inventory management access
    ['dashboard', 'inventory', 'batches', 'alerts', 'reports', 'warehouse_transfer', 'stock_aging', 'import'].forEach(item => 
      menuPermissions[item] = true
    );
    ['create', 'read', 'update', 'import', 'export', 'transfer', 'adjust_stock', 'acknowledge_alerts'].forEach(op => 
      operationPrivileges[op] = true
    );
  } else {
    // User gets basic read access
    ['dashboard', 'inventory', 'alerts'].forEach(item => menuPermissions[item] = true);
    ['read', 'acknowledge_alerts'].forEach(op => operationPrivileges[op] = true);
  }

  return {
    menuPermissions,
    warehouseAccess: {}, // No warehouse restrictions by default
    operationPrivileges
  };
}