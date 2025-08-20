import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.appSetting.findMany();
  const map: Record<string, any> = {};
  for (const r of rows) map[r.key] = r.value as any;
  return NextResponse.json(map);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({} as Record<string, any>));
  const entries = Object.entries(body);
  if (!entries.length) return NextResponse.json({ ok: true });

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.appSetting.upsert({
        where: { key },
        update: { value: value as any },
        create: { key, value: value as any },
      })
    )
  );
  return NextResponse.json({ ok: true });
}
