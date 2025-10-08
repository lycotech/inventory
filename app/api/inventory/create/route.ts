import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      barcode,
      category,
      itemName,
      searchCode,
      warehouseName,
      stockQty,
      stockAlertLevel,
      unit,
      baseUnit,
      conversionFactor,
      expireDate,
      expireDateAlert,
      // Batch fields (optional)
      batchNumber,
      manufactureDate,
      supplierInfo,
      lotNumber,
      costPerUnit
    } = body;

    // Validation
    if (!barcode || !itemName || !category || !warehouseName) {
      return NextResponse.json({ 
        error: "Missing required fields: barcode, itemName, category, warehouseName" 
      }, { status: 400 });
    }

    // Check if item with same barcode already exists in the same warehouse
    const existingItem = await prisma.inventory.findFirst({
      where: {
        barcode: barcode.trim(),
        warehouseName: warehouseName.trim()
      }
    });

    if (existingItem) {
      return NextResponse.json({ 
        error: `Item with barcode ${barcode} already exists in warehouse ${warehouseName}` 
      }, { status: 409 });
    }

    // Verify warehouse exists
    const warehouse = await prisma.warehouse.findFirst({
      where: { warehouseName: warehouseName.trim() }
    });

    if (!warehouse) {
      return NextResponse.json({ 
        error: `Warehouse '${warehouseName}' not found` 
      }, { status: 404 });
    }

    // Create search code (use provided searchCode or generate from barcode and item name)
    const finalSearchCode = searchCode?.trim() || `${barcode.trim()} ${itemName.trim()}`.toLowerCase();

    // Parse dates
    let parsedExpireDate = null;
    if (expireDate) {
      parsedExpireDate = new Date(expireDate);
      if (isNaN(parsedExpireDate.getTime())) {
        return NextResponse.json({ 
          error: "Invalid expiry date format" 
        }, { status: 400 });
      }
    }

    // Create the new inventory item
    const newItem = await prisma.inventory.create({
      data: {
        barcode: barcode.trim(),
        category: category.trim(),
        itemName: itemName.trim(),
        searchCode: finalSearchCode,
        warehouseName: warehouseName.trim(),
        stockQty: parseFloat(stockQty) || 0,
        stockAlertLevel: parseInt(stockAlertLevel) || 0,
        unit: unit?.trim() || 'piece',
        baseUnit: baseUnit?.trim() || 'piece',
        conversionFactor: parseFloat(conversionFactor) || 1.0,
        expireDate: parsedExpireDate,
        expireDateAlert: parseInt(expireDateAlert) || 0,
        createdBy: session.user.id,
      }
    });

    // Create batch record if batch tracking is enabled and batch fields are provided
    let batchRecord = null;
    if (batchNumber && batchNumber.trim()) {
      // Parse manufacture date
      let parsedManufactureDate = null;
      if (manufactureDate) {
        parsedManufactureDate = new Date(manufactureDate);
        if (isNaN(parsedManufactureDate.getTime())) {
          return NextResponse.json({ 
            error: "Invalid manufacture date format" 
          }, { status: 400 });
        }
      }

      // Check if batch already exists for this inventory and warehouse
      const existingBatch = await prisma.batch.findFirst({
        where: {
          inventoryId: newItem.id,
          batchNumber: batchNumber.trim(),
          warehouseId: warehouse.id
        }
      });

      if (!existingBatch) {
        // For batch creation, expiryDate is required
        if (!parsedExpireDate) {
          return NextResponse.json({ 
            error: "Expiry date is required for batch tracking" 
          }, { status: 400 });
        }

        batchRecord = await prisma.batch.create({
          data: {
            inventoryId: newItem.id,
            warehouseId: warehouse.id,
            batchNumber: batchNumber.trim(),
            quantityReceived: parseInt(stockQty) || 0,
            quantityRemaining: parseInt(stockQty) || 0,
            manufactureDate: parsedManufactureDate,
            expiryDate: parsedExpireDate,
            supplierInfo: supplierInfo?.trim() || '',
            lotNumber: lotNumber?.trim() || '',
            costPerUnit: parseFloat(costPerUnit) || 0,
            createdBy: session.user.id
          }
        });
      }
    }

    // If initial stock quantity > 0, create a receive transaction
    if (parseInt(stockQty) > 0) {
      await prisma.stockTransaction.create({
        data: {
          inventoryId: newItem.id,
          transactionType: 'receive',
          quantity: parseInt(stockQty),
          transactionDate: new Date(),
          referenceDoc: `INITIAL-${new Date().toISOString().slice(0, 10)}`,
          reason: 'Initial stock entry for new item',
          processedBy: session.user.id
        }
      });
    }

    return NextResponse.json({
      message: "Item created successfully",
      item: {
        id: newItem.id,
        barcode: newItem.barcode,
        itemName: newItem.itemName,
        category: newItem.category,
        warehouseName: newItem.warehouseName,
        stockQty: newItem.stockQty,
        stockAlertLevel: newItem.stockAlertLevel,
        expireDate: newItem.expireDate,
        expireDateAlert: newItem.expireDateAlert,
        createdAt: newItem.createdAt
      }
    });

  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json({ 
      error: "Failed to create inventory item",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const barcode = url.searchParams.get("barcode");
    const warehouse = url.searchParams.get("warehouse");

    if (!barcode || !warehouse) {
      return NextResponse.json({ 
        error: "Missing barcode or warehouse parameter" 
      }, { status: 400 });
    }

    // Check if item already exists
    const existingItem = await prisma.inventory.findFirst({
      where: {
        barcode: barcode.trim(),
        warehouseName: warehouse.trim()
      }
    });

    return NextResponse.json({
      exists: !!existingItem,
      item: existingItem || null
    });

  } catch (error) {
    console.error("Error checking item existence:", error);
    return NextResponse.json({ 
      error: "Failed to check item existence" 
    }, { status: 500 });
  }
}