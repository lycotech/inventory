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
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: [
        { isCentralWarehouse: 'desc' }, // Central warehouse first
        { warehouseName: 'asc' }
      ],
    });

    return NextResponse.json({ warehouses });
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
