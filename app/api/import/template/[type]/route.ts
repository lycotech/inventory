import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEMPLATES: Record<string, string> = {
  full: "barcode,category,itemName,searchCode,warehouseName,stockQty,stockAlertLevel,unit,baseUnit,conversionFactor,expireDate,expireDateAlert,batchNumber,manufactureDate,supplierInfo,lotNumber,costPerUnit\nYOUR_BARCODE,Your Category,Your Item Name,SEARCH_CODE,Your Warehouse,10,5,piece,piece,1,2025-12-31,30,BATCH001,2025-01-01,Supplier Name,LOT001,10.50\nBARCODE_KG,Food Category,Rice Bag,RICE001,Central Warehouse,100,20,kilogram,gram,1000,2025-06-30,60,BATCH002,2025-01-15,Rice Supplier,LOT002,2.50\nBARCODE_CTN,Electronics,Phone Chargers,CHARGER001,Electronics Warehouse,50,10,carton,piece,12,2026-01-31,30,BATCH003,2025-02-01,Electronics Supplier,LOT003,120.00\n",
  batch_import: "barcode,warehouseName,batchNumber,quantityReceived,manufactureDate,expiryDate,expireDateAlert,supplierInfo,lotNumber,costPerUnit,notes\nYOUR_BARCODE,Your Warehouse,BATCH001,50,2025-01-01,2025-12-31,30,Supplier Name,LOT001,15.75,Batch imported from template\nRICE_BARCODE,Central Warehouse,RICE_BATCH_001,1000,2025-01-15,2025-06-30,60,Rice Supplier,RICE_LOT_001,2.50,Rice batch - quantity in grams\n",
  stock_receive: "barcode,warehouseName,quantity,unit,referenceDoc,reason\nYOUR_BARCODE,Your Central Warehouse,10,piece,GRN-001,Stock receiving\nRICE_BARCODE,Central Warehouse,50,kilogram,GRN-002,Rice delivery - quantity in kg\nCHARGER_BARCODE,Electronics Warehouse,2,carton,GRN-003,Charger delivery - 2 cartons = 24 pieces\n",
  stock_transfer: "barcode,fromWarehouse,toWarehouse,quantity,unit,referenceDoc,reason\nYOUR_BARCODE,Your Central Warehouse,Your Branch Warehouse,5,piece,TRF-001,Stock transfer between warehouses\nRICE_BARCODE,Central Warehouse,Branch Warehouse,25,kilogram,TRF-002,Rice transfer - quantity in kg\n",
  stock_alert: "barcode,warehouseName,stockAlertLevel\nYOUR_BARCODE,Your Warehouse,10\nANOTHER_BARCODE,Your Warehouse,5\n",
  adjustment: "barcode,warehouseName,quantity,unit,reason\nYOUR_BARCODE,Your Warehouse,-1,piece,Stock adjustment\nRICE_BARCODE,Central Warehouse,-2,kilogram,Rice spoilage - quantity in kg\n",
  stock_out: "barcode,warehouseName,quantity,unit,referenceDoc,reason\nYOUR_BARCODE,Your Warehouse,3,piece,SALE-001,Item sold to customer\nRICE_BARCODE,Central Warehouse,10,kilogram,SALE-002,Rice sold - quantity in kg\nCHARGER_BARCODE,Electronics Warehouse,1,carton,SALE-003,Charger carton sold = 12 pieces\n",
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
