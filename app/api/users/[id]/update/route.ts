import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isFinite(userId) || userId <= 0) return NextResponse.json({ error: "Invalid user id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const role = body.role as "admin" | "manager" | "user" | undefined;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : undefined;

  if (role && !["admin", "manager", "user"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role ? { role } : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      },
      select: { id: true, username: true, email: true, role: true, isActive: true },
    });
    return NextResponse.json({ user: updated });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
