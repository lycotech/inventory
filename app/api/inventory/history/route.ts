import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = String(url.searchParams.get("q") || "").trim();
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50"), 1), 200);

  const where = q
    ? {
        OR: [
          { inventory: { itemName: { contains: q } } },
          { inventory: { barcode: { contains: q } } },
          { referenceDoc: { contains: q } },
          { reason: { contains: q } },
        ],
      }
    : {};

  const tx = await prisma.stockTransaction.findMany({
    where,
    orderBy: { transactionDate: "desc" },
    take: limit,
    include: { inventory: true, processor: true },
  });

  const rows = tx.map((t: typeof tx[number]) => ({
    id: t.id,
    at: t.transactionDate,
    type: t.transactionType,
    barcode: t.inventory.barcode,
    itemName: t.inventory.itemName,
    warehouse: t.inventory.warehouseName,
    quantity: t.quantity,
    unit: t.inventory.unit,
    baseUnit: t.inventory.baseUnit,
    conversionFactor: t.inventory.conversionFactor,
    referenceDoc: t.referenceDoc || undefined,
    reason: t.reason || undefined,
    by: t.processor.username,
  }));

  return NextResponse.json({ rows });
}
