import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, stockAlertLevel } = await req.json();

    // Validate input
    if (!id || typeof stockAlertLevel !== 'number' || stockAlertLevel < 0) {
      return NextResponse.json({ 
        error: "Invalid data. ID and valid stock alert level (>=0) are required." 
      }, { status: 400 });
    }

    // Update the stock alert level
    const updatedItem = await prisma.inventory.update({
      where: { id: parseInt(id) },
      data: {
        stockAlertLevel,
        updatedAt: new Date()
      },
      select: {
        id: true,
        barcode: true,
        itemName: true,
        stockAlertLevel: true,
        stockQty: true,
        warehouseName: true
      }
    });

    return NextResponse.json({
      success: true,
      item: updatedItem,
      message: "Stock alert level updated successfully"
    });

  } catch (error: any) {
    console.error("Error updating stock alert level:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      error: "Failed to update stock alert level" 
    }, { status: 500 });
  }
}
