import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can manage user privileges
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all warehouses for privilege assignment
    const warehouses = await prisma.warehouse.findMany({
      select: {
        id: true,
        warehouseName: true,
        location: true
      },
      orderBy: {
        warehouseName: 'asc'
      }
    });

    return NextResponse.json({ warehouses });
  } catch (error: any) {
    console.error("Error fetching warehouses for privileges:", error);
    return NextResponse.json({ 
      error: "Failed to fetch warehouses" 
    }, { status: 500 });
  }
}