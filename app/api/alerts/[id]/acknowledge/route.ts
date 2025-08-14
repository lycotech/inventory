import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await prisma.alertLog.update({
    where: { id },
    data: { acknowledged: true, acknowledgedBy: session.user.id, acknowledgedAt: new Date() },
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}

export const runtime = "nodejs";
