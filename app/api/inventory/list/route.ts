import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = String(url.searchParams.get("q") || "").trim();
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50"), 1), 200);
  const page = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
  const sort = String(url.searchParams.get("sort") || "updatedAt");
  const order = (String(url.searchParams.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc") as "asc" | "desc";

  const warehouse = String(url.searchParams.get("warehouse") || "").trim();
  const category = String(url.searchParams.get("category") || "").trim();
  const where: any = {};
  if (q) {
    where.OR = [
      { itemName: { contains: q } },
      { barcode: { contains: q } },
      { category: { contains: q } },
      { warehouseName: { contains: q } },
    ];
  }
  if (warehouse) where.warehouseName = warehouse;
  if (category) where.category = category;

  // Allow sorting by a safe whitelist
  const sortField = ["updatedAt", "itemName", "barcode", "warehouseName", "stockQty"].includes(sort)
    ? (sort as any)
    : ("updatedAt" as const);

  const [items, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      orderBy: { [sortField]: order },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.inventory.count({ where }),
  ]);

  const rows = items.map((it: typeof items[number]) => ({
    id: it.id,
    barcode: it.barcode,
    itemName: it.itemName,
    warehouse: it.warehouseName,
    qty: it.stockQty,
    alert: it.stockAlertLevel,
    expireDate: it.expireDate,
  }));

  return NextResponse.json({ rows, total });
}
