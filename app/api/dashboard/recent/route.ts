import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Last 10 transactions with inventory and basic info
  const tx = await prisma.stockTransaction.findMany({
    orderBy: { transactionDate: "desc" },
    take: 10,
    include: { inventory: true },
  });
  const recent = tx.map((t: typeof tx[number]) => ({
    id: t.id,
    itemName: t.inventory.itemName,
    warehouse: t.inventory.warehouseName,
    type: t.transactionType,
    quantity: t.quantity,
    at: t.transactionDate,
    referenceDoc: t.referenceDoc || undefined,
  }));

  return NextResponse.json({ recent });
}

export const runtime = "nodejs";
