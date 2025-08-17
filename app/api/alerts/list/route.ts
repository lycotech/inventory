import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = String(url.searchParams.get("q") || "").trim();
  const acknowledged = url.searchParams.get("acknowledged"); // 'true' | 'false' | null
  const priority = String(url.searchParams.get("priority") || "").trim(); // low|medium|high
  const type = String(url.searchParams.get("type") || "").trim(); // low_stock|expiring|negative_stock
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20"), 1), 200);
  const page = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
  const order = (String(url.searchParams.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc") as "asc" | "desc";
  const sort = String(url.searchParams.get("sort") || "createdAt").trim(); // createdAt|priority

  const where: any = {};
  if (acknowledged === "true") where.acknowledged = true;
  if (acknowledged === "false") where.acknowledged = false;
  if (priority) where.priorityLevel = priority as any;
  if (type) where.alertType = type as any;
  if (q) {
    where.OR = [
      { message: { contains: q } },
      { inventory: { itemName: { contains: q } } },
      { inventory: { barcode: { contains: q } } },
      { inventory: { warehouseName: { contains: q } } },
    ];
  }

  // Determine ordering
  const orderBy =
    sort === "priority"
      ? [{ priorityLevel: order === "desc" ? "asc" : "desc" }, { createdAt: "desc" as const }] // flip to get high first roughly; tie-breaker by recency
      : [{ createdAt: order }];

  const [rows, total] = await Promise.all([
    prisma.alertLog.findMany({
      where,
      orderBy: orderBy as any,
      include: { inventory: true, acknowledgedUser: true },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.alertLog.count({ where }),
  ]);

  const data = rows.map((a: typeof rows[number]) => ({
    id: a.id,
    type: a.alertType,
    priority: a.priorityLevel,
    message: a.message,
    createdAt: a.createdAt,
    acknowledged: a.acknowledged,
    acknowledgedBy: a.acknowledgedUser?.username || null,
    acknowledgedAt: a.acknowledgedAt || null,
    inventory: {
      id: a.inventoryId,
      itemName: a.inventory.itemName,
      barcode: a.inventory.barcode,
      warehouse: a.inventory.warehouseName,
      stockQty: (a as any).inventory.stockQty ?? null,
      stockAlertLevel: (a as any).inventory.stockAlertLevel ?? null,
      expireDate: (a as any).inventory.expireDate ?? null,
      expireDateAlert: (a as any).inventory.expireDateAlert ?? null,
    },
  }));

  return NextResponse.json({ rows: data, total });
}
