import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Get all warehouses
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get warehouses from the dedicated warehouse table
    const warehouseRecords = await prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: [
        { isCentralWarehouse: 'desc' }, // Central warehouse first
        { warehouseName: 'asc' }
      ],
    });

    // Get warehouse names from inventory records (these might not have dedicated warehouse records)
    const inventoryWarehouses = await prisma.inventory.findMany({
      distinct: ["warehouseName"],
      select: { warehouseName: true },
      orderBy: { warehouseName: "asc" },
      take: 200,
    });

    // Create a map of existing warehouse records
    const warehouseMap = new Map();
    warehouseRecords.forEach(wh => {
      warehouseMap.set(wh.warehouseName, wh);
    });

    // Add inventory warehouses that don't have dedicated records
    const allWarehouses = [...warehouseRecords];
    
    inventoryWarehouses.forEach(inv => {
      if (inv.warehouseName && !warehouseMap.has(inv.warehouseName)) {
        // Create a virtual warehouse record for inventory-only warehouses
        const virtualWarehouse = {
          id: 0, // Virtual ID for inventory-only warehouses
          warehouseName: inv.warehouseName,
          warehouseCode: inv.warehouseName.replace(/\s+/g, '').toUpperCase(), // Auto-generate code
          location: null,
          contactPerson: null,
          phoneNumber: null,
          email: null,
          isCentralWarehouse: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        // Add virtual flag as additional property
        (virtualWarehouse as any).isVirtual = true;
        allWarehouses.push(virtualWarehouse);
      }
    });

    // Sort the final list
    allWarehouses.sort((a, b) => {
      // Central warehouses first, then by name
      if (a.isCentralWarehouse && !b.isCentralWarehouse) return -1;
      if (!a.isCentralWarehouse && b.isCentralWarehouse) return 1;
      return a.warehouseName.localeCompare(b.warehouseName);
    });

    return NextResponse.json({ warehouses: allWarehouses });
  } catch (error: any) {
    console.error("Error fetching warehouses:", error);
    return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 });
  }
}

// Create new warehouse
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  // Role-based access control: only admin and manager can manage warehouses
  if (session.user.role === "user") {
    return NextResponse.json({ error: "Forbidden: Admin or Manager access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { 
    warehouseName, 
    warehouseCode, 
    location, 
    contactPerson, 
    phoneNumber, 
    email, 
    isCentralWarehouse 
  } = body as {
    warehouseName?: string;
    warehouseCode?: string;
    location?: string;
    contactPerson?: string;
    phoneNumber?: string;
    email?: string;
    isCentralWarehouse?: boolean;
  };

  if (!warehouseName || !warehouseCode) {
    return NextResponse.json({ 
      error: "warehouseName and warehouseCode are required" 
    }, { status: 400 });
  }

  try {
    // If this warehouse is marked as central, ensure only one central warehouse exists
    if (isCentralWarehouse) {
      await prisma.warehouse.updateMany({
        where: { isCentralWarehouse: true },
        data: { isCentralWarehouse: false },
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        warehouseName,
        warehouseCode,
        location: location || null,
        contactPerson: contactPerson || null,
        phoneNumber: phoneNumber || null,
        email: email || null,
        isCentralWarehouse: isCentralWarehouse || false,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Warehouse created successfully",
      warehouse 
    });
  } catch (error: any) {
    console.error("Error creating warehouse:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "Warehouse name or code already exists" 
      }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create warehouse" }, { status: 500 });
  }
}

// Update warehouse
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  // Role-based access control: only admin and manager can manage warehouses
  if (session.user.role === "user") {
    return NextResponse.json({ error: "Forbidden: Admin or Manager access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { 
    id,
    warehouseName, 
    warehouseCode, 
    location, 
    contactPerson, 
    phoneNumber, 
    email, 
    isCentralWarehouse,
    isActive
  } = body as {
    id?: number;
    warehouseName?: string;
    warehouseCode?: string;
    location?: string;
    contactPerson?: string;
    phoneNumber?: string;
    email?: string;
    isCentralWarehouse?: boolean;
    isActive?: boolean;
  };

  if (!id) {
    return NextResponse.json({ error: "Warehouse ID is required" }, { status: 400 });
  }

  if (!warehouseName || !warehouseCode) {
    return NextResponse.json({ 
      error: "warehouseName and warehouseCode are required" 
    }, { status: 400 });
  }

  try {
    // Check if warehouse exists
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id }
    });

    if (!existingWarehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    // If this warehouse is being marked as central, ensure only one central warehouse exists
    if (isCentralWarehouse && !existingWarehouse.isCentralWarehouse) {
      await prisma.warehouse.updateMany({
        where: { 
          isCentralWarehouse: true,
          id: { not: id }
        },
        data: { isCentralWarehouse: false },
      });
    }

    // Check if the warehouse name is being changed and if it has inventory items
    if (warehouseName !== existingWarehouse.warehouseName) {
      const inventoryCount = await prisma.inventory.count({
        where: { warehouseName: existingWarehouse.warehouseName }
      });

      if (inventoryCount > 0) {
        // Update all inventory items to use the new warehouse name
        await prisma.inventory.updateMany({
          where: { warehouseName: existingWarehouse.warehouseName },
          data: { warehouseName }
        });
      }
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        warehouseName,
        warehouseCode,
        location: location || null,
        contactPerson: contactPerson || null,
        phoneNumber: phoneNumber || null,
        email: email || null,
        isCentralWarehouse: isCentralWarehouse || false,
        isActive: isActive !== undefined ? isActive : existingWarehouse.isActive,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Warehouse updated successfully",
      warehouse 
    });
  } catch (error: any) {
    console.error("Error updating warehouse:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "Warehouse name or code already exists" 
      }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update warehouse" }, { status: 500 });
  }
}

// Delete warehouse
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  // Role-based access control: only admin and manager can manage warehouses
  if (session.user.role === "user") {
    return NextResponse.json({ error: "Forbidden: Admin or Manager access required" }, { status: 403 });
  }

  const url = new URL(req.url);
  const id = parseInt(url.searchParams.get('id') || '0');

  if (!id) {
    return NextResponse.json({ error: "Warehouse ID is required" }, { status: 400 });
  }

  try {
    // Check if warehouse exists
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id }
    });

    if (!existingWarehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    // Check if warehouse has inventory items
    const inventoryCount = await prisma.inventory.count({
      where: { warehouseName: existingWarehouse.warehouseName }
    });

    if (inventoryCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete warehouse "${existingWarehouse.warehouseName}" because it has ${inventoryCount} inventory items. Please move or remove all items first.` 
      }, { status: 400 });
    }

    // Check if it's the only central warehouse
    if (existingWarehouse.isCentralWarehouse) {
      const otherCentralWarehouses = await prisma.warehouse.count({
        where: { 
          isCentralWarehouse: true,
          id: { not: id },
          isActive: true
        }
      });

      if (otherCentralWarehouses === 0) {
        return NextResponse.json({ 
          error: "Cannot delete the only central warehouse. Please designate another warehouse as central first." 
        }, { status: 400 });
      }
    }

    // Delete the warehouse
    await prisma.warehouse.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Warehouse "${existingWarehouse.warehouseName}" deleted successfully` 
    });
  } catch (error: any) {
    console.error("Error deleting warehouse:", error);
    return NextResponse.json({ error: "Failed to delete warehouse" }, { status: 500 });
  }
}
