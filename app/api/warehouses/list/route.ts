import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.inventory.findMany({
    distinct: ["warehouseName"],
    select: { warehouseName: true },
    orderBy: { warehouseName: "asc" },
    take: 200,
  });
  const warehouses = rows.map((r: { warehouseName: string }) => r.warehouseName).filter(Boolean);
  return NextResponse.json({ warehouses });
}
