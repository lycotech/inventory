import { NextResponse } from "next/server";

const TEMPLATES: Record<string, string> = {
  full: "barcode,category,itemName,searchCode,warehouseName,stockQty,stockAlertLevel,expireDate,expireDateAlert\n123,Category A,Item name,SC001,Main,10,2,2025-12-31,30\n",
  stock_receive: "barcode,warehouseName,quantity,referenceDoc,reason\n123,Main,5,GRN-001,Initial stock\n",
  stock_issue: "barcode,warehouseName,quantity,referenceDoc,reason\n123,Main,2,ISS-001,Consumption\n",
  adjustment: "barcode,warehouseName,quantity,reason\n123,Main,-1,Correction\n",
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
