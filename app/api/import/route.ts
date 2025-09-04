import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // allow some time for larger files

export async function POST(req: Request) {
  try {
    console.log("Starting import process...");
    
    const session = await getSession();
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("Session found, user ID:", session.user.id);

    const form = await req.formData();
    const file = form.get("file");
    const importType = String(form.get("importType") || "full");
    
    console.log("Import type:", importType, "File:", file ? "present" : "missing");
    
    if (!(file instanceof Blob)) {
      console.log("No file provided");
      return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    let sheet: any[] = [];
    try {
      const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      sheet = XLSX.utils.sheet_to_json(ws, { defval: "" });
    } catch (e) {
      console.error("XLSX parsing error:", e);
      return NextResponse.json({ ok: false, error: "Failed to parse XLSX file. Please ensure it's a valid Excel file." }, { status: 400 });
    }

  // Basic validation on headers before recording history
  if (!Array.isArray(sheet) || sheet.length === 0) {
    return NextResponse.json({ ok: false, error: "No rows found in the first sheet" }, { status: 400 });
  }
  // Build a normalized header map (case-insensitive)
  const normalize = (s: string) => String(s || "").trim().toLowerCase();
  const first = sheet[0] || {};
  const keys = Object.keys(first);
  const headerMap = new Map<string, string>();
  for (const k of keys) headerMap.set(normalize(k), k);
  const requireCols = (cols: string[]) => cols.filter((c) => !headerMap.has(normalize(c)));

  // Helper to get a value from a row using normalized header
  const getVal = (row: Record<string, any>, name: string) => {
    if (name in row) return row[name];
    const orig = headerMap.get(normalize(name));
    return orig ? row[orig] : undefined;
  };
  if (importType === "full") {
    const missing = requireCols(["barcode", "warehouseName"]);
    if (missing.length) {
      return NextResponse.json({ ok: false, error: `Missing required column(s): ${missing.join(", ")}. Please download the latest 'full' template.` }, { status: 400 });
    }
  } else if (importType === "stock_receive" || importType === "stock_issue" || importType === "adjustment" || importType === "stock_out") {
    const missing = requireCols(["barcode", "warehouseName", "quantity"]);
    if (missing.length) {
      return NextResponse.json({ ok: false, error: `Missing required column(s): ${missing.join(", ")}. Please download the latest template for '${importType}'.` }, { status: 400 });
    }
  } else if (importType === "stock_alert") {
    const missing = requireCols(["barcode", "warehouseName", "stockAlertLevel"]);
    if (missing.length) {
      return NextResponse.json({ ok: false, error: `Missing required column(s): ${missing.join(", ")}. Please download the latest template for 'stock_alert'.` }, { status: 400 });
    }
  } else if (importType === "stock_transfer" || importType === "warehouse_transfer") {
    const missing = requireCols(["barcode", "fromWarehouse", "toWarehouse", "quantity"]);
    if (missing.length) {
      return NextResponse.json({ ok: false, error: `Missing required column(s): ${missing.join(", ")}. Please download the latest template for 'stock_transfer'.` }, { status: 400 });
    }
  }

  const importRec = await prisma.importHistory.create({
    data: {
      importType: importType as any,
      filename: (file as any).name ?? "upload.xlsx",
      totalRecords: sheet.length,
      importStatus: "pending",
      processedBy: session.user.id,
    },
  }).catch((dbError) => {
    console.error("Database error creating import history:", dbError);
    throw new Error(`Failed to create import record: ${dbError.message}`);
  });

  const errors: { row: number; message: string }[] = [];
  let successful = 0;

  // Helper to get str -> number or default
  const toInt = (v: any, def = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : def;
  };

  // Build a cache for item by (barcode|warehouse) to avoid repeated lookups
  const cache = new Map<string, number>();
  const getInventoryId = async (barcode: string, warehouseName: string) => {
    const key = `${barcode}|${warehouseName}`;
    if (cache.has(key)) return cache.get(key)!;
    const inv = await prisma.inventory.findUnique({ where: { barcode_warehouse: { barcode, warehouseName } } });
    if (!inv) return 0;
    cache.set(key, inv.id);
    return inv.id;
  };

  const parseExpireDate = (v: any): Date | null => {
    if (v == null || v === "") return null;
    if (v instanceof Date && !isNaN(v.getTime())) return v;
    if (typeof v === "number") {
      // Excel serial date (days since 1899-12-30)
      const ms = Math.round((v - 25569) * 86400 * 1000);
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof v === "string") {
      const s = v.trim();
      if (!s) return null;
      const d1 = new Date(s);
      if (!isNaN(d1.getTime())) return d1;
      // Try dd/mm/yyyy or dd-mm-yyyy
      const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (m) {
        const day = Number(m[1]);
        const month = Number(m[2]);
        const year = Number(m[3]);
        const d2 = new Date(year, month - 1, day);
        return isNaN(d2.getTime()) ? null : d2;
      }
      return null;
    }
    return null;
  };

  for (let i = 0; i < sheet.length; i++) {
    const row = sheet[i] as Record<string, any>;
    try {
      if (importType === "full") {
        // Upsert Inventory by barcode
        const barcode = String(getVal(row, "barcode") || "").trim();
        if (!barcode) throw new Error("barcode is required");
        const warehouseName = String(getVal(row, "warehouseName") || "").trim();
        if (!warehouseName) throw new Error("warehouseName is required");
        const data = {
          category: String(getVal(row, "category") || "").trim(),
          itemName: String(getVal(row, "itemName") || "").trim(),
          searchCode: String(getVal(row, "searchCode") || "").trim(),
          warehouseName,
          stockQty: toInt(getVal(row, "stockQty"), 0),
          stockAlertLevel: toInt(getVal(row, "stockAlertLevel"), 0),
          expireDate: parseExpireDate(getVal(row, "expireDate")),
          expireDateAlert: toInt(getVal(row, "expireDateAlert"), 0),
          createdBy: session.user.id,
        };
        await prisma.inventory.upsert({
          where: { barcode_warehouse: { barcode, warehouseName } },
          create: { barcode, ...data },
          update: { ...data },
        });
        successful++;
      } else if (importType === "stock_receive" || importType === "stock_issue" || importType === "adjustment" || importType === "stock_out") {
        const barcode = String(getVal(row, "barcode") || "").trim();
        const warehouseName = String(getVal(row, "warehouseName") || "").trim();
        const qty = toInt(getVal(row, "quantity"));
        if (!barcode) throw new Error("barcode is required");
        if (!warehouseName) throw new Error("warehouseName is required");
        if (!qty) throw new Error("quantity is required");
        const invId = await getInventoryId(barcode, warehouseName);
        if (!invId) throw new Error(`inventory not found for ${barcode} in warehouse ${warehouseName}`);

        const txType = importType === "stock_receive" ? "receive" : 
                      importType === "stock_issue" ? "issue" : 
                      importType === "stock_out" ? "stock_out" : 
                      "adjustment";
        await prisma.stockTransaction.create({
          data: {
            inventoryId: invId,
            transactionType: txType as any,
            quantity: qty,
            transactionDate: new Date(),
            referenceDoc: getVal(row, "referenceDoc") ? String(getVal(row, "referenceDoc")) : null,
            reason: getVal(row, "reason") ? String(getVal(row, "reason")) : null,
            processedBy: session.user.id,
          },
        });
        // Adjust inventory stockQty accordingly
        await prisma.inventory.update({
          where: { id: invId },
          data: { stockQty: { increment: (txType === "issue" || txType === "stock_out") ? -Math.abs(qty) : Math.abs(qty) } },
        });
        successful++;
      } else if (importType === "stock_alert") {
        const barcode = String(getVal(row, "barcode") || "").trim();
        const warehouseName = String(getVal(row, "warehouseName") || "").trim();
        const stockAlertLevel = toInt(getVal(row, "stockAlertLevel"));
        
        if (!barcode) throw new Error("barcode is required");
        if (!warehouseName) throw new Error("warehouseName is required");
        if (stockAlertLevel < 0) throw new Error("stockAlertLevel must be >= 0");
        
        const invId = await getInventoryId(barcode, warehouseName);
        if (!invId) throw new Error(`inventory not found for barcode "${barcode}" in warehouse "${warehouseName}". Please ensure the item exists before updating alert levels.`);

        // Update the stock alert level
        await prisma.inventory.update({
          where: { id: invId },
          data: { stockAlertLevel: stockAlertLevel },
        });
        successful++;
      } else if (importType === "stock_transfer" || importType === "warehouse_transfer") {
        const barcode = String(getVal(row, "barcode") || "").trim();
        const fromWarehouse = String(getVal(row, "fromWarehouse") || "").trim();
        const toWarehouse = String(getVal(row, "toWarehouse") || "").trim();
        const qty = toInt(getVal(row, "quantity"));
        
        if (!barcode) throw new Error("barcode is required");
        if (!fromWarehouse) throw new Error("fromWarehouse is required");
        if (!toWarehouse) throw new Error("toWarehouse is required");
        if (!qty) throw new Error("quantity is required");
        if (fromWarehouse === toWarehouse) throw new Error("fromWarehouse and toWarehouse must be different");

        // Check source inventory exists and has sufficient stock
        const sourceInv = await prisma.inventory.findUnique({ 
          where: { barcode_warehouse: { barcode, warehouseName: fromWarehouse } } 
        });
        if (!sourceInv) throw new Error(`source inventory not found for ${barcode} in warehouse ${fromWarehouse}`);
        if (sourceInv.stockQty < Math.abs(qty)) throw new Error(`insufficient stock. Available: ${sourceInv.stockQty}, Required: ${Math.abs(qty)}`);

        // Find or create destination inventory
        let destInv = await prisma.inventory.findUnique({
          where: { barcode_warehouse: { barcode, warehouseName: toWarehouse } }
        });

        if (!destInv) {
          destInv = await prisma.inventory.create({
            data: {
              barcode: sourceInv.barcode,
              category: sourceInv.category,
              itemName: sourceInv.itemName,
              searchCode: sourceInv.searchCode,
              warehouseName: toWarehouse,
              stockQty: 0,
              stockAlertLevel: sourceInv.stockAlertLevel,
              expireDate: sourceInv.expireDate,
              expireDateAlert: sourceInv.expireDateAlert,
              createdBy: session.user.id,
            },
          });
        }

        // Create transfer transaction
        await prisma.stockTransaction.create({
          data: {
            inventoryId: sourceInv.id,
            transactionType: "transfer",
            quantity: Math.abs(qty),
            transactionDate: new Date(),
            referenceDoc: getVal(row, "referenceDoc") ? String(getVal(row, "referenceDoc")) : null,
            reason: getVal(row, "reason") ? String(getVal(row, "reason")) || `Transfer from ${fromWarehouse} to ${toWarehouse}` : `Transfer from ${fromWarehouse} to ${toWarehouse}`,
            processedBy: session.user.id,
          },
        });

        // Update source warehouse stock (decrease)
        await prisma.inventory.update({
          where: { id: sourceInv.id },
          data: { stockQty: { decrement: Math.abs(qty) } },
        });

        // Update destination warehouse stock (increase)
        await prisma.inventory.update({
          where: { id: destInv.id },
          data: { stockQty: { increment: Math.abs(qty) } },
        });

        successful++;
      } else {
        throw new Error(`Unknown importType: ${importType}`);
      }
    } catch (e: any) {
  errors.push({ row: i + 2, message: e?.message ?? String(e) });
    }
  }

  await prisma.importHistory.update({
    where: { id: importRec.id },
    data: {
      successfulRecords: successful,
      failedRecords: errors.length,
      importStatus: errors.length ? "failed" : "completed",
    },
  });

  return NextResponse.json({
    ok: errors.length === 0,
    importId: importRec.id,
    summary: { total: sheet.length, successful, failed: errors.length },
    errors,
  });
  
  } catch (error: any) {
    console.error("Import API error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: `Server error: ${error?.message || 'Unknown error occurred during import'}` 
    }, { status: 500 });
  }
}
