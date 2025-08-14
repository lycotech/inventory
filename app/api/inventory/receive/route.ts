import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

  const tx = await prisma.$transaction(async (db: Parameters<typeof prisma.$transaction>[0] extends (arg: infer A) => any ? A : any) => {
    const t = await db.stockTransaction.create({
      data: {
        inventoryId: inv.id,
        transactionType: "receive",
        quantity: Math.abs(quantity!),
        transactionDate: new Date(),
        referenceDoc: referenceDoc || null,
        reason: reason || null,
        processedBy: session.user.id,
      },
    });
    await db.inventory.update({
      where: { id: inv.id },
      data: { stockQty: { increment: Math.abs(quantity!) } },
    });
    return t;
  });

  return NextResponse.json({ ok: true, id: tx.id });
}
