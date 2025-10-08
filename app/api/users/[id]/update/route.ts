import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isFinite(userId) || userId <= 0) return NextResponse.json({ error: "Invalid user id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const role = body.role as "admin" | "manager" | "user" | undefined;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : undefined;
  
  // Privilege assignments (optional - only update if provided)
  const menuPermissions = body.menuPermissions;
  const warehouseAccess = body.warehouseAccess;
  const operationPrivileges = body.operationPrivileges;

  if (role && !["admin", "manager", "user"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Update user basic info
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          ...(role ? { role } : {}),
          ...(typeof isActive === "boolean" ? { isActive } : {}),
        },
        select: { id: true, username: true, email: true, role: true, isActive: true },
      });

      // Update privileges if provided
      if (menuPermissions) {
        // Delete existing menu permissions and recreate
        await tx.userMenuPermission.deleteMany({ where: { userId } });
        const menuItems = ['dashboard', 'inventory', 'batches', 'alerts', 'reports', 'users', 'settings', 'backup', 'logs', 'warehouse_transfer', 'stock_aging', 'import'];
        for (const menuItem of menuItems) {
          await tx.userMenuPermission.create({
            data: {
              userId,
              menuItem: menuItem as any,
              canAccess: menuPermissions[menuItem] || false
            }
          });
        }
      }

      if (warehouseAccess) {
        // Delete existing warehouse access and recreate
        await tx.userWarehouseAccess.deleteMany({ where: { userId } });
        for (const [warehouseName, permissions] of Object.entries(warehouseAccess)) {
          const warehousePerms = permissions as any;
          await tx.userWarehouseAccess.create({
            data: {
              userId,
              warehouseName,
              canView: warehousePerms.canView || false,
              canEdit: warehousePerms.canEdit || false,
              canTransfer: warehousePerms.canTransfer || false
            }
          });
        }
      }

      if (operationPrivileges) {
        // Delete existing operation privileges and recreate
        await tx.userOperationPrivilege.deleteMany({ where: { userId } });
        const operations = ['create', 'read', 'update', 'delete', 'import', 'export', 'transfer', 'adjust_stock', 'reset_stock', 'acknowledge_alerts'];
        for (const operation of operations) {
          await tx.userOperationPrivilege.create({
            data: {
              userId,
              operation: operation as any,
              hasAccess: operationPrivileges[operation] || false
            }
          });
        }
      }

      return updated;
    });

    return NextResponse.json({ user: result });
  } catch (e: any) {
    console.error("User update error:", e);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
