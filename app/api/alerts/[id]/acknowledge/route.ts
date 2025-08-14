import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { prisma } = await import("@/lib/prisma");
  await prisma.alertLog.update({
    where: { id },
    data: { acknowledged: true, acknowledgedBy: session.user.id, acknowledgedAt: new Date() },
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, note: "Use POST to acknowledge an alert." });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
