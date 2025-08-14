"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Boxes,
  FileUp,
  Bell,
  BarChart3,
  Users,
  Database,
  Settings,
} from "lucide-react";

type Item = {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
};

const items: Item[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inventory", href: "/dashboard/inventory", icon: Boxes },
  { label: "Import Data", href: "/dashboard/import", icon: FileUp },
  { label: "Alert", href: "/dashboard/alerts", icon: Bell },
  { label: "Report", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Backup", href: "/dashboard/backup", icon: Database },
  { label: "Setting", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [appName, setAppName] = useState<string>("Inventory");
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/settings", { cache: "no-store" });
        if (r.ok) {
          const s = await r.json();
          if (s?.appName) setAppName(String(s.appName));
        }
      } catch {}
    })();
  }, []);

  return (
    <aside className="h-screen sticky top-0 border-r bg-card w-60 hidden md:flex md:flex-col">
      <div className="px-4 py-4 text-base font-semibold">{appName}</div>
      <nav className="flex-1 px-2 pb-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-foreground transition-colors",
                active && "bg-accent text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 text-xs text-muted-foreground">v0.1.0</div>
    </aside>
  );
}
