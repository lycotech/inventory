import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEMPLATES: Record<string, string> = {
  full: "barcode,category,itemName,searchCode,warehouseName,stockQty,stockAlertLevel,expireDate,expireDateAlert,batchNumber,manufactureDate,supplierInfo,lotNumber,costPerUnit\nYOUR_BARCODE,Your Category,Your Item Name,SEARCH_CODE,Your Warehouse,10,5,2025-12-31,30,BATCH001,2025-01-01,Supplier Name,LOT001,10.50\n",
  batch_import: "barcode,warehouseName,batchNumber,quantityReceived,manufactureDate,expiryDate,expireDateAlert,supplierInfo,lotNumber,costPerUnit,notes\nYOUR_BARCODE,Your Warehouse,BATCH001,50,2025-01-01,2025-12-31,30,Supplier Name,LOT001,15.75,Batch imported from template\n",
  stock_receive: "barcode,warehouseName,quantity,referenceDoc,reason\nYOUR_BARCODE,Your Central Warehouse,10,GRN-001,Stock receiving\n",
  stock_transfer: "barcode,fromWarehouse,toWarehouse,quantity,referenceDoc,reason\nYOUR_BARCODE,Your Central Warehouse,Your Branch Warehouse,5,TRF-001,Stock transfer between warehouses\n",
  stock_alert: "barcode,warehouseName,stockAlertLevel\nYOUR_BARCODE,Your Warehouse,10\nANOTHER_BARCODE,Your Warehouse,5\n",
  adjustment: "barcode,warehouseName,quantity,reason\nYOUR_BARCODE,Your Warehouse,-1,Stock adjustment\n",
  stock_out: "barcode,warehouseName,quantity,referenceDoc,reason\nYOUR_BARCODE,Your Warehouse,3,SALE-001,Item sold to customer\nANOTHER_BARCODE,Your Warehouse,1,CONS-001,Item consumed/used\n",
};

export async function GET(_: Request, ctx: { params: Promise<{ type: string }> }) {
  const { type } = await ctx.params;
  const csv = TEMPLATES[type];
  if (!csv) return NextResponse.json({ error: "Unknown template type" }, { status: 404 });
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=${type}-template.csv`,
    },
  });
}
