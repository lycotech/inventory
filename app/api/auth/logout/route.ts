import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true });
}

// Some platforms attempt to collect page data for API routes during build.
// Provide a harmless GET/HEAD to avoid build errors.
export async function GET() {
  return NextResponse.json({ ok: true, note: "Use POST to logout." });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
