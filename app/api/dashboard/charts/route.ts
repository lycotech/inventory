import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Check if database is available
    await prisma.$connect();
    
    // Get inventory by category for pie chart
    const inventoryByCategory = await prisma.inventory.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
      _sum: {
        stockQty: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Get stock levels over time (last 7 days) for line chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stockTransactions = await prisma.stockTransaction.groupBy({
      by: ['transactionDate'],
      where: {
        transactionDate: {
          gte: sevenDaysAgo,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

    // Get warehouse distribution for bar chart
    const warehouseStats = await prisma.inventory.groupBy({
      by: ['warehouseName'],
      _count: {
        id: true,
      },
      _sum: {
        stockQty: true,
      },
      orderBy: {
        _sum: {
          stockQty: 'desc',
        },
      },
    });

    // Format data for charts
    const categoryData = inventoryByCategory.map((item: any) => ({
      name: item.category || 'Uncategorized',
      items: item._count.id,
      totalStock: item._sum.stockQty || 0,
    }));

    const transactionData = stockTransactions.map((item: any) => ({
      date: item.transactionDate.toISOString().split('T')[0],
      transactions: item._count.id,
      totalQuantity: Math.abs(item._sum.quantity || 0),
    }));

    const warehouseData = warehouseStats.map((item: any) => ({
      name: item.warehouseName || 'No Warehouse',
      items: item._count.id,
      totalStock: item._sum.stockQty || 0,
    }));

    // Get low stock vs healthy stock for donut chart
    // Count unique items (distinct barcodes)
    const totalItemsRow = await prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(DISTINCT barcode) AS c
      FROM inventory
    `;
    const totalItems = Number(totalItemsRow[0]?.c ?? 0);
    
    const lowStockRow = await prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(DISTINCT barcode) AS c
      FROM inventory
      WHERE stockAlertLevel > 0 AND stockQty <= stockAlertLevel
    `;
    const lowStock = Number(lowStockRow[0]?.c ?? 0);
    const healthyStock = totalItems - lowStock;

    const stockHealthData = [
      { name: 'Healthy Stock', value: healthyStock, color: '#10b981' },
      { name: 'Low Stock', value: lowStock, color: '#ef4444' },
    ];

    return NextResponse.json({
      categoryData,
      transactionData,
      warehouseData,
      stockHealthData,
    });
  } catch (error) {
    console.error('Charts API error:', error);
    // Return empty data instead of error during build/development
    return NextResponse.json({
      categoryData: [],
      transactionData: [],
      warehouseData: [],
      stockHealthData: [],
    });
  } finally {
    await prisma.$disconnect();
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
