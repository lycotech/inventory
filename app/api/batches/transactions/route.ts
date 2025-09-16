import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST - Create batch transaction (issue, adjust, transfer)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      batchId,
      transactionType,
      quantity,
      reason,
      referenceDoc,
      fromWarehouseId,
      toWarehouseId
    } = body;

    // Validate required fields
    if (!batchId || !transactionType || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: batchId, transactionType, quantity' },
        { status: 400 }
      );
    }

    // Get the batch
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        inventory: true,
        warehouse: true
      }
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    if (!batch.isActive) {
      return NextResponse.json(
        { error: 'Cannot transact on inactive batch' },
        { status: 400 }
      );
    }

    // Validate quantity for outgoing transactions
    if (['issue', 'transfer', 'stock_out'].includes(transactionType)) {
      if (quantity > batch.quantityRemaining) {
        return NextResponse.json(
          { error: `Insufficient quantity in batch. Available: ${batch.quantityRemaining}` },
          { status: 400 }
        );
      }
    }

    // Validate warehouse for transfers
    if (transactionType === 'transfer') {
      if (!fromWarehouseId || !toWarehouseId) {
        return NextResponse.json(
          { error: 'Transfer requires both fromWarehouseId and toWarehouseId' },
          { status: 400 }
        );
      }

      if (fromWarehouseId === toWarehouseId) {
        return NextResponse.json(
          { error: 'Cannot transfer to the same warehouse' },
          { status: 400 }
        );
      }

      // Verify warehouses exist
      const [fromWarehouse, toWarehouse] = await Promise.all([
        prisma.warehouse.findUnique({ where: { id: fromWarehouseId } }),
        prisma.warehouse.findUnique({ where: { id: toWarehouseId } })
      ]);

      if (!fromWarehouse || !toWarehouse) {
        return NextResponse.json(
          { error: 'One or both warehouses not found' },
          { status: 404 }
        );
      }
    }

    // Calculate new quantity
    let newQuantity = batch.quantityRemaining;
    switch (transactionType) {
      case 'receive':
        newQuantity += quantity;
        break;
      case 'issue':
      case 'transfer':
      case 'stock_out':
        newQuantity -= quantity;
        break;
      case 'adjustment':
        // For adjustments, quantity can be positive or negative
        newQuantity = quantity;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid transaction type' },
          { status: 400 }
        );
    }

    if (newQuantity < 0) {
      return NextResponse.json(
        { error: 'Transaction would result in negative quantity' },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create batch transaction
      const batchTransaction = await tx.batchTransaction.create({
        data: {
          batchId,
          transactionType,
          quantity,
          transactionDate: new Date(),
          reason,
          referenceDoc,
          fromWarehouseId,
          toWarehouseId,
          processedBy: session.user.id
        },
        include: {
          processor: {
            select: {
              username: true,
              firstName: true,
              lastName: true
            }
          },
          fromWarehouse: {
            select: {
              warehouseName: true,
              warehouseCode: true
            }
          },
          toWarehouse: {
            select: {
              warehouseName: true,
              warehouseCode: true
            }
          }
        }
      });

      // Update batch quantity
      const updatedBatch = await tx.batch.update({
        where: { id: batchId },
        data: { quantityRemaining: newQuantity }
      });

      // For transfers, create new batch in destination warehouse
      if (transactionType === 'transfer' && toWarehouseId) {
        const newBatchNumber = `${batch.batchNumber}-T${Date.now()}`;
        
        const newBatch = await tx.batch.create({
          data: {
            batchNumber: newBatchNumber,
            inventoryId: batch.inventoryId,
            warehouseId: toWarehouseId,
            quantityReceived: quantity,
            quantityRemaining: quantity,
            manufactureDate: batch.manufactureDate,
            expiryDate: batch.expiryDate,
            supplierInfo: batch.supplierInfo,
            lotNumber: batch.lotNumber,
            costPerUnit: batch.costPerUnit,
            notes: `Transferred from batch ${batch.batchNumber}`,
            createdBy: session.user.id
          }
        });

        // Create receive transaction for new batch
        await tx.batchTransaction.create({
          data: {
            batchId: newBatch.id,
            transactionType: 'receive',
            quantity: quantity,
            transactionDate: new Date(),
            reason: `Transfer from batch ${batch.batchNumber}`,
            referenceDoc,
            fromWarehouseId,
            processedBy: session.user.id
          }
        });

        return { batchTransaction, updatedBatch, newBatch };
      }

      return { batchTransaction, updatedBatch };
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Error creating batch transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get batch transactions history
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const offset = (page - 1) * limit;

    const where: any = {};
    if (batchId) {
      where.batchId = parseInt(batchId);
    }

    const [transactions, total] = await Promise.all([
      prisma.batchTransaction.findMany({
        where,
        include: {
          batch: {
            select: {
              batchNumber: true,
              inventory: {
                select: {
                  itemName: true,
                  barcode: true
                }
              }
            }
          },
          processor: {
            select: {
              username: true,
              firstName: true,
              lastName: true
            }
          },
          fromWarehouse: {
            select: {
              warehouseName: true,
              warehouseCode: true
            }
          },
          toWarehouse: {
            select: {
              warehouseName: true,
              warehouseCode: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.batchTransaction.count({ where })
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching batch transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}