import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const format = (url.searchParams.get("format") || "json").toLowerCase();
  if (format !== "json") {
    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  }

  // Fetch data from tables. Exclude sensitive fields and sessions.
  const [usersRaw, inventory, txs, imports, alerts, reports, reportRuns, settings] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.inventory.findMany(),
    prisma.stockTransaction.findMany(),
    prisma.importHistory.findMany(),
    prisma.alertLog.findMany(),
    prisma.report.findMany(),
    prisma.reportExecution.findMany(),
    prisma.appSetting.findMany(),
  ]);

  const now = new Date();
  const meta = {
    exportedAt: now.toISOString(),
    version: 1,
    by: session.user.username,
  };

  const payload = {
    meta,
    tables: {
      User: usersRaw,
      Inventory: inventory,
      StockTransaction: txs,
      ImportHistory: imports,
      AlertLog: alerts,
      Report: reports,
      ReportExecution: reportRuns,
      AppSetting: settings,
    },
  };

  const json = JSON.stringify(payload, null, 2);
  const fname = `backup-${now.toISOString().replace(/[:.]/g, "-")}.json`;
  return new Response(json, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename=${fname}`,
      "cache-control": "no-store",
    },
  });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
