import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.inventory.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
    take: 500,
  });
  const categories = rows.map((r: { category: string }) => r.category).filter(Boolean);
  return NextResponse.json({ categories });
}
