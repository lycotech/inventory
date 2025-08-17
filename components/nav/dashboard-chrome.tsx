"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/nav/sidebar";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = { id: number; username: string; role: string; isActive: boolean; profileImageUrl?: string };

export function DashboardChrome({ children, user }: { children: React.ReactNode; user: User }) {
  const [open, setOpen] = useState(false);
  const [appName, setAppName] = useState<string>("InvAlert");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoErr, setLogoErr] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("system");

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
          const shorty = s?.appShortName || s?.appName;
          if (shorty) setAppName(String(shorty));
          if (s?.appLogoDataUrl) setLogoUrl(String(s.appLogoDataUrl));
          else if (s?.appLogoUrl) setLogoUrl(String(s.appLogoUrl));
          if (s?.themeMode && ["light","dark","system"].includes(String(s.themeMode))) {
            setThemeMode(s.themeMode);
            applyTheme(String(s.themeMode));
          } else {
            applyTheme("system");
          }
        }
      } catch {}
    })();
  }, []);

  function applyTheme(mode: string) {
    const root = document.documentElement;
    const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const wantDark = mode === 'dark' || (mode === 'system' && mq?.matches);
    if (wantDark) root.classList.add('dark'); else root.classList.remove('dark');
  }

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
          <div className="text-sm font-semibold">
            {logoUrl && !logoErr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={appName}
                className="h-6 w-auto"
                onError={() => setLogoErr(true)}
              />
            ) : (
              appName
            )}
          </div>
          <ProfileDropdown user={user} size={28} />
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
        {/* Desktop top bar with profile avatar */}
        <div className="hidden md:flex items-center justify-end h-12 border-b bg-card/60 backdrop-blur px-6">
          <ProfileDropdown user={user} size={32} />
        </div>
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}

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

function ProfileDropdown({ user, size = 32 }: { user: User; size?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [mode, setMode] = useState<'light'|'dark'|'system'>(() => {
    // Default to system on first render; will be synced from settings by parent.
    return 'system';
  });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const onLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/");
    }
  };

  const setTheme = async (m: 'light'|'dark'|'system') => {
    setMode(m);
    const root = document.documentElement;
    const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const wantDark = m === 'dark' || (m === 'system' && mq?.matches);
    if (wantDark) root.classList.add('dark'); else root.classList.remove('dark');
    // Best-effort save; ignore errors and unauthorized
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ themeMode: m }),
      });
    } catch {}
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <UserAvatar user={user} size={size} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 rounded-md border bg-popover text-popover-foreground shadow-md z-50"
        >
          <div className="py-1 text-sm">
            <div className="px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Theme</div>
              <div className="inline-flex rounded-md border overflow-hidden">
                {([
                  { k: 'light', label: 'Light' },
                  { k: 'system', label: 'System' },
                  { k: 'dark', label: 'Dark' },
                ] as const).map((opt, idx) => (
                  <button
                    key={opt.k}
                    type="button"
                    className={`px-2.5 py-1 text-xs ${mode===opt.k ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent'} ${idx>0 ? 'border-l' : ''}`}
                    onClick={() => setTheme(opt.k)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <Link
              href="/dashboard/settings"
              role="menuitem"
              className="block w-full px-3 py-2 hover:bg-accent hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Profile
            </Link>
            <button
              type="button"
              role="menuitem"
              className="block w-full text-left px-3 py-2 hover:bg-accent hover:text-foreground"
              onClick={onLogout}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
