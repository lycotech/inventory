import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = String(url.searchParams.get("q") || "").trim();
  const page = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20"), 1), 200);
  const wh = String(url.searchParams.get("warehouse") || "").trim();
  const cat = String(url.searchParams.get("category") || "").trim();
  const status = String(url.searchParams.get("status") || "").trim();

  // Build raw WHERE clause parts safely with parameters
  const whereParts: string[] = [];
  const params: any[] = [];
  if (q) {
    whereParts.push("(i.itemName LIKE ? OR i.barcode LIKE ? OR sa.batchNumber LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (wh) {
    whereParts.push("i.warehouseName = ?");
    params.push(wh);
  }
  if (cat) {
    whereParts.push("i.category = ?");
    params.push(cat);
  }
  if (status) {
    whereParts.push("sa.status = ?");
    params.push(status);
  }
  const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

  const offset = (page - 1) * limit;

  const baseSql = `
    SELECT
      sa.id,
      sa.inventoryId,
      sa.batchNumber,
      sa.receiveDate,
      sa.quantityReceived,
      sa.quantityRemaining,
      TIMESTAMPDIFF(DAY, sa.receiveDate, NOW()) as agingDays,
      sa.status,
      sa.lastMovementDate,
      sa.createdAt,
      sa.updatedAt,
      i.itemName,
      i.barcode,
      i.warehouseName,
      i.category,
      ac.categoryName as agingCategoryName,
      ac.colorCode as agingColor
    FROM StockAging sa
    JOIN Inventory i ON i.id = sa.inventoryId
    LEFT JOIN AgingCategory ac ON ac.id = sa.agingCategoryId
    ${whereSql}
    ORDER BY sa.updatedAt DESC
    LIMIT ? OFFSET ?
  `;

  const countSql = `
    SELECT COUNT(*) as cnt
    FROM StockAging sa
    JOIN Inventory i ON i.id = sa.inventoryId
    ${whereSql}
  `;

  try {
    const rows: any[] = await prisma.$queryRawUnsafe(baseSql, ...params, limit, offset);
    const cnt: any[] = await prisma.$queryRawUnsafe(countSql, ...params);
    const total = Number((cnt[0] && (cnt[0].cnt as any)) || 0);
    return NextResponse.json({ rows, total });
  } catch (e) {
    // If tables are not created yet, return empty
    return NextResponse.json({ rows: [], total: 0 });
  }
}
