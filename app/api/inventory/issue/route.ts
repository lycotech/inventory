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
  const { barcode, warehouseName, quantity, referenceDoc, reason } = body as {
    barcode?: string;
    warehouseName?: string;
    quantity?: number;
    referenceDoc?: string;
    reason?: string;
  };
  if (!barcode || !warehouseName || !quantity || !Number.isFinite(quantity)) {
    return NextResponse.json({ error: "barcode, warehouseName and quantity required" }, { status: 400 });
  }
  const inv = await prisma.inventory.findUnique({ where: { barcode_warehouse: { barcode, warehouseName } } });
  if (!inv) return NextResponse.json({ error: "Inventory not found" }, { status: 404 });

  // Read app setting: preventNegativeIssue (default true)
  let preventNegative = true;
  try {
    const s = await prisma.appSetting.findUnique({ where: { key: "preventNegativeIssue" } });
    if (s && typeof s.value === "boolean") preventNegative = s.value as boolean;
  } catch {}

  const absQty = Math.abs(quantity!);
  if (inv.stockQty - absQty < 0) {
    // Create a negative stock alert log regardless
    try {
      const created = await prisma.alertLog.create({
        data: {
          alertType: "negative_stock",
          priorityLevel: "high",
          message: `Attempted to issue ${absQty} but only ${inv.stockQty} available for ${inv.itemName} (${inv.barcode}) at ${inv.warehouseName}`,
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
        quantity: absQty,
        transactionDate: new Date(),
        referenceDoc: referenceDoc || null,
        reason: reason || null,
        processedBy: session.user.id,
      },
    });
    const updated = await db.inventory.update({
      where: { id: inv.id },
      data: { stockQty: { decrement: absQty } },
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

  return NextResponse.json({ ok: true, id: tx.id });
}
