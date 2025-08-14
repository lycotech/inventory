"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/nav/sidebar";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [appName, setAppName] = useState<string>("Inventory");

  // Close on escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Prevent body scroll when drawer open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Load app name from settings
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
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Topbar */}
      <div className="md:hidden fixed inset-x-0 top-0 h-12 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 z-40">
        <div className="h-full flex items-center justify-between px-3">
          <button
            aria-label="Open menu"
            className="rounded-md p-2 hover:bg-accent"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-sm font-semibold">{appName}</div>
          <div className="w-9" />
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-50 transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div
          className={cn(
            "absolute top-0 left-0 h-full w-72 max-w-[80%] bg-card border-r shadow-lg transition-transform", 
            open ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 h-12 border-b">
            <div className="text-sm font-semibold">Menu</div>
            <button aria-label="Close menu" className="rounded-md p-2 hover:bg-accent" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Reuse Sidebar links by rendering Sidebar but hide its header/footer */}
          <div className="overflow-y-auto h-[calc(100%-3rem)]">
            {/* A lightweight mobile list to avoid the full sticky layout in Sidebar */}
            <MobileSidebarList onNavigate={() => setOpen(false)} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:ml-0">
        {/* Spacer for mobile topbar */}
        <div className="md:hidden h-12" />
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const items = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inventory", href: "/dashboard/inventory", icon: Boxes },
  { label: "Import Data", href: "/dashboard/import", icon: FileUp },
  { label: "Alert", href: "/dashboard/alerts", icon: Bell },
  { label: "Report", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Backup", href: "/dashboard/backup", icon: Database },
  { label: "Setting", href: "/dashboard/settings", icon: Settings },
] as const;

function MobileSidebarList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="p-2 space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
  );
}
