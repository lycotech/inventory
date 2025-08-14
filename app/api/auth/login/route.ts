import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({ username: "", password: "" }));
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }
  const user = await authenticate(username, password);
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  await createSession(user.id);
  return NextResponse.json({ id: user.id, username: user.username, role: user.role });
}

export async function GET() {
  return NextResponse.json({ ok: true, note: "POST username/password to login." });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
