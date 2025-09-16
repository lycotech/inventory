import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const [items, txToday] = await Promise.all([
    prisma.inventory.count(),
    prisma.stockTransaction.count({
      where: { transactionDate: { gte: startOfDay, lt: endOfDay } },
    }),
  ]);

  // low stock: stockQty <= stockAlertLevel and alert level > 0
  const lowStockRow = (await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*) AS c
    FROM Inventory
    WHERE stockAlertLevel > 0 AND stockQty <= stockAlertLevel
  `)[0];
  const lowStock = Number(lowStockRow?.c ?? 0);

  // expiring soon: Check both inventory items and batches
  // First check inventory table for items with expiry dates
  const expiringSoonInventoryRow = (await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*) AS c
    FROM Inventory
    WHERE expireDate IS NOT NULL
      AND expireDateAlert > 0
      AND DATEDIFF(expireDate, NOW()) <= expireDateAlert
  `)[0];
  const expiringSoonInventory = Number(expiringSoonInventoryRow?.c ?? 0);

  // Check batches for expiring items (this is the main source now)
  const expiringSoonBatchesRow = (await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*) AS c
    FROM Batch
    WHERE expiryDate IS NOT NULL
      AND expireDateAlert > 0
      AND DATEDIFF(expiryDate, NOW()) <= expireDateAlert
      AND isActive = 1
      AND quantityRemaining > 0
  `)[0];
  const expiringSoonBatches = Number(expiringSoonBatchesRow?.c ?? 0);

  // Combine both sources
  const expiringSoon = expiringSoonInventory + expiringSoonBatches;

  return NextResponse.json({
    items,
    lowStock,
    expiringSoon,
    transactionsToday: txToday,
  });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
