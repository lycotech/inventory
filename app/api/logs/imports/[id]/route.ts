import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can access import details
    if (session.user.role === "user") {
      return NextResponse.json({ error: "Insufficient permissions. Only admins and managers can access import details." }, { status: 403 });
    }

    const resolvedParams = await params;
    const importId = parseInt(resolvedParams.id);
    if (isNaN(importId)) {
      return NextResponse.json({ error: "Invalid import ID" }, { status: 400 });
    }

    // Get detailed import information
    const importHistory = await prisma.importHistory.findUnique({
      where: { id: importId },
      include: {
        processor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!importHistory) {
      return NextResponse.json({ error: "Import record not found" }, { status: 404 });
    }

    // Get related transactions created around the same time as this import
    const relatedTransactions = await prisma.stockTransaction.findMany({
      where: {
        processedBy: importHistory.processedBy,
        createdAt: {
          gte: new Date(importHistory.createdAt.getTime() - 5 * 60 * 1000), // 5 minutes before
          lte: new Date(importHistory.createdAt.getTime() + 5 * 60 * 1000)  // 5 minutes after
        }
      },
      include: {
        inventory: {
          select: {
            itemName: true,
            barcode: true,
            warehouseName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Get any alerts created around the same time (might indicate issues)
    const relatedAlerts = await prisma.alertLog.findMany({
      where: {
        createdAt: {
          gte: new Date(importHistory.createdAt.getTime() - 5 * 60 * 1000),
          lte: new Date(importHistory.createdAt.getTime() + 5 * 60 * 1000)
        }
      },
      include: {
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

    return NextResponse.json({
      success: true,
      importDetails: {
        ...importHistory,
        relatedTransactions,
        relatedAlerts,
        summary: {
          successRate: importHistory.totalRecords > 0 
            ? Math.round((importHistory.successfulRecords / importHistory.totalRecords) * 100) 
            : 0,
          failureRate: importHistory.totalRecords > 0 
            ? Math.round((importHistory.failedRecords / importHistory.totalRecords) * 100) 
            : 0
        }
      }
    });

  } catch (error: any) {
    console.error("Error fetching import details:", error);
    return NextResponse.json({ 
      error: "Failed to fetch import details",
      details: error.message 
    }, { status: 500 });
  }
}
