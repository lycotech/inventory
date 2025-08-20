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

  // expiring soon: respect per-item expireDateAlert (days)
  const expiringSoonRow = (await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*) AS c
    FROM Inventory
    WHERE expireDate IS NOT NULL
      AND expireDateAlert > 0
      AND DATEDIFF(expireDate, NOW()) <= expireDateAlert
  `)[0];
  const expiringSoon = Number(expiringSoonRow?.c ?? 0);

  return NextResponse.json({
    items,
    lowStock,
    expiringSoon,
    transactionsToday: txToday,
  });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
