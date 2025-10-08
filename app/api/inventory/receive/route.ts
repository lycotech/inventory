import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, decimalCompare } from "@/lib/decimal-utils";
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
  const { barcode, warehouseName, quantity, inputUnit, referenceDoc, reason, allowNonCentral } = body as {
    barcode?: string;
    warehouseName?: string;
    quantity?: number;
    inputUnit?: string;
    referenceDoc?: string;
    reason?: string;
    allowNonCentral?: boolean; // For admin override
  };
  if (!barcode || !warehouseName || !quantity || !Number.isFinite(quantity)) {
    return NextResponse.json({ error: "barcode, warehouseName and quantity required" }, { status: 400 });
  }

  try {
    // Check if target warehouse is central warehouse
    const targetWarehouse = await prisma.warehouse.findFirst({
      where: { warehouseName, isActive: true }
    });

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

    const inv = await prisma.inventory.findUnique({ where: { barcode_warehouse: { barcode, warehouseName } } });
    if (!inv) return NextResponse.json({ error: "Inventory not found" }, { status: 404 });

    // Handle unit conversion if needed
    let finalQuantity = Math.abs(quantity!);
    if (inputUnit && inputUnit !== inv.unit) {
      try {
        const { convertQuantity } = await import('@/lib/units');
        finalQuantity = convertQuantity(Math.abs(quantity!), inputUnit as any, inv.unit as any);
      } catch (error) {
        // Try using the item's conversion factor
        if (inputUnit === inv.baseUnit && inv.conversionFactor) {
          finalQuantity = Math.round(Math.abs(quantity!) / Number(inv.conversionFactor));
        } else if (inv.unit === inv.baseUnit && inv.conversionFactor) {
          finalQuantity = Math.round(Math.abs(quantity!) * Number(inv.conversionFactor));
        } else {
          return NextResponse.json({ 
            error: `Cannot convert from ${inputUnit} to ${inv.unit}. Please use ${inv.unit} or provide valid conversion.` 
          }, { status: 400 });
        }
      }
    }

    const tx = await prisma.$transaction(async (db: Parameters<typeof prisma.$transaction>[0] extends (arg: infer A) => any ? A : any) => {
    const t = await db.stockTransaction.create({
      data: {
        inventoryId: inv.id,
        transactionType: "receive",
        quantity: finalQuantity,
        transactionDate: new Date(),
        referenceDoc: referenceDoc || null,
        reason: reason || null,
        processedBy: session.user.id,
      },
    });
    const updated = await db.inventory.update({
      where: { id: inv.id },
      data: { stockQty: { increment: finalQuantity } },
    });
    // If after receiving it's still below threshold, ensure a low stock alert exists and notify
    try {
      if (decimalToNumber(updated.stockAlertLevel) > 0 && decimalCompare(updated.stockQty, updated.stockAlertLevel).isLessOrEqual) {
        const createdLow = await db.alertLog.create({
          data: {
            alertType: "low_stock",
            priorityLevel: decimalCompare(updated.stockQty, 0).isLessOrEqual ? "high" : "medium",
            message: `Low stock: ${updated.itemName} (${updated.barcode}) at ${updated.warehouseName} — ${updated.stockQty} <= alert ${updated.stockAlertLevel}`,
            inventoryId: updated.id,
            acknowledged: false,
          },
        });
        try {
          const setting = await prisma.appSetting.findUnique({ where: { key: "alertEmailRecipients" } });
          const recipients = Array.isArray(setting?.value) ? (setting!.value as any[]).filter((x) => typeof x === 'string') as string[] : [];
          if (recipients.length) {
            await notifyStockAlert(recipients, {
              type: "low_stock",
              priority: createdLow.priorityLevel,
              message: createdLow.message,
              inventory: { itemName: updated.itemName, barcode: updated.barcode, warehouseName: updated.warehouseName },
              createdAt: createdLow.createdAt,
            });
          }
        } catch {}
      }
    } catch {}
    return t;
    });

    const conversionMessage = inputUnit && inputUnit !== inv.unit 
      ? ` (converted from ${quantity} ${inputUnit} to ${finalQuantity} ${inv.unit})`
      : '';
    
    return NextResponse.json({ 
      ok: true, 
      id: tx.id, 
      message: `Successfully received ${finalQuantity} ${inv.unit}${conversionMessage}` 
    });
  } catch (error: any) {
    console.error("Stock receive error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to process stock receive" 
    }, { status: 500 });
  }
}
