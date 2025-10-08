import { NextResponse } from "next/server";
import { getSession, getSessionWithPrivileges } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sessionWithPrivileges = await getSessionWithPrivileges();
  if (!sessionWithPrivileges) return NextResponse.json({ authenticated: false }, { status: 200 });
  
  return NextResponse.json({ 
    authenticated: true, 
    user: sessionWithPrivileges.user,
    privileges: sessionWithPrivileges.privileges || null
  });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
