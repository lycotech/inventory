import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyStockAlert } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Send email notifications for active alerts
 * This endpoint should be called periodically (e.g., by a cron job)
 * or manually triggered by admins
 */
export async function POST(req: Request) {
  const session = await getSession();
  
  // Allow both authenticated users and system calls (via API key for cron)
  const apiKey = req.headers.get("x-api-key");
  const isSystemCall = apiKey === process.env.CRON_API_KEY && apiKey !== undefined;
  
  if (!session && !isSystemCall) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get settings for email recipients
    const settingsRecord = await prisma.appSetting.findUnique({
      where: { key: "alertEmailRecipients" }
    });
    
    const recipients = settingsRecord?.value as string[] | undefined;
    
    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ 
        message: "No email recipients configured",
        sent: 0,
        skipped: 0
      });
    }

    // Get active alerts from the last hour that haven't been acknowledged
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Get active inventory alerts
    const inventoryAlerts = await prisma.$queryRaw<any[]>`
      SELECT 
        'low_stock' as type,
        CASE 
          WHEN stockQty <= stockAlertLevel * 0.5 THEN 'high'
          ELSE 'medium'
        END as priority,
        CONCAT('Low stock: ', itemName, ' (', barcode, ') at ', warehouseName, ' — ', stockQty, ' <= alert ', stockAlertLevel) as message,
        id as inventoryId,
        itemName,
        barcode,
        warehouseName,
        NOW() as createdAt
      FROM inventory
      WHERE stockAlertLevel > 0 AND stockQty <= stockAlertLevel
    `;

    // Get expiring items from inventory
    const expiringInventoryAlerts = await prisma.$queryRaw<any[]>`
      SELECT 
        'expiring' as type,
        CASE 
          WHEN DATEDIFF(expireDate, NOW()) <= 0 THEN 'high'
          WHEN DATEDIFF(expireDate, NOW()) <= 7 THEN 'high'
          ELSE 'medium'
        END as priority,
        CONCAT('Expiring ', 
          CASE 
            WHEN DATEDIFF(expireDate, NOW()) <= 0 THEN '(expired)'
            ELSE CONCAT('in ', DATEDIFF(expireDate, NOW()), ' day', IF(DATEDIFF(expireDate, NOW()) = 1, '', 's'))
          END,
          ': ', itemName, ' (', barcode, ') at ', warehouseName
        ) as message,
        id as inventoryId,
        itemName,
        barcode,
        warehouseName,
        expireDate as createdAt
      FROM inventory
      WHERE expireDate IS NOT NULL
        AND expireDateAlert > 0
        AND DATEDIFF(expireDate, NOW()) <= expireDateAlert
    `;

    // Get negative stock alerts
    const negativeStockAlerts = await prisma.$queryRaw<any[]>`
      SELECT 
        'negative_stock' as type,
        'high' as priority,
        CONCAT('Negative stock: ', itemName, ' (', barcode, ') at ', warehouseName, ' — qty ', stockQty) as message,
        id as inventoryId,
        itemName,
        barcode,
        warehouseName,
        NOW() as createdAt
      FROM inventory
      WHERE stockQty < 0
    `;

    const allAlerts = [
      ...inventoryAlerts,
      ...expiringInventoryAlerts,
      ...negativeStockAlerts
    ];

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    // Send email for each alert
    for (const alert of allAlerts) {
      try {
        const result = await notifyStockAlert(recipients, {
          type: alert.type,
          priority: alert.priority,
          message: alert.message,
          inventory: {
            itemName: alert.itemName,
            barcode: alert.barcode,
            warehouse: alert.warehouseName
          },
          createdAt: alert.createdAt
        });

        if (result.ok) {
          sent++;
        } else if (result.skipped) {
          skipped++;
        }
      } catch (error) {
        console.error("Error sending alert email:", error);
        errors++;
      }
    }

    return NextResponse.json({
      message: `Alert notifications processed`,
      totalAlerts: allAlerts.length,
      sent,
      skipped,
      errors,
      recipients: recipients.length
    });

  } catch (error) {
    console.error("Error processing alert notifications:", error);
    return NextResponse.json({ 
      error: "Failed to process alert notifications",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// GET endpoint to preview what alerts would be sent
export async function GET(req: Request) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get settings for email recipients
    const settingsRecord = await prisma.appSetting.findUnique({
      where: { key: "alertEmailRecipients" }
    });
    
    const recipients = settingsRecord?.value as string[] | undefined;

    // Get active alerts count
    const lowStockCount = await prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*) as c
      FROM inventory
      WHERE stockAlertLevel > 0 AND stockQty <= stockAlertLevel
    `;

    const expiringCount = await prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*) as c
      FROM inventory
      WHERE expireDate IS NOT NULL
        AND expireDateAlert > 0
        AND DATEDIFF(expireDate, NOW()) <= expireDateAlert
    `;

    const negativeCount = await prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*) as c
      FROM inventory
      WHERE stockQty < 0
    `;

    return NextResponse.json({
      recipients: recipients || [],
      alertCounts: {
        lowStock: Number(lowStockCount[0]?.c || 0),
        expiring: Number(expiringCount[0]?.c || 0),
        negativeStock: Number(negativeCount[0]?.c || 0),
        total: Number(lowStockCount[0]?.c || 0) + Number(expiringCount[0]?.c || 0) + Number(negativeCount[0]?.c || 0)
      },
      emailConfigured: recipients && recipients.length > 0,
      smtpConfigured: !!process.env.SMTP_HOST
    });

  } catch (error) {
    console.error("Error getting alert preview:", error);
    return NextResponse.json({ 
      error: "Failed to get alert preview",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

