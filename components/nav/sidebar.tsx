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
    <aside className="h-screen sticky top-0 w-64 hidden md:flex md:flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 shadow-xl">
      {/* Header with logo */}
      <div className="px-6 py-6 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center gap-3">
          {logoUrl && !logoErr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={appName}
              className="h-10 w-auto"
              onError={() => setLogoErr(true)}
            />
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Boxes className="h-5 w-5 text-white" />
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {appName}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
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
                  "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group",
                  active 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  active ? "text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                )} />
                <span>{it.label}</span>
                {active && (
                  <div className="ml-auto w-2 h-2 bg-white/80 rounded-full animate-pulse" />
                )}
              </Link>
            );
          }
          const group = item as Extract<NavItem, { children: any }>;
          const openDefault = pathname?.startsWith("/dashboard/inventory");
          const [open, setOpen] = useState<boolean>(openDefault);
          const anyActive = group.children.some((c) => pathname?.startsWith(c.href));
          return (
            <div key={group.label} className="space-y-2">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                  "w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group",
                  anyActive 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <span className="flex items-center gap-4">
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    anyActive ? "text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                  )} />
                  {group.label}
                </span>
                <span className={cn(
                  "text-sm transition-transform duration-200",
                  open ? "rotate-90" : "rotate-0"
                )}>
                  ▸
                </span>
              </button>
              {open && (
                <div className="ml-9 space-y-1 animate-in slide-in-from-top-1 duration-200">
                  {group.children.map((c) => {
                    const active = pathname?.startsWith(c.href);
                    return (
                      <Link
                        key={c.href}
                        href={c.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-2 text-sm transition-all duration-200",
                          active 
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-2 border-blue-500" 
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-300"
                        )}
                      >
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all duration-200",
                          active ? "bg-blue-500" : "bg-gray-400 dark:bg-gray-600"
                        )} />
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

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Version 1.0.0
        </div>
      </div>
    </aside>
  );
}
