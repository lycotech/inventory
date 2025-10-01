import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
    
    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Process each item
      for (const item of inventoryItems) {
        const currentQty = item.stockQty;
        
        // Create audit transaction with appropriate reason
        const adjustmentReason = currentQty > 0 
          ? `${reason || 'Stock quantity reset to zero'} - Positive stock adjustment`
          : currentQty < 0 
          ? `${reason || 'Stock quantity reset to zero'} - Negative stock correction`
          : `${reason || 'Stock quantity reset to zero'} - Administrative adjustment`;
          
        await tx.stockTransaction.create({
          data: {
            inventoryId: item.id,
            transactionType: 'adjustment',
            quantity: -currentQty,
            transactionDate: new Date(),
            referenceDoc: `RESET-${new Date().toISOString().slice(0, 10)}`,
            reason: adjustmentReason,
            processedBy: session.user.id
          }
        });
        
        // Reset quantity to zero
        await tx.inventory.update({
          where: { id: item.id },
          data: { stockQty: 0 }
        });
        
        resetItems.push({
          id: item.id,
          barcode: item.barcode,
          itemName: item.itemName,
          warehouseName: item.warehouseName,
          previousQty: currentQty,
          newQty: 0
        });
        
        resetCount++;
        transactionCount++;
      }
    });
    
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