import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const barcode = String(url.searchParams.get("barcode") || "").trim();
  const warehouseName = String(url.searchParams.get("warehouseName") || "").trim();
  if (!barcode || !warehouseName) return NextResponse.json({ error: "barcode and warehouseName required" }, { status: 400 });

  const inv = await prisma.inventory.findUnique({ where: { barcode_warehouse: { barcode, warehouseName } } });
  if (!inv) return NextResponse.json({ found: false });

  return NextResponse.json({
    found: true,
    item: {
      id: inv.id,
      barcode: inv.barcode,
      itemName: inv.itemName,
      warehouse: inv.warehouseName,
      qty: inv.stockQty,
      alert: inv.stockAlertLevel,
      expireDate: inv.expireDate,
    }
  });
}
