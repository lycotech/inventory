import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyStockAlert } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const body = await req.json().catch(() => ({}));
  const { 
    barcode, 
    fromWarehouse, 
    toWarehouse, 
    quantity, 
    referenceDoc, 
    reason 
  } = body as {
    barcode?: string;
    fromWarehouse?: string;
    toWarehouse?: string;
    quantity?: number;
    referenceDoc?: string;
    reason?: string;
  };

  if (!barcode || !fromWarehouse || !toWarehouse || !quantity || !Number.isFinite(quantity)) {
    return NextResponse.json({ 
      error: "barcode, fromWarehouse, toWarehouse and quantity required" 
    }, { status: 400 });
  }

  if (fromWarehouse === toWarehouse) {
    return NextResponse.json({ 
      error: "Source and destination warehouses must be different" 
    }, { status: 400 });
  }

  const absQty = Math.abs(quantity);

  try {
    const result = await prisma.$transaction(async (db: Parameters<typeof prisma.$transaction>[0] extends (arg: infer A) => any ? A : any) => {
      // Find source inventory
      const sourceInv = await db.inventory.findUnique({ 
        where: { barcode_warehouse: { barcode, warehouseName: fromWarehouse } } 
      });
      
      if (!sourceInv) {
        throw new Error(`Item ${barcode} not found in ${fromWarehouse} warehouse`);
      }

      // Check if sufficient stock available
      if (sourceInv.stockQty < absQty) {
        throw new Error(`Insufficient stock. Available: ${sourceInv.stockQty}, Requested: ${absQty}`);
      }

      // Find or create destination inventory
      let destInv = await db.inventory.findUnique({
        where: { barcode_warehouse: { barcode, warehouseName: toWarehouse } }
      });

      if (!destInv) {
        // Create new inventory record for destination warehouse
        destInv = await db.inventory.create({
          data: {
            barcode: sourceInv.barcode,
            category: sourceInv.category,
            itemName: sourceInv.itemName,
            searchCode: sourceInv.searchCode,
            warehouseName: toWarehouse,
            stockQty: 0,
            stockAlertLevel: sourceInv.stockAlertLevel,
            expireDate: sourceInv.expireDate,
            expireDateAlert: sourceInv.expireDateAlert,
            createdBy: session.user.id,
          },
        });
      }

      // Get warehouse IDs for transaction record
      const fromWarehouseRecord = await db.warehouse.findFirst({
        where: { warehouseName: fromWarehouse }
      });
      const toWarehouseRecord = await db.warehouse.findFirst({
        where: { warehouseName: toWarehouse }
      });

      // Create transfer transaction record
      const transferTx = await db.stockTransaction.create({
        data: {
          inventoryId: sourceInv.id,
          transactionType: "transfer",
          quantity: absQty,
          transactionDate: new Date(),
          referenceDoc: referenceDoc || null,
          reason: reason || `Transfer from ${fromWarehouse} to ${toWarehouse}`,
          processedBy: session.user.id,
          fromWarehouseId: fromWarehouseRecord?.id,
          toWarehouseId: toWarehouseRecord?.id,
        },
      });

      // Update source warehouse stock (decrease)
      const updatedSource = await db.inventory.update({
        where: { id: sourceInv.id },
        data: { stockQty: { decrement: absQty } },
      });

      // Update destination warehouse stock (increase)
      const updatedDest = await db.inventory.update({
        where: { id: destInv.id },
        data: { stockQty: { increment: absQty } },
      });

      // Check for low stock alerts on source warehouse
      if (updatedSource.stockAlertLevel > 0 && updatedSource.stockQty <= updatedSource.stockAlertLevel) {
        const alertExists = await db.alertLog.findFirst({
          where: {
            alertType: "low_stock",
            inventoryId: updatedSource.id,
            acknowledged: false,
          },
        });

        if (!alertExists) {
          await db.alertLog.create({
            data: {
              alertType: "low_stock",
              priorityLevel: updatedSource.stockQty <= 0 ? "high" : "medium",
              message: `Low stock after transfer: ${updatedSource.itemName} (${updatedSource.barcode}) at ${updatedSource.warehouseName} — ${updatedSource.stockQty} <= alert ${updatedSource.stockAlertLevel}`,
              inventoryId: updatedSource.id,
            },
          });

          // Send email notification
          try {
            const setting = await db.appSetting.findUnique({ where: { key: "alertEmailRecipients" } });
            const recipients = Array.isArray(setting?.value) ? (setting.value as string[]) : [];
            if (recipients.length) {
              await notifyStockAlert(recipients, {
                type: "low_stock",
                priority: updatedSource.stockQty <= 0 ? "high" : "medium",
                message: `Low stock after transfer: ${updatedSource.itemName} (${updatedSource.barcode}) at ${updatedSource.warehouseName} — ${updatedSource.stockQty} <= alert ${updatedSource.stockAlertLevel}`,
                inventory: {
                  itemName: updatedSource.itemName,
                  barcode: updatedSource.barcode,
                  warehouseName: updatedSource.warehouseName,
                },
                createdAt: new Date(),
              });
            }
          } catch (emailError) {
            console.error("Email notification failed:", emailError);
          }
        }
      }

      return {
        transferTx,
        sourceInventory: updatedSource,
        destinationInventory: updatedDest,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${absQty} units of ${result.sourceInventory.itemName} from ${fromWarehouse} to ${toWarehouse}`,
      transaction: result.transferTx,
      sourceStock: result.sourceInventory.stockQty,
      destinationStock: result.destinationInventory.stockQty,
    });

  } catch (error: any) {
    console.error("Warehouse transfer error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to process warehouse transfer" 
    }, { status: 500 });
  }
}
