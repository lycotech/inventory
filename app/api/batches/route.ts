import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - List all batches with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const warehouseId = searchParams.get('warehouseId');
    const inventoryId = searchParams.get('inventoryId');
    const expiringDays = searchParams.get('expiringDays');
    const expired = searchParams.get('expired') === 'true';
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (activeOnly) {
      where.isActive = true;
    }

    if (warehouseId) {
      where.warehouseId = parseInt(warehouseId);
    }

    if (inventoryId) {
      where.inventoryId = parseInt(inventoryId);
    }

    if (expired) {
      where.expiryDate = {
        lt: new Date()
      };
    } else if (expiringDays) {
      const days = parseInt(expiringDays);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      where.expiryDate = {
        lte: futureDate,
        gte: new Date()
      };
    }

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
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
          },
          creator: {
            select: {
              username: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: [
          { expiryDate: 'asc' },
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.batch.count({ where })
    ]);

    return NextResponse.json({
      batches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new batch
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      batchNumber,
      inventoryId,
      warehouseId,
      quantityReceived,
      manufactureDate,
      expiryDate,
      expireDateAlert,
      supplierInfo,
      lotNumber,
      costPerUnit,
      notes
    } = body;

    // Validate required fields
    if (!batchNumber || !inventoryId || !warehouseId || !quantityReceived || !expiryDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if batch number is unique
    const existingBatch = await prisma.batch.findUnique({
      where: { batchNumber }
    });

    if (existingBatch) {
      return NextResponse.json(
        { error: 'Batch number already exists' },
        { status: 400 }
      );
    }

    // Verify inventory and warehouse exist
    const [inventory, warehouse] = await Promise.all([
      prisma.inventory.findUnique({ where: { id: inventoryId } }),
      prisma.warehouse.findUnique({ where: { id: warehouseId } })
    ]);

    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Create batch
    const batch = await prisma.batch.create({
      data: {
        batchNumber,
        inventoryId,
        warehouseId,
        quantityReceived,
        quantityRemaining: quantityReceived,
        manufactureDate: manufactureDate ? new Date(manufactureDate) : null,
        expiryDate: new Date(expiryDate),
        expireDateAlert: expireDateAlert || 30,
        supplierInfo,
        lotNumber,
        costPerUnit: costPerUnit ? parseFloat(costPerUnit) : null,
        notes,
        createdBy: session.user.id
      },
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
      }
    });

    // Create initial batch transaction for receiving
    await prisma.batchTransaction.create({
      data: {
        batchId: batch.id,
        transactionType: 'receive',
        quantity: quantityReceived,
        transactionDate: new Date(),
        reason: 'Initial batch creation',
        processedBy: session.user.id
      }
    });

    return NextResponse.json(batch, { status: 201 });

  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}