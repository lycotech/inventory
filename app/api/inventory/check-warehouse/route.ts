import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const inventoryId = url.searchParams.get("inventoryId");
  const warehouseId = url.searchParams.get("warehouseId");

  if (!inventoryId || !warehouseId) {
    return NextResponse.json({ 
      error: "Both inventoryId and warehouseId are required" 
    }, { status: 400 });
  }

  try {
    // Get the inventory item details
    const inventoryItem = await prisma.inventory.findUnique({
      where: { id: parseInt(inventoryId) },
      select: {
        id: true,
        itemName: true,
        barcode: true,
        warehouseName: true,
        stockQty: true
      }
    });

    if (!inventoryItem) {
      return NextResponse.json({ 
        exists: false, 
        message: "Inventory item not found",
        item: null 
      });
    }

    // Get the warehouse details
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(warehouseId) },
      select: {
        id: true,
        warehouseName: true,
        warehouseCode: true
      }
    });

    if (!warehouse) {
      return NextResponse.json({ 
        exists: false, 
        message: "Warehouse not found",
        item: inventoryItem 
      });
    }

    // Check if the item's warehouse matches the selected warehouse
    const exists = inventoryItem.warehouseName === warehouse.warehouseName;
    
    return NextResponse.json({
      exists,
      message: exists 
        ? `Item "${inventoryItem.itemName}" is available in ${warehouse.warehouseName} (Stock: ${inventoryItem.stockQty})`
        : `Item "${inventoryItem.itemName}" is NOT available in ${warehouse.warehouseName}. Item is located in: ${inventoryItem.warehouseName}`,
      item: {
        id: inventoryItem.id,
        itemName: inventoryItem.itemName,
        barcode: inventoryItem.barcode,
        currentWarehouse: inventoryItem.warehouseName,
        stockQty: inventoryItem.stockQty
      },
      warehouse: {
        id: warehouse.id,
        warehouseName: warehouse.warehouseName,
        warehouseCode: warehouse.warehouseCode
      }
    });

  } catch (error) {
    console.error('Error checking warehouse availability:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}