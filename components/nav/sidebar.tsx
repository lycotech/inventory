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

type NavItem =
  | {
      label: string;
      href: string;
      icon: React.ComponentType<any>;
    }
  | {
      label: string;
      icon: React.ComponentType<any>;
      children: { label: string; href: string }[];
    };

const items: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Inventory",
    icon: Boxes,
    children: [
      { label: "Stock Item", href: "/dashboard/inventory/stock-items" },
      { label: "Manage Stock", href: "/dashboard/inventory" },
    ],
  },
  { label: "Import Data", href: "/dashboard/import", icon: FileUp },
  { label: "Alert", href: "/dashboard/alerts", icon: Bell },
  { label: "Report", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Stock Aging", href: "/dashboard/stock-aging", icon: BarChart3 },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Backup", href: "/dashboard/backup", icon: Database },
  { label: "Setting", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [appName, setAppName] = useState<string>("InvAlert");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoErr, setLogoErr] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/settings", { cache: "no-store" });
        if (r.ok) {
          const s = await r.json();
          const shorty = s?.appShortName || s?.appName;
          if (shorty) setAppName(String(shorty));
          if (s?.appLogoDataUrl) setLogoUrl(String(s.appLogoDataUrl));
          else if (s?.appLogoUrl) setLogoUrl(String(s.appLogoUrl));
        }
      } catch {}
    })();
  }, []);

  return (
    <aside className="h-screen sticky top-0 border-r bg-card w-60 hidden md:flex md:flex-col">
      <div className="px-4 py-4">
        {logoUrl && !logoErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={appName}
            className="h-8 w-auto"
            onError={() => setLogoErr(true)}
          />
        ) : (
          <div className="text-base font-semibold">{appName}</div>
        )}
      </div>
      <nav className="flex-1 px-2 pb-4 space-y-1">
        {items.map((item) => {
          const isGroup = (item as any).children?.length;
          const Icon = item.icon as any;
          if (!isGroup) {
            const it = item as Extract<NavItem, { href: string }>;
            const active =
              pathname === it.href ||
              (it.href !== "/dashboard" && pathname?.startsWith(it.href));
            return (
              <Link
                key={(it as any).href}
                href={it.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-foreground transition-colors",
                  active && "bg-accent text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{it.label}</span>
              </Link>
            );
          }
          const group = item as Extract<NavItem, { children: any }>;
          const openDefault = pathname?.startsWith("/dashboard/inventory");
          const [open, setOpen] = useState<boolean>(openDefault);
          const anyActive = group.children.some((c) => pathname?.startsWith(c.href));
          return (
            <div key={group.label} className="space-y-1">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                  "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-foreground transition-colors",
                  anyActive && "bg-accent text-foreground"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {group.label}
                </span>
                <span className="text-xs">{open ? "▾" : "▸"}</span>
              </button>
              {open && (
                <div className="ml-7 space-y-1">
                  {group.children.map((c) => {
                    const active = pathname?.startsWith(c.href);
                    return (
                      <Link
                        key={c.href}
                        href={c.href}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground/80 hover:bg-accent hover:text-foreground transition-colors",
                          active && "bg-accent text-foreground"
                        )}
                      >
                        <span className="text-xs">•</span>
                        <span>{c.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="px-4 py-3 text-xs text-muted-foreground">v0.1.0</div>
    </aside>
  );
}
