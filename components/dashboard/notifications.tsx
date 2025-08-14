"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Stats = { items: number; lowStock: number; expiringSoon: number; transactionsToday: number };

export function DashboardNotifications({ initial }: { initial: Pick<Stats, "lowStock" | "expiringSoon"> }) {
  const [low, setLow] = useState(initial.lowStock);
  const [exp, setExp] = useState(initial.expiringSoon);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as Stats;
        setLow(json.lowStock);
        setExp(json.expiringSoon);
      } catch {}
    };
    timer.current = window.setInterval(poll, 30000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  if (low <= 0 && exp <= 0) return null;

  return (
    <div className="space-y-2">
      {low > 0 && (
        <Banner
          tone="danger"
          title={`${low} item${low === 1 ? "" : "s"} at or below stock alert`}
          href="/dashboard/alerts?type=low_stock&acknowledged=false"
          cta="View low stock"
        />
      )}
      {exp > 0 && (
        <Banner
          tone="warning"
          title={`${exp} item${exp === 1 ? "" : "s"} expiring soon`}
          href="/dashboard/alerts?type=expiring&acknowledged=false"
          cta="View expiring"
        />
      )}
    </div>
  );
}

function Banner({ tone, title, href, cta }: { tone: "danger" | "warning"; title: string; href: string; cta: string }) {
  const klass = tone === "danger" ? "border-red-300 bg-red-50 text-red-800" : "border-amber-300 bg-amber-50 text-amber-800";
  const btn = tone === "danger" ? "border-red-300 hover:bg-red-100" : "border-amber-300 hover:bg-amber-100";
  return (
    <div className={`rounded-lg border px-4 py-3 ${klass} flex items-center justify-between`}>
      <div className="text-sm font-medium">{title}</div>
      <Link href={href} className={`text-xs rounded-md border px-2 py-1 ${btn}`}>{cta}</Link>
    </div>
  );
}
