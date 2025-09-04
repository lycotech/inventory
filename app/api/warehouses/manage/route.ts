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
