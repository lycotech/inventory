import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const username = String(body.username || "").trim();
  const email = String(body.email || "").trim();
  const password = String(body.password || "").trim();
  const role = (String(body.role || "manager").trim()) as "admin" | "manager" | "user";
  
  // Privilege assignments
  const menuPermissions = body.menuPermissions || {};
  const warehouseAccess = body.warehouseAccess || {};
  const operationPrivileges = body.operationPrivileges || {};

  if (!username || !email || !password) {
    return NextResponse.json({ error: "Username, email and password are required" }, { status: 400 });
  }
  if (!/^.+@.+\..+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (!["admin", "manager", "user"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user with privileges in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: { username, email, passwordHash, role, isActive: true },
        select: { id: true, username: true, email: true, role: true, isActive: true, createdAt: true },
      });

      // Create menu permissions
      const menuItems = ['dashboard', 'inventory', 'batches', 'alerts', 'reports', 'users', 'settings', 'backup', 'logs', 'warehouse_transfer', 'stock_aging', 'import'];
      for (const menuItem of menuItems) {
        await tx.userMenuPermission.create({
          data: {
            userId: user.id,
            menuItem: menuItem as any,
            canAccess: menuPermissions[menuItem] || false
          }
        });
      }

      // Create warehouse access permissions
      if (warehouseAccess && Object.keys(warehouseAccess).length > 0) {
        for (const [warehouseName, permissions] of Object.entries(warehouseAccess)) {
          const warehousePerms = permissions as any;
          await tx.userWarehouseAccess.create({
            data: {
              userId: user.id,
              warehouseName,
              canView: warehousePerms.canView || false,
              canEdit: warehousePerms.canEdit || false,
              canTransfer: warehousePerms.canTransfer || false
            }
          });
        }
      }

      // Create operation privileges
      const operations = ['create', 'read', 'update', 'delete', 'import', 'export', 'transfer', 'adjust_stock', 'reset_stock', 'acknowledge_alerts'];
      for (const operation of operations) {
        await tx.userOperationPrivilege.create({
          data: {
            userId: user.id,
            operation: operation as any,
            hasAccess: operationPrivileges[operation] || false
          }
        });
      }

      return user;
    });
    
    return NextResponse.json({ user: result });
  } catch (e: any) {
    console.error("User creation error:", e);
    if (e?.code === "P2002") {
      const target = Array.isArray(e.meta?.target) ? e.meta.target.join(", ") : e.meta?.target || "unique field";
      return NextResponse.json({ error: `Duplicate ${target}` }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
