import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can access error logs
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions. Only admins can access error logs." }, { status: 403 });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const level = url.searchParams.get('level'); // 'error', 'warning', 'info'

    // Get recent failed transactions that might indicate errors
    const failedTransactions = await prisma.stockTransaction.findMany({
      where: {
        // Look for transactions that might indicate errors
        OR: [
          { quantity: { lt: 0 } }, // Negative quantities might indicate issues
          { referenceDoc: { contains: 'ERROR' } },
          { referenceDoc: { contains: 'FAILED' } },
        ]
      },
      select: {
        id: true,
        transactionType: true,
        quantity: true,
        referenceDoc: true,
        createdAt: true,
        inventory: {
          select: {
            itemName: true,
            barcode: true,
            warehouseName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Get recent alerts that might indicate system issues
    const recentAlerts = await prisma.alertLog.findMany({
      where: {
        acknowledged: false,
        OR: [
          { alertType: 'negative_stock' },
          { message: { contains: 'error' } },
          { message: { contains: 'failed' } }
        ]
      },
      select: {
        id: true,
        alertType: true,
        message: true,
        priorityLevel: true,
        createdAt: true,
        inventory: {
          select: {
            itemName: true,
            warehouseName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Get import histories with errors
    const failedImports = await prisma.importHistory.findMany({
      where: {
        importStatus: 'failed'
      },
      select: {
        id: true,
        filename: true,
        importStatus: true,
        failedRecords: true,
        createdAt: true,
        processor: {
          select: {
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get items with negative stock (data integrity issues)
    const negativeStockItems = await prisma.inventory.findMany({
      where: {
        stockQty: { lt: 0 }
      },
      select: {
        id: true,
        itemName: true,
        barcode: true,
        stockQty: true,
        warehouseName: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      success: true,
      errorLogs: {
        failedTransactions,
        systemAlerts: recentAlerts,
        failedImports,
        negativeStockItems,
        summary: {
          totalFailedTransactions: failedTransactions.length,
          totalSystemAlerts: recentAlerts.length,
          totalFailedImports: failedImports.length,
          totalNegativeStock: negativeStockItems.length
        }
      }
    });

  } catch (error: any) {
    console.error("Error fetching logs:", error);
    return NextResponse.json({ 
      error: "Failed to fetch error logs",
      details: error.message 
    }, { status: 500 });
  }
}

// POST endpoint to log custom errors
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { level, message, context, stack } = await req.json();

    // You could store these in a custom errors table
    // For now, we'll just log to console with structured format
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level || 'error',
      message,
      context,
      stack,
      user: session.user.username,
      userId: session.user.id
    };

    console.error("Application Error Log:", JSON.stringify(logEntry, null, 2));

    return NextResponse.json({
      success: true,
      message: "Error logged successfully"
    });

  } catch (error: any) {
    console.error("Error logging failed:", error);
    return NextResponse.json({ 
      error: "Failed to log error" 
    }, { status: 500 });
  }
}
