import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Prefer Prisma model if available, else fallback to raw query
    const client: any = prisma as any;
    if (client.agingCategory?.findMany) {
      const rows = await client.agingCategory.findMany({
        where: { isActive: true },
        orderBy: { minDays: "asc" },
      });
      return NextResponse.json({ categories: rows });
    }
  } catch {}

  try {
    const rows: any[] = await prisma.$queryRawUnsafe(
      "SELECT id, categoryName as categoryName, minDays, maxDays, colorCode, priorityLevel, isActive FROM agingcategory WHERE isActive = 1 ORDER BY minDays ASC"
    );
    return NextResponse.json({ categories: rows });
  } catch {
    // Table may not exist yet
    return NextResponse.json({ categories: [] });
  }
}
