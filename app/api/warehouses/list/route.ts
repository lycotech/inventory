import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const warehouses = await prisma.warehouse.findMany({
    where: { isActive: true },
    select: { 
      id: true, 
      warehouseName: true,
      warehouseCode: true,
      location: true 
    },
    orderBy: { warehouseName: "asc" },
  });
  
  return NextResponse.json({ warehouses });
}
