import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Top 10 unacknowledged alerts by recency from AlertLog
  const alerts = await prisma.alertLog.findMany({
    where: { acknowledged: false },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { inventory: true },
  });

  const alertLogItems = alerts.map((a: typeof alerts[number]) => ({
    id: a.id,
    type: a.alertType,
    priority: a.priorityLevel,
    inventory: { id: a.inventoryId, itemName: a.inventory.itemName, warehouse: a.inventory.warehouseName },
    message: a.message,
    createdAt: a.createdAt,
    source: 'alert_log'
  }));

  // Get live batch expiry alerts
  const expiringSoonBatches = await prisma.batch.findMany({
    where: {
      expireDateAlert: { gt: 0 },
      isActive: true,
      quantityRemaining: { gt: 0 }
    },
    include: {
      inventory: true,
      warehouse: true
    },
    orderBy: { expiryDate: 'asc' },
    take: 5
  });

  const batchAlerts = expiringSoonBatches
    .map((batch: any) => {
      if (!batch.expiryDate) return null;
      
      const today = new Date();
      const expiryDate = new Date(batch.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= batch.expireDateAlert) {
        const priority = daysUntilExpiry <= 3 ? 'high' : daysUntilExpiry <= 7 ? 'medium' : 'low';
        const message = daysUntilExpiry <= 0 
          ? `Batch ${batch.batchNumber} has expired`
          : `Batch ${batch.batchNumber} expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`;
          
        return {
          id: `batch-${batch.id}`,
          type: 'expiring' as const,
          priority: priority as 'low' | 'medium' | 'high',
          inventory: { 
            id: batch.inventory.id, 
            itemName: batch.inventory.itemName, 
            warehouse: batch.warehouse.warehouseName 
          },
          message,
          createdAt: new Date(),
          source: 'batch_expiry',
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          daysUntilExpiry
        };
      }
      return null;
    })
    .filter(Boolean);

  // Combine and sort all alerts
  const allAlerts = [...alertLogItems, ...batchAlerts]
    .sort((a: any, b: any) => {
      // Prioritize by urgency first, then by date
      const priorityOrder: {[key: string]: number} = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 1;
      const bPriority = priorityOrder[b.priority] || 1;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 10);

  return NextResponse.json({ active: allAlerts });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
