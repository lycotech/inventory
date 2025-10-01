import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Get specific batch by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const batchId = parseInt(resolvedParams.id);
    if (isNaN(batchId)) {
      return NextResponse.json({ error: 'Invalid batch ID' }, { status: 400 });
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        inventory: {
          select: {
            itemName: true,
            barcode: true,
            category: true,
            stockQty: true,
            warehouseName: true
          }
        },
        warehouse: {
          select: {
            warehouseName: true,
            warehouseCode: true,
            location: true
          }
        },
        creator: {
          select: {
            username: true,
            firstName: true,
            lastName: true
          }
        },
        transactions: {
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
          },
          orderBy: { createdAt: 'desc' }
        },
        alertLogs: {
          include: {
            acknowledgedUser: {
              select: {
                username: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Calculate days until expiry
    const today = new Date();
    const expiryDate = new Date(batch.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      ...batch,
      daysUntilExpiry,
      isExpired: daysUntilExpiry < 0,
      isExpiringSoon: daysUntilExpiry <= 30 && daysUntilExpiry >= 0
    });

  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update batch
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const batchId = parseInt(resolvedParams.id);
    if (isNaN(batchId)) {
      return NextResponse.json({ error: 'Invalid batch ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      batchNumber,
      quantityReceived,
      quantityRemaining,
      manufactureDate,
      expiryDate,
      supplierInfo,
      lotNumber,
      costPerUnit,
      notes,
      isActive
    } = body;

    // Check if batch exists
    const existingBatch = await prisma.batch.findUnique({
      where: { id: batchId }
    });

    if (!existingBatch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Check batch number uniqueness if it's being changed
    if (batchNumber && batchNumber !== existingBatch.batchNumber) {
      const batchWithSameNumber = await prisma.batch.findUnique({
        where: { batchNumber }
      });

      if (batchWithSameNumber) {
        return NextResponse.json(
          { error: 'Batch number already exists' },
          { status: 400 }
        );
      }
    }

    // Update batch
    const updatedBatch = await prisma.batch.update({
      where: { id: batchId },
      data: {
        ...(batchNumber && { batchNumber }),
        ...(quantityReceived !== undefined && { quantityReceived: parseFloat(quantityReceived) }),
        ...(quantityRemaining !== undefined && { quantityRemaining: parseFloat(quantityRemaining) }),
        ...(manufactureDate !== undefined && { 
          manufactureDate: manufactureDate ? new Date(manufactureDate) : null 
        }),
        ...(expiryDate && { expiryDate: new Date(expiryDate) }),
        ...(supplierInfo !== undefined && { supplierInfo }),
        ...(lotNumber !== undefined && { lotNumber }),
        ...(costPerUnit !== undefined && { 
          costPerUnit: costPerUnit ? parseFloat(costPerUnit) : null 
        }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive })
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

    return NextResponse.json(updatedBatch);

  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete batch (mark as inactive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const batchId = parseInt(resolvedParams.id);
    if (isNaN(batchId)) {
      return NextResponse.json({ error: 'Invalid batch ID' }, { status: 400 });
    }

    // Check if batch exists
    const existingBatch = await prisma.batch.findUnique({
      where: { id: batchId }
    });

    if (!existingBatch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Soft delete by marking as inactive
    await prisma.batch.update({
      where: { id: batchId },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Batch deactivated successfully' });

  } catch (error) {
    console.error('Error deactivating batch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}