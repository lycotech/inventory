import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEMPLATES: Record<string, string> = {
  full: "barcode,category,itemName,searchCode,warehouseName,stockQty,stockAlertLevel,expireDate,expireDateAlert\n123,Category A,Item name,SC001,Main,10,2,2025-12-31,30\n",
  stock_receive: "barcode,warehouseName,quantity,referenceDoc,reason\n123,Central,5,GRN-001,Initial stock receiving to central warehouse\n",
  stock_issue: "barcode,warehouseName,quantity,referenceDoc,reason\n123,Branch A,2,ISS-001,Issue from warehouse\n",
  adjustment: "barcode,warehouseName,quantity,reason\n123,Main,-1,Stock correction\n",
  warehouse_transfer: "barcode,fromWarehouse,toWarehouse,quantity,referenceDoc,reason\n123,Central,Branch A,5,TRF-001,Transfer to branch warehouse\n",
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
