import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import ExcelJS from "exceljs";
import { PDFDocument as PDFLibDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toCSV(rows: any[], headers?: string[]): string {
  if (!rows.length) return (headers ? headers.join(",") : "") + "\n";
  const cols = headers || Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [cols.join(",")];
  for (const r of rows) lines.push(cols.map((c) => esc((r as any)[c])).join(","));
  return lines.join("\n") + "\n";
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = String(url.searchParams.get("type") || "");
  const format = String(url.searchParams.get("format") || "csv").toLowerCase();

  let filenameBase = `report-${type || 'unknown'}-${new Date().toISOString().slice(0,10)}`;
  let headers: string[] = [];
  let rows: any[] = [];

  if (type === "current_stock") {
    const q = String(url.searchParams.get("q") || "");
    const where = q
      ? {
          OR: [
            { itemName: { contains: q } },
            { barcode: { contains: q } },
            { category: { contains: q } },
            { warehouseName: { contains: q } },
          ],
        }
      : {};
    const items = await prisma.inventory.findMany({ where, orderBy: { itemName: "asc" } });
    rows = items.map((it: any) => ({
      itemName: it.itemName,
      barcode: it.barcode,
      warehouse: it.warehouseName,
      category: it.category,
      qty: it.stockQty,
      alert: it.stockAlertLevel,
      expireDate: it.expireDate ? it.expireDate.toISOString().slice(0, 10) : "",
    }));
    headers = ["itemName", "barcode", "warehouse", "category", "qty", "alert", "expireDate"];
    filenameBase = `current_stock_${new Date().toISOString().slice(0,10)}`;
  } else if (type === "low_stock") {
    const raw: any[] = await prisma.$queryRaw`
      SELECT itemName, barcode, warehouseName as warehouse, category, stockQty as qty, stockAlertLevel as alert
      FROM inventory
      WHERE stockAlertLevel > 0 AND stockQty <= stockAlertLevel
      ORDER BY itemName ASC
    `;
    rows = raw;
    headers = ["itemName", "barcode", "warehouse", "category", "qty", "alert"];
    filenameBase = `low_stock_${new Date().toISOString().slice(0,10)}`;
  } else if (type === "expiry") {
    const days = Math.max(0, parseInt(String(url.searchParams.get("days") || "30")) || 30);
    const raw: any[] = await prisma.$queryRaw`
      SELECT itemName, barcode, warehouseName as warehouse, category, DATE_FORMAT(expireDate, '%Y-%m-%d') as expireDate, expireDateAlert
      FROM inventory
      WHERE expireDate IS NOT NULL AND DATEDIFF(expireDate, NOW()) <= ${days}
      ORDER BY expireDate ASC
    `;
    rows = raw;
    headers = ["itemName", "barcode", "warehouse", "category", "expireDate", "expireDateAlert"];
    filenameBase = `expiry_${days}d_${new Date().toISOString().slice(0,10)}`;
  } else if (type === "stock_movement") {
    const start = String(url.searchParams.get("start") || "");
    const end = String(url.searchParams.get("end") || "");
    const startDate = start ? new Date(start) : new Date(Date.now() - 7 * 86400000);
    const endDate = end ? new Date(end) : new Date();
    const txs = await prisma.stockTransaction.findMany({
      where: { transactionDate: { gte: startDate, lte: endDate } },
      include: { inventory: true, processor: true },
      orderBy: { transactionDate: "asc" },
    });
    rows = txs.map((t: any) => ({
      date: t.transactionDate.toISOString(),
      type: t.transactionType,
      itemName: t.inventory.itemName,
      barcode: t.inventory.barcode,
      warehouse: t.inventory.warehouseName,
      qty: t.quantity,
      reference: t.referenceDoc || "",
      reason: t.reason || "",
      by: t.processor.username,
    }));
    headers = ["date", "type", "itemName", "barcode", "warehouse", "qty", "reference", "reason", "by"];
    filenameBase = `stock_movement_${startDate.toISOString().slice(0,10)}_${endDate.toISOString().slice(0,10)}`;
  } else if (type === "dead_stock") {
    const days = Math.max(0, parseInt(String(url.searchParams.get("days") || "90")) || 90);
    // Dead stock = items with no transactions in the last X days
    const raw: any[] = await prisma.$queryRaw`
      SELECT 
        i.itemName, 
        i.barcode, 
        i.warehouseName as warehouse, 
        i.category, 
        i.stockQty as qty,
        COALESCE(MAX(st.transactionDate), i.createdAt) as lastMovement,
        DATEDIFF(NOW(), COALESCE(MAX(st.transactionDate), i.createdAt)) as daysStagnant
      FROM inventory i
      LEFT JOIN StockTransaction st ON i.id = st.inventoryId
      GROUP BY i.id
      HAVING daysStagnant >= ${days}
      ORDER BY daysStagnant DESC, i.itemName ASC
    `;
    rows = raw.map((r: any) => ({
      ...r,
      lastMovement: r.lastMovement ? new Date(r.lastMovement).toISOString().slice(0, 10) : '',
    }));
    headers = ["itemName", "barcode", "warehouse", "category", "qty", "lastMovement", "daysStagnant"];
    filenameBase = `dead_stock_${days}d_${new Date().toISOString().slice(0,10)}`;
  } else if (type === "low_stock_by_warehouse") {
    const warehouseFilter = String(url.searchParams.get("warehouse") || "");
    let query = `
      SELECT itemName, barcode, warehouseName as warehouse, category, stockQty as qty, stockAlertLevel as alert
      FROM inventory
      WHERE stockAlertLevel > 0 AND stockQty <= stockAlertLevel
    `;
    if (warehouseFilter) {
      query += ` AND warehouseName = '${warehouseFilter.replace(/'/g, "''")}'`;
    }
    query += ` ORDER BY warehouseName ASC, itemName ASC`;
    
    const raw: any[] = await prisma.$queryRawUnsafe(query);
    rows = raw;
    headers = ["itemName", "barcode", "warehouse", "category", "qty", "alert"];
    filenameBase = `low_stock_by_warehouse_${new Date().toISOString().slice(0,10)}`;
  } else if (type === "receive_summary") {
    const start = String(url.searchParams.get("start") || "");
    const end = String(url.searchParams.get("end") || "");
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 86400000);
    const endDate = end ? new Date(end) : new Date();
    const raw: any[] = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(st.transactionDate, '%Y-%m-%d') as date,
        i.itemName,
        i.barcode,
        i.warehouseName as warehouse,
        i.category,
        st.quantity,
        st.referenceDoc as reference,
        u.username as receivedBy
      FROM stocktransaction st
      JOIN Inventory i ON st.inventoryId = i.id
      JOIN User u ON st.processedBy = u.id
      WHERE st.transactionType = 'receive'
        AND st.transactionDate >= ${startDate}
        AND st.transactionDate <= ${endDate}
      ORDER BY st.transactionDate DESC
    `;
    rows = raw;
    headers = ["date", "itemName", "barcode", "warehouse", "category", "quantity", "reference", "receivedBy"];
    filenameBase = `receive_summary_${startDate.toISOString().slice(0,10)}_${endDate.toISOString().slice(0,10)}`;
  } else if (type === "user_activity") {
    const start = String(url.searchParams.get("start") || "");
    const end = String(url.searchParams.get("end") || "");
    const startDate = start ? new Date(start) : new Date(Date.now() - 7 * 86400000);
    const endDate = end ? new Date(end) : new Date();
    const raw: any[] = await prisma.$queryRaw`
      SELECT 
        u.username,
        u.role,
        DATE_FORMAT(st.transactionDate, '%Y-%m-%d %H:%i:%s') as activity_time,
        st.transactionType as activity_type,
        i.itemName,
        st.quantity,
        st.reason
      FROM stocktransaction st
      JOIN User u ON st.processedBy = u.id
      JOIN Inventory i ON st.inventoryId = i.id
      WHERE st.transactionDate >= ${startDate}
        AND st.transactionDate <= ${endDate}
      
      UNION ALL
      
      SELECT 
        u.username,
        u.role,
        DATE_FORMAT(ih.createdAt, '%Y-%m-%d %H:%i:%s') as activity_time,
        CONCAT('import_', ih.importType) as activity_type,
        CONCAT(ih.totalRecords, ' records') as itemName,
        ih.successRecords as quantity,
        ih.status as reason
      FROM importhistory ih
      JOIN User u ON ih.processedBy = u.id
      WHERE ih.createdAt >= ${startDate}
        AND ih.createdAt <= ${endDate}
      
      ORDER BY activity_time DESC
    `;
    rows = raw;
    headers = ["username", "role", "activity_time", "activity_type", "itemName", "quantity", "reason"];
    filenameBase = `user_activity_${startDate.toISOString().slice(0,10)}_${endDate.toISOString().slice(0,10)}`;
  } else if (type === "import_statistics") {
    const start = String(url.searchParams.get("start") || "");
    const end = String(url.searchParams.get("end") || "");
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 86400000);
    const endDate = end ? new Date(end) : new Date();
    const imports = await prisma.importHistory.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: { processor: true },
      orderBy: { createdAt: "desc" },
    });
    rows = imports.map((imp: any) => ({
      date: imp.createdAt.toISOString().slice(0, 10),
      importType: imp.importType,
      totalRecords: imp.totalRecords,
      successRecords: imp.successRecords,
      errorRecords: imp.errorRecords,
      status: imp.status,
      processedBy: imp.processor.username,
      fileName: imp.fileName || '',
      successRate: imp.totalRecords > 0 ? Math.round((imp.successRecords / imp.totalRecords) * 100) + '%' : '0%'
    }));
    headers = ["date", "importType", "totalRecords", "successRecords", "errorRecords", "status", "processedBy", "fileName", "successRate"];
    filenameBase = `import_statistics_${startDate.toISOString().slice(0,10)}_${endDate.toISOString().slice(0,10)}`;
  } else if (type === "alert_response") {
    const start = String(url.searchParams.get("start") || "");
    const end = String(url.searchParams.get("end") || "");
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 86400000);
    const endDate = end ? new Date(end) : new Date();
    const alerts = await prisma.alertLog.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: { acknowledgedUser: true, inventory: true },
      orderBy: { createdAt: "desc" },
    });
    rows = alerts.map((alert: any) => {
      const responseTime = alert.acknowledgedAt && alert.createdAt 
        ? Math.round((new Date(alert.acknowledgedAt).getTime() - new Date(alert.createdAt).getTime()) / (1000 * 60)) 
        : null;
      return {
        date: alert.createdAt.toISOString().slice(0, 10),
        alertType: alert.alertType,
        priority: alert.priorityLevel,
        itemName: alert.inventory.itemName,
        warehouse: alert.inventory.warehouseName,
        acknowledged: alert.acknowledged ? 'Yes' : 'No',
        acknowledgedBy: alert.acknowledgedByUser?.username || '',
        responseTimeMinutes: responseTime || '',
        message: alert.message
      };
    });
    headers = ["date", "alertType", "priority", "itemName", "warehouse", "acknowledged", "acknowledgedBy", "responseTimeMinutes", "message"];
    filenameBase = `alert_response_${startDate.toISOString().slice(0,10)}_${endDate.toISOString().slice(0,10)}`;
  } else if (type === "system_usage") {
    const start = String(url.searchParams.get("start") || "");
    const end = String(url.searchParams.get("end") || "");
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 86400000);
    const endDate = end ? new Date(end) : new Date();
    
    // Get transaction statistics
    const txStats: any[] = await prisma.$queryRaw`
      SELECT 
        transactionType,
        COUNT(*) as count,
        DATE_FORMAT(transactionDate, '%Y-%m-%d') as date
      FROM stocktransaction 
      WHERE transactionDate >= ${startDate} AND transactionDate <= ${endDate}
      GROUP BY transactionType, DATE_FORMAT(transactionDate, '%Y-%m-%d')
      ORDER BY date DESC, transactionType
    `;
    
    // Get import statistics
    const importStats: any[] = await prisma.$queryRaw`
      SELECT 
        importType,
        COUNT(*) as count,
        SUM(totalRecords) as totalRecords,
        SUM(successRecords) as successRecords,
        DATE_FORMAT(createdAt, '%Y-%m-%d') as date
      FROM importhistory 
      WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}
      GROUP BY importType, DATE_FORMAT(createdAt, '%Y-%m-%d')
      ORDER BY date DESC, importType
    `;
    
    // Get user login statistics
    const userStats: any[] = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT username) as activeUsers,
        COUNT(*) as totalLogins,
        DATE_FORMAT(lastLogin, '%Y-%m-%d') as date
      FROM user 
      WHERE lastLogin >= ${startDate} AND lastLogin <= ${endDate}
      GROUP BY DATE_FORMAT(lastLogin, '%Y-%m-%d')
      ORDER BY date DESC
    `;
    
    // Combine all statistics
    rows = [
      ...txStats.map((stat: any) => ({
        date: stat.date,
        feature: `Transaction: ${stat.transactionType}`,
        usage_count: stat.count,
        additional_info: ''
      })),
      ...importStats.map((stat: any) => ({
        date: stat.date,
        feature: `Import: ${stat.importType}`,
        usage_count: stat.count,
        additional_info: `${stat.totalRecords} records, ${stat.successRecords} successful`
      })),
      ...userStats.map((stat: any) => ({
        date: stat.date,
        feature: 'User Logins',
        usage_count: stat.totalLogins,
        additional_info: `${stat.activeUsers} unique users`
      }))
    ];
    
    headers = ["date", "feature", "usage_count", "additional_info"];
    filenameBase = `system_usage_${startDate.toISOString().slice(0,10)}_${endDate.toISOString().slice(0,10)}`;
  } else {
    return NextResponse.json({ error: "Unsupported report type" }, { status: 400 });
  }

  // Generate output per format
  if (format === "xlsx") {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Report");
    ws.addRow(headers);
    for (const r of rows) {
      const rowObj = Array.isArray(r) ? r : headers.map((h) => (r as any)[h]);
      ws.addRow(rowObj);
    }
    // Basic header styling
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true } as any;
    headerRow.alignment = { vertical: "middle", horizontal: "left" } as any;
  ws.columns?.forEach((col: any) => {
      col.width = Math.min(40, Math.max(10, (col.values || []).reduce((w: number, v: any) => Math.max(w, String(v || "").length), 10)));
    });
  const buffer = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  return new Response(buffer, {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename=${filenameBase}.xlsx`,
      },
    });
  }

  if (format === "pdf") {
  const pdfDoc = await PDFLibDocument.create();
  const landscape = [PageSizes.A4[1], PageSizes.A4[0]] as [number, number];
  let page = pdfDoc.addPage(landscape);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageSize = page.getSize();
    const margin = 36;
    const usableWidth = pageSize.width - margin * 2;
    let y = pageSize.height - margin;
    const lineHeight = 14;

    const charWidth = 6; // approx width per character at size 10
    const textSize = 10;

    // Title
    page.drawText("Report", { x: margin, y, size: 14, font: bold, color: rgb(0, 0, 0) });
    y -= lineHeight * 1.2;
    const subtitle = `Type: ${type}    Generated: ${new Date().toLocaleString()}`;
    page.drawText(subtitle, { x: margin, y, size: textSize, font });
    y -= lineHeight * 1.2;

    // Compute column widths based on headers + sample of rows
    const sample = rows.slice(0, 50);
    const colCharWidths = headers.map((h, i) => {
      const headerLen = String(h).length;
      const maxCell = Math.max(
        headerLen,
        ...sample.map((r) => String((r as any)[headers[i]] ?? "").length)
      );
      return Math.min(40, Math.max(6, maxCell)); // cap width in chars
    });
    const totalChars = colCharWidths.reduce((a, b) => a + b, 0) + (headers.length - 1) * 3; // separators
    const scale = Math.min(1, usableWidth / (totalChars * charWidth));
    const colWidths = colCharWidths.map((c) => c * charWidth * scale);

    const truncateToWidth = (text: string, width: number) => {
      const maxChars = Math.max(1, Math.floor(width / (charWidth * (textSize / 10))));
      if (text.length <= maxChars) return text;
      if (maxChars <= 3) return text.slice(0, maxChars);
      return text.slice(0, maxChars - 3) + "...";
    };

    const drawHeader = () => {
      let x = margin;
      for (let i = 0; i < headers.length; i++) {
        const t = truncateToWidth(String(headers[i]), colWidths[i]);
        page.drawText(t, { x, y, size: textSize, font: bold });
        x += colWidths[i] + 10; // 10pt gap
      }
      y -= lineHeight;
    };

    const newPage = () => {
      page = pdfDoc.addPage(landscape);
      const s = page.getSize();
      y = s.height - margin;
      drawHeader();
    };

    // Draw initial header
    drawHeader();

    for (const r of rows) {
      if (y - lineHeight < margin) newPage();
      let x = margin;
      for (let i = 0; i < headers.length; i++) {
        const cell = String((r as any)[headers[i]] ?? "");
        const t = truncateToWidth(cell, colWidths[i]);
        page.drawText(t, { x, y, size: textSize, font });
        x += colWidths[i] + 10;
      }
      y -= lineHeight;
    }

    const pdfBytes = await pdfDoc.save();
    const body = new Uint8Array(pdfBytes);
    return new Response(body, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename=${filenameBase}.pdf`,
      },
    });
  }

  // default CSV
  const csv = toCSV(rows, headers);
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=${filenameBase}.csv`,
    },
  });
}
