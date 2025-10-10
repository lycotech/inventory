import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can view user privileges
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Get user with all privileges
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        menuPermissions: true,
        warehouseAccess: true,
        operationPrivileges: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Transform the data for easier frontend consumption
    const menuPermissions: { [key: string]: boolean } = {};
    user.menuPermissions.forEach(perm => {
      menuPermissions[perm.menuItem] = perm.canAccess;
    });

    const warehouseAccess: { [key: string]: any } = {};
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

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive
      },
      privileges: {
        menuPermissions,
        warehouseAccess,
        operationPrivileges
      }
    });
  } catch (error: any) {
    console.error("Error fetching user privileges:", error);
    return NextResponse.json({ 
      error: "Failed to fetch user privileges" 
    }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can update user privileges
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await req.json();
    const { menuPermissions, warehouseAccess, operationPrivileges } = body;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Clear existing privileges
      await tx.userMenuPermission.deleteMany({
        where: { userId }
      });
      
      await tx.userWarehouseAccess.deleteMany({
        where: { userId }
      });
      
      await tx.userOperationPrivilege.deleteMany({
        where: { userId }
      });

      // Add new menu permissions
      if (menuPermissions) {
        const menuPermissionRecords = Object.entries(menuPermissions)
          .filter(([_, canAccess]) => canAccess)
          .map(([menuItem, canAccess]) => ({
            userId,
            menuItem: menuItem as any, // MenuAccess enum
            canAccess: canAccess as boolean
          }));

        if (menuPermissionRecords.length > 0) {
          await tx.userMenuPermission.createMany({
            data: menuPermissionRecords
          });
        }
      }

      // Add new warehouse access
      if (warehouseAccess) {
        const warehouseAccessRecords = Object.entries(warehouseAccess)
          .filter(([_, access]: [string, any]) => 
            access.canView || access.canEdit || access.canTransfer
          )
          .map(([warehouseName, access]: [string, any]) => ({
            userId,
            warehouseName,
            canView: access.canView || false,
            canEdit: access.canEdit || false,
            canTransfer: access.canTransfer || false
          }));

        if (warehouseAccessRecords.length > 0) {
          await tx.userWarehouseAccess.createMany({
            data: warehouseAccessRecords
          });
        }
      }

      // Add new operation privileges
      if (operationPrivileges) {
        const operationPrivilegeRecords = Object.entries(operationPrivileges)
          .filter(([_, hasAccess]) => hasAccess)
          .map(([operation, hasAccess]) => ({
            userId,
            operation: operation as any, // OperationPrivilege enum
            hasAccess: hasAccess as boolean
          }));

        if (operationPrivilegeRecords.length > 0) {
          await tx.userOperationPrivilege.createMany({
            data: operationPrivilegeRecords
          });
        }
      }
    });

    return NextResponse.json({ 
      message: "User privileges updated successfully"
    });

  } catch (error: any) {
    console.error("Error updating user privileges:", error);
    return NextResponse.json({ 
      error: "Failed to update user privileges" 
    }, { status: 500 });
  }
}