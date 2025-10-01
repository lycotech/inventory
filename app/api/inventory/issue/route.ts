import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyStockAlert } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  // Role-based access control: only admin and manager can issue stock
  if (session.user.role === "user") {
    return NextResponse.json({ error: "Forbidden: Admin or Manager access required" }, { status: 403 });
  }
  
  const body = await req.json().catch(() => ({}));
  const { barcode, warehouseName, quantity, inputUnit, referenceDoc, reason } = body as {
    barcode?: string;
    warehouseName?: string;
    quantity?: number;
    inputUnit?: string;
    referenceDoc?: string;
    reason?: string;
  };
  if (!barcode || !warehouseName || !quantity || !Number.isFinite(quantity)) {
    return NextResponse.json({ error: "barcode, warehouseName and quantity required" }, { status: 400 });
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

  // Read app setting: preventNegativeIssue (default true)
  let preventNegative = true;
  try {
    const s = await prisma.appSetting.findUnique({ where: { key: "preventNegativeIssue" } });
    if (s && typeof s.value === "boolean") preventNegative = s.value as boolean;
  } catch {}

  if (inv.stockQty - finalQuantity < 0) {
    // Create a negative stock alert log regardless
    try {
      const created = await prisma.alertLog.create({
        data: {
          alertType: "negative_stock",
          priorityLevel: "high",
          message: `Attempted to issue ${finalQuantity} ${inv.unit} but only ${inv.stockQty} ${inv.unit} available for ${inv.itemName} (${inv.barcode}) at ${inv.warehouseName}`,
          inventoryId: inv.id,
          acknowledged: false,
        },
      });
      // Email notify
      try {
        const setting = await prisma.appSetting.findUnique({ where: { key: "alertEmailRecipients" } });
        const recipients = Array.isArray(setting?.value) ? (setting!.value as any[]).filter((x) => typeof x === 'string') as string[] : [];
        if (recipients.length) {
          await notifyStockAlert(recipients, {
            type: "negative_stock",
            priority: "high",
            message: created.message,
            inventory: { itemName: inv.itemName, barcode: inv.barcode, warehouseName: inv.warehouseName },
            createdAt: created.createdAt,
          });
        }
      } catch {}
    } catch {}
    if (preventNegative) {
      return NextResponse.json({ error: "Issuing this quantity would result in negative stock. Reduce the quantity." }, { status: 400 });
    }
    // else: proceed with issuing (will make stock negative)
  }

  const tx = await prisma.$transaction(async (db: Parameters<typeof prisma.$transaction>[0] extends (arg: infer A) => any ? A : any) => {
    const t = await db.stockTransaction.create({
      data: {
        inventoryId: inv.id,
        transactionType: "issue",
        quantity: finalQuantity,
        transactionDate: new Date(),
        referenceDoc: referenceDoc || null,
        reason: reason || null,
        processedBy: session.user.id,
      },
    });
    const updated = await db.inventory.update({
      where: { id: inv.id },
      data: { stockQty: { decrement: finalQuantity } },
    });
    // Low stock alert if we crossed threshold after issuing
    try {
      if (updated.stockAlertLevel > 0 && updated.stockQty <= updated.stockAlertLevel) {
        const createdLow = await db.alertLog.create({
          data: {
            alertType: "low_stock",
            priorityLevel: updated.stockQty <= 0 ? "high" : "medium",
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
    message: `Successfully issued ${finalQuantity} ${inv.unit}${conversionMessage}` 
  });
}
