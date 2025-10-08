import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
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

    const userId = parseInt(params.id);
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