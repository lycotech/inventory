import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Get batches expiring soon or expired
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warningDays = parseInt(searchParams.get('warningDays') || '30');
    const includeExpired = searchParams.get('includeExpired') === 'true';
    const warehouseId = searchParams.get('warehouseId');

    const today = new Date();
    const warningDate = new Date();
    warningDate.setDate(today.getDate() + warningDays);

    // Build where clause
    const where: any = {
      isActive: true,
      quantityRemaining: {
        gt: 0
      }
    };

    if (warehouseId) {
      where.warehouseId = parseInt(warehouseId);
    }

    if (includeExpired) {
      where.expiryDate = {
        lte: warningDate
      };
    } else {
      where.expiryDate = {
        lte: warningDate,
        gte: today
      };
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        inventory: {
          select: {
            itemName: true,
            barcode: true,
            category: true
          }
        },
        warehouse: {
          select: {
            warehouseName: true,
            warehouseCode: true
          }
        }
      },
      orderBy: {
        expiryDate: 'asc'
      }
    });

    // Calculate expiry status for each batch
    const batchesWithStatus = batches.map((batch: any) => {
      const expiryDate = new Date(batch.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let status = 'expiring_soon';
      let priority = 'medium';
      
      if (daysUntilExpiry < 0) {
        status = 'expired';
        priority = 'high';
      } else if (daysUntilExpiry <= 7) {
        status = 'expiring_very_soon';
        priority = 'high';
      } else if (daysUntilExpiry <= 14) {
        priority = 'medium';
      } else {
        priority = 'low';
      }

      return {
        ...batch,
        daysUntilExpiry,
        status,
        priority,
        isExpired: daysUntilExpiry < 0
      };
    });

    // Group by status for summary
    const summary = {
      expired: batchesWithStatus.filter((b: any) => b.isExpired).length,
      expiring_within_7_days: batchesWithStatus.filter((b: any) => b.daysUntilExpiry >= 0 && b.daysUntilExpiry <= 7).length,
      expiring_within_14_days: batchesWithStatus.filter((b: any) => b.daysUntilExpiry > 7 && b.daysUntilExpiry <= 14).length,
      expiring_within_30_days: batchesWithStatus.filter((b: any) => b.daysUntilExpiry > 14 && b.daysUntilExpiry <= 30).length,
      total: batchesWithStatus.length
    };

    return NextResponse.json({
      batches: batchesWithStatus,
      summary
    });

  } catch (error) {
    console.error('Error fetching expiry alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create batch expiry alerts
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { warningDays = 30 } = body;

    const today = new Date();
    const warningDate = new Date();
    warningDate.setDate(today.getDate() + warningDays);

    // Find batches that need alerts
    const batchesNeedingAlerts = await prisma.batch.findMany({
      where: {
        isActive: true,
        quantityRemaining: {
          gt: 0
        },
        expiryDate: {
          lte: warningDate
        }
      },
      include: {
        inventory: {
          select: {
            itemName: true,
            barcode: true
          }
        },
        alertLogs: {
          where: {
            alertType: {
              in: ['expiring_soon', 'expired']
            },
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        }
      }
    });

    const alertsToCreate = [];

    for (const batch of batchesNeedingAlerts) {
      const expiryDate = new Date(batch.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Skip if alert already exists for this batch today
      if (batch.alertLogs.length > 0) {
        continue;
      }

      let alertType: 'expiring_soon' | 'expired';
      let message: string;
      let priority: 'low' | 'medium' | 'high';

      if (daysUntilExpiry < 0) {
        alertType = 'expired';
        message = `Batch ${batch.batchNumber} of ${batch.inventory.itemName} has expired ${Math.abs(daysUntilExpiry)} days ago`;
        priority = 'high';
      } else {
        alertType = 'expiring_soon';
        message = `Batch ${batch.batchNumber} of ${batch.inventory.itemName} expires in ${daysUntilExpiry} days`;
        priority = daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 14 ? 'medium' : 'low';
      }

      alertsToCreate.push({
        batchId: batch.id,
        alertType,
        message,
        priorityLevel: priority
      });
    }

    // Create alerts in batch
    if (alertsToCreate.length > 0) {
      await prisma.batchAlert.createMany({
        data: alertsToCreate
      });
    }

    return NextResponse.json({
      message: `Created ${alertsToCreate.length} batch expiry alerts`,
      alertsCreated: alertsToCreate.length
    });

  } catch (error) {
    console.error('Error creating expiry alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}