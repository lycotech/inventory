import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ActiveAlert = {
  type: "low_stock" | "expiring" | "negative_stock";
  priority: "low" | "medium" | "high";
  message: string;
  createdAt: string | null;
  inventory: {
    id: number;
    itemName: string;
    barcode: string;
    warehouse: string;
    stockQty: number;
    stockAlertLevel?: number | null;
    expireDate?: string | null;
    expireDateAlert?: number | null;
  };
};

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Low stock (computed live)
  const lowRows = await prisma.$queryRaw<any[]>`
    SELECT id, itemName, barcode, warehouseName, stockQty, stockAlertLevel, expireDate, expireDateAlert
    FROM Inventory
    WHERE stockAlertLevel > 0 AND stockQty <= stockAlertLevel
  `;

  // Expiring soon (computed live) - from Inventory table
  const expRows = await prisma.$queryRaw<any[]>`
    SELECT id, itemName, barcode, warehouseName, stockQty, stockAlertLevel, expireDate, expireDateAlert,
           DATEDIFF(expireDate, NOW()) AS daysLeft
    FROM Inventory
    WHERE expireDate IS NOT NULL
      AND expireDateAlert > 0
      AND DATEDIFF(expireDate, NOW()) <= expireDateAlert
  `;

  // Expiring soon (computed live) - from Batch table
  const expBatchRows = await prisma.$queryRaw<any[]>`
    SELECT 
      b.id as batchId,
      b.batchNumber,
      b.expiryDate,
      b.expireDateAlert,
      b.quantityRemaining,
      i.id,
      i.itemName,
      i.barcode,
      w.warehouseName,
      i.stockQty,
      i.stockAlertLevel,
      DATEDIFF(b.expiryDate, NOW()) AS daysLeft
    FROM Batch b
    JOIN Inventory i ON b.inventoryId = i.id
    JOIN Warehouse w ON b.warehouseId = w.id
    WHERE b.expiryDate IS NOT NULL
      AND b.expireDateAlert > 0
      AND b.isActive = true
      AND b.quantityRemaining > 0
      AND DATEDIFF(b.expiryDate, NOW()) <= b.expireDateAlert
  `;

  // Negative stock (computed live)
  const negRows = await prisma.$queryRaw<any[]>`
    SELECT id, itemName, barcode, warehouseName, stockQty, stockAlertLevel, expireDate, expireDateAlert
    FROM Inventory
    WHERE stockQty < 0
  `;

  const lowStock: ActiveAlert[] = lowRows.map((r: any) => ({
    type: "low_stock",
    // High priority whenever current qty is at or below the configured alert level
    priority: Number(r.stockQty) <= Number(r.stockAlertLevel) ? "high" : "medium",
    message: `Low stock: ${r.itemName} (${r.barcode}) at ${r.warehouseName} — ${Number(r.stockQty)} <= alert ${Number(r.stockAlertLevel)}`,
    createdAt: null,
    inventory: {
      id: Number(r.id),
      itemName: r.itemName,
      barcode: r.barcode,
      warehouse: r.warehouseName,
      stockQty: Number(r.stockQty),
      stockAlertLevel: Number(r.stockAlertLevel),
      expireDate: r.expireDate ? new Date(r.expireDate).toISOString() : null,
      expireDateAlert: r.expireDateAlert != null ? Number(r.expireDateAlert) : null,
    },
  }));

  const expiring: ActiveAlert[] = [
    // Inventory items expiring
    ...expRows.map((r: any) => {
      const daysLeft = Number(r.daysLeft);
      return {
        type: "expiring",
        priority: daysLeft <= 0 ? "high" : "medium",
        message: `Expiring ${daysLeft <= 0 ? "(expired)" : `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}: ${r.itemName} (${r.barcode}) at ${r.warehouseName}`,
        createdAt: null,
        inventory: {
          id: Number(r.id),
          itemName: r.itemName,
          barcode: r.barcode,
          warehouse: r.warehouseName,
          stockQty: Number(r.stockQty),
          stockAlertLevel: Number(r.stockAlertLevel),
          expireDate: r.expireDate ? new Date(r.expireDate).toISOString() : null,
          expireDateAlert: r.expireDateAlert != null ? Number(r.expireDateAlert) : null,
        },
      } as ActiveAlert;
    }),
    // Batch items expiring
    ...expBatchRows.map((r: any) => {
      const daysLeft = Number(r.daysLeft);
      return {
        type: "expiring",
        priority: daysLeft <= 0 ? "high" : "medium",
        message: `Batch ${r.batchNumber} expiring ${daysLeft <= 0 ? "(expired)" : `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}: ${r.itemName} (${r.barcode}) at ${r.warehouseName} - ${r.quantityRemaining} units remaining`,
        createdAt: null,
        inventory: {
          id: Number(r.id),
          itemName: r.itemName,
          barcode: r.barcode,
          warehouse: r.warehouseName,
          stockQty: Number(r.stockQty),
          stockAlertLevel: Number(r.stockAlertLevel),
          expireDate: r.expiryDate ? new Date(r.expiryDate).toISOString() : null,
          expireDateAlert: r.expireDateAlert != null ? Number(r.expireDateAlert) : null,
        },
      } as ActiveAlert;
    })
  ];

  const negative: ActiveAlert[] = negRows.map((r: any) => ({
    type: "negative_stock",
    priority: "high",
    message: `Negative stock: ${r.itemName} (${r.barcode}) at ${r.warehouseName} — qty ${Number(r.stockQty)}`,
    createdAt: null,
    inventory: {
      id: Number(r.id),
      itemName: r.itemName,
      barcode: r.barcode,
      warehouse: r.warehouseName,
      stockQty: Number(r.stockQty),
      stockAlertLevel: Number(r.stockAlertLevel),
      expireDate: r.expireDate ? new Date(r.expireDate).toISOString() : null,
      expireDateAlert: r.expireDateAlert != null ? Number(r.expireDateAlert) : null,
    },
  }));

  const rows: ActiveAlert[] = [...lowStock, ...expiring, ...negative];
  return NextResponse.json({
    rows,
    counts: {
      lowStock: lowStock.length,
      expiring: expiring.length,
      negative: negative.length,
    },
  });
}
