import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyStockAlert } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  // Role-based access control: only admin and manager can receive stock
  if (session.user.role === "user") {
    return NextResponse.json({ error: "Forbidden: Admin or Manager access required" }, { status: 403 });
  }
  
  const body = await req.json().catch(() => ({}));
  const { 
    barcode, 
    warehouseName, 
    quantity, 
    referenceDoc, 
    reason, 
    allowNonCentral,
    // Batch-specific fields
    enableBatchTracking,
    batchNumber,
    manufactureDate,
    expiryDate,
    supplierInfo,
    lotNumber,
    costPerUnit,
    notes
  } = body as {
    barcode?: string;
    warehouseName?: string;
    quantity?: number;
    referenceDoc?: string;
    reason?: string;
    allowNonCentral?: boolean;
    // Batch fields
    enableBatchTracking?: boolean;
    batchNumber?: string;
    manufactureDate?: string;
    expiryDate?: string;
    supplierInfo?: string;
    lotNumber?: string;
    costPerUnit?: number;
    notes?: string;
  };

  if (!barcode || !warehouseName || !quantity || !Number.isFinite(quantity)) {
    return NextResponse.json({ error: "barcode, warehouseName and quantity required" }, { status: 400 });
  }

  // If batch tracking is enabled, validate batch-specific requirements
  if (enableBatchTracking) {
    if (!batchNumber) {
      return NextResponse.json({ error: "batchNumber is required when batch tracking is enabled" }, { status: 400 });
    }
    if (!expiryDate) {
      return NextResponse.json({ error: "expiryDate is required when batch tracking is enabled" }, { status: 400 });
    }
  }

  try {
    // Check if target warehouse is central warehouse
    const targetWarehouse = await prisma.warehouse.findFirst({
      where: { warehouseName, isActive: true }
    });

    if (!targetWarehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    // Get central warehouse info
    const centralWarehouse = await prisma.warehouse.findFirst({
      where: { isCentralWarehouse: true, isActive: true }
    });

    // Enforce central warehouse policy unless explicitly overridden by admin
    if (!allowNonCentral && centralWarehouse && !targetWarehouse?.isCentralWarehouse) {
      return NextResponse.json({ 
        error: `Stock must be received into central warehouse (${centralWarehouse.warehouseName}) first. Use warehouse transfer to move items to other locations.`,
        suggestion: `Receive into ${centralWarehouse.warehouseName} then transfer to ${warehouseName}`,
        centralWarehouse: centralWarehouse.warehouseName
      }, { status: 400 });
    }

    const inv = await prisma.inventory.findUnique({ 
      where: { barcode_warehouse: { barcode, warehouseName } } 
    });
    
    if (!inv) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }

    // If batch tracking is enabled, check if batch number already exists
    if (enableBatchTracking && batchNumber) {
      const existingBatch = await prisma.batch.findUnique({
        where: { batchNumber }
      });

      if (existingBatch) {
        return NextResponse.json({ 
          error: "Batch number already exists. Please use a unique batch number." 
        }, { status: 400 });
      }
    }

    const result = await prisma.$transaction(async (db: any) => {
      // Create the stock transaction
      const stockTransaction = await db.stockTransaction.create({
        data: {
          inventoryId: inv.id,
          transactionType: "receive",
          quantity: Math.abs(quantity!),
          transactionDate: new Date(),
          referenceDoc: referenceDoc || null,
          reason: reason || null,
          processedBy: session.user.id,
        },
      });

      // Update inventory quantity
      const updatedInventory = await db.inventory.update({
        where: { id: inv.id },
        data: { stockQty: { increment: Math.abs(quantity!) } },
      });

      let batch = null;
      let batchTransaction = null;

      // Create batch if batch tracking is enabled
      if (enableBatchTracking && batchNumber && expiryDate) {
        batch = await db.batch.create({
          data: {
            batchNumber,
            inventoryId: inv.id,
            warehouseId: targetWarehouse.id,
            quantityReceived: Math.abs(quantity!),
            quantityRemaining: Math.abs(quantity!),
            manufactureDate: manufactureDate ? new Date(manufactureDate) : null,
            expiryDate: new Date(expiryDate),
            supplierInfo,
            lotNumber,
            costPerUnit: costPerUnit ? parseFloat(costPerUnit.toString()) : null,
            notes,
            createdBy: session.user.id
          }
        });

        // Create batch transaction for receiving
        batchTransaction = await db.batchTransaction.create({
          data: {
            batchId: batch.id,
            transactionType: "receive",
            quantity: Math.abs(quantity!),
            transactionDate: new Date(),
            reason: reason || "Initial batch creation",
            referenceDoc: referenceDoc || null,
            processedBy: session.user.id
          }
        });

        // Check if batch is expiring soon and create alert
        const today = new Date();
        const expiryDateObj = new Date(expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 30) {
          let alertType: 'expiring_soon' | 'expired' = 'expiring_soon';
          let priority: 'low' | 'medium' | 'high' = 'low';
          let message = '';

          if (daysUntilExpiry < 0) {
            alertType = 'expired';
            priority = 'high';
            message = `Batch ${batchNumber} of ${inv.itemName} has expired ${Math.abs(daysUntilExpiry)} days ago`;
          } else if (daysUntilExpiry <= 7) {
            priority = 'high';
            message = `Batch ${batchNumber} of ${inv.itemName} expires in ${daysUntilExpiry} days`;
          } else if (daysUntilExpiry <= 14) {
            priority = 'medium';
            message = `Batch ${batchNumber} of ${inv.itemName} expires in ${daysUntilExpiry} days`;
          } else {
            priority = 'low';
            message = `Batch ${batchNumber} of ${inv.itemName} expires in ${daysUntilExpiry} days`;
          }

          await db.batchAlert.create({
            data: {
              batchId: batch.id,
              alertType,
              message,
              priorityLevel: priority
            }
          });
        }
      }

      // Check for low stock alerts (existing logic)
      try {
        if (updatedInventory.stockAlertLevel > 0 && updatedInventory.stockQty <= updatedInventory.stockAlertLevel) {
          const createdLow = await db.alertLog.create({
            data: {
              alertType: "low_stock",
              priorityLevel: updatedInventory.stockQty <= 0 ? "high" : "medium",
              message: `Low stock: ${updatedInventory.itemName} (${updatedInventory.barcode}) at ${updatedInventory.warehouseName} — ${updatedInventory.stockQty} <= alert ${updatedInventory.stockAlertLevel}`,
              inventoryId: updatedInventory.id,
              acknowledged: false,
            },
          });

          // Send email notification
          try {
            const setting = await prisma.appSetting.findUnique({ where: { key: "alertEmailRecipients" } });
            const recipients = Array.isArray(setting?.value) ? (setting!.value as any[]).filter((x) => typeof x === 'string') as string[] : [];
            if (recipients.length) {
              await notifyStockAlert(recipients, {
                type: "low_stock",
                priority: createdLow.priorityLevel,
                message: createdLow.message,
                inventory: { itemName: updatedInventory.itemName, barcode: updatedInventory.barcode, warehouseName: updatedInventory.warehouseName },
                createdAt: createdLow.createdAt,
              });
            }
          } catch {}
        }
      } catch {}

      return {
        stockTransaction,
        updatedInventory,
        batch,
        batchTransaction
      };
    });

    return NextResponse.json({ 
      ok: true, 
      transactionId: result.stockTransaction.id,
      batchId: result.batch?.id,
      message: enableBatchTracking ? 
        `Stock received successfully with batch tracking. Batch ID: ${result.batch?.id}` :
        "Stock received successfully"
    });

  } catch (error: any) {
    console.error("Batch-enabled stock receive error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to process stock receive" 
    }, { status: 500 });
  }
}