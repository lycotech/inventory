import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Top 10 unacknowledged alerts by recency
  const alerts = await prisma.alertLog.findMany({
    where: { acknowledged: false },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { inventory: true },
  });

  const active = alerts.map((a: typeof alerts[number]) => ({
    id: a.id,
    type: a.alertType,
    priority: a.priorityLevel,
    inventory: { id: a.inventoryId, itemName: a.inventory.itemName, warehouse: a.inventory.warehouseName },
    message: a.message,
    createdAt: a.createdAt,
  }));

  return NextResponse.json({ active });
}

export const runtime = "nodejs";
