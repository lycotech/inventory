import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { decimalToNumber, decimalCompare } from "@/lib/decimal-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  
  // Only allow admin users to reset stock
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { confirm, reason } = body;
    
    // Require explicit confirmation
    if (!confirm || confirm !== "RESET_ALL_STOCK") {
      return NextResponse.json({ 
        error: "Confirmation required. Set confirm: 'RESET_ALL_STOCK' to proceed." 
      }, { status: 400 });
    }
    
    // Get all inventory items with non-zero quantities (both positive and negative)
    const inventoryItems = await prisma.inventory.findMany({
      where: { stockQty: { not: 0 } },
      select: {
        id: true,
        barcode: true,
        itemName: true,
        warehouseName: true,
        stockQty: true
      }
    });
    
    if (inventoryItems.length === 0) {
      return NextResponse.json({ 
        message: "No items found with non-zero quantities",
        resetCount: 0,
        transactionCount: 0
      });
    }
    
    let resetCount = 0;
    let transactionCount = 0;
    const resetItems: Array<{
      id: number;
      barcode: string;
      itemName: string;
      warehouseName: string;
      previousQty: number;
      newQty: number;
    }> = [];
    
    // Process in batches of 100 to avoid transaction timeouts
    const BATCH_SIZE = 100;
    const totalBatches = Math.ceil(inventoryItems.length / BATCH_SIZE);
    
    console.log(`Processing ${inventoryItems.length} items in ${totalBatches} batches of ${BATCH_SIZE}...`);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, inventoryItems.length);
      const batchItems = inventoryItems.slice(start, end);
      
      console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (items ${start + 1}-${end})...`);
      
      // Process each batch in a separate transaction
      await prisma.$transaction(async (tx) => {
        for (const item of batchItems) {
          const currentQty = item.stockQty;
          
          // Create audit transaction with appropriate reason
          const qtyComparison = decimalCompare(currentQty, 0);
          const adjustmentReason = qtyComparison.isGreater
            ? `${reason || 'Stock quantity reset to zero'} - Positive stock adjustment`
            : qtyComparison.isLess
            ? `${reason || 'Stock quantity reset to zero'} - Negative stock correction`
            : `${reason || 'Stock quantity reset to zero'} - Administrative adjustment`;
            
          await tx.stockTransaction.create({
            data: {
              inventoryId: item.id,
              transactionType: 'adjustment',
              quantity: -currentQty,
              transactionDate: new Date(),
              referenceDoc: `RESET-${new Date().toISOString().slice(0, 10)}-B${batchIndex + 1}`,
              reason: adjustmentReason,
              processedBy: session.user.id
            }
          });
          
          // Reset quantity to zero
          await tx.inventory.update({
            where: { id: item.id },
            data: { stockQty: 0 }
          });
          
          if (resetItems.length < 10) {
            // Only keep first 10 for display
            resetItems.push({
              id: item.id,
              barcode: item.barcode,
              itemName: item.itemName,
              warehouseName: item.warehouseName,
              previousQty: decimalToNumber(currentQty),
              newQty: 0
            });
          }
          
          resetCount++;
          transactionCount++;
        }
      }, {
        maxWait: 10000, // 10 seconds max wait to start transaction
        timeout: 60000, // 60 seconds transaction timeout
      });
      
      console.log(`Batch ${batchIndex + 1}/${totalBatches} completed. Progress: ${resetCount}/${inventoryItems.length}`);
    }
    
    console.log(`Stock reset completed. Total items reset: ${resetCount}`);
    
    // Verify the reset
    const remainingItemsWithStock = await prisma.inventory.count({
      where: { stockQty: { not: 0 } }
    });
    
    const positiveStockItems = await prisma.inventory.count({
      where: { stockQty: { gt: 0 } }
    });
    
    const negativeStockItems = await prisma.inventory.count({
      where: { stockQty: { lt: 0 } }
    });
    
    return NextResponse.json({
      message: "Stock quantities reset successfully",
      resetCount,
      transactionCount,
      remainingItemsWithNonZeroStock: remainingItemsWithStock,
      remainingPositiveStockItems: positiveStockItems,
      remainingNegativeStockItems: negativeStockItems,
      resetItems: resetItems.slice(0, 10), // Return first 10 for verification
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error resetting stock quantities:", error);
    return NextResponse.json({ 
      error: "Failed to reset stock quantities",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getSession();
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Return current stock summary
    const totalItems = await prisma.inventory.count();
    const itemsWithPositiveStock = await prisma.inventory.count({
      where: { stockQty: { gt: 0 } }
    });
    const itemsWithNegativeStock = await prisma.inventory.count({
      where: { stockQty: { lt: 0 } }
    });
    const itemsWithZeroStock = await prisma.inventory.count({
      where: { stockQty: 0 }
    });
    const totalStock = await prisma.inventory.aggregate({
      _sum: { stockQty: true }
    });
    
    return NextResponse.json({
      totalItems,
      itemsWithPositiveStock,
      itemsWithNegativeStock,
      itemsWithZeroStock,
      itemsWithNonZeroStock: itemsWithPositiveStock + itemsWithNegativeStock,
      totalStockQuantity: totalStock._sum.stockQty || 0
    });
    
  } catch (error) {
    console.error("Error getting stock summary:", error);
    return NextResponse.json({ error: "Failed to get stock summary" }, { status: 500 });
  }
}