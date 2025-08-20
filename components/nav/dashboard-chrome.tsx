"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/nav/sidebar";
import { cn } from "@/lib/utils";
import { Menu, X, User as UserIcon } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = { 
  id: number; 
  username: string; 
  role: string; 
  isActive: boolean; 
  profileImageUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
};

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
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-blue-950/50 dark:to-indigo-950/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block relative z-10">
        <Sidebar />
      </div>

      {/* Mobile Topbar */}
      <div className="md:hidden fixed inset-x-0 top-0 h-14 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75 z-40 shadow-sm">
        <div className="h-full flex items-center justify-between px-4">
          <button
            aria-label="Open menu"
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            {logoUrl && !logoErr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={appName}
                className="h-7 w-auto"
                onError={() => setLogoErr(true)}
              />
            ) : (
              <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{appName}</span>
            )}
          </div>
          <ProfileDropdown user={user} size={32} />
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-50 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          className={cn(
            "absolute top-0 left-0 h-full w-80 max-w-[85%] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 shadow-2xl transition-transform duration-300 ease-out", 
            open ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 h-14 border-b border-gray-200 dark:border-gray-800">
            <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Menu</div>
            <button 
              aria-label="Close menu" 
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200" 
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(100%-3.5rem)] py-4">
            <MobileSidebarList onNavigate={() => setOpen(false)} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:ml-0 relative z-10">
        {/* Spacer for mobile topbar */}
        <div className="md:hidden h-14" />
        
        {/* Desktop top bar with profile avatar */}
        <div className="hidden md:flex items-center justify-end h-16 border-b border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl px-8 shadow-sm relative z-50">
          <ProfileDropdown user={user} size={36} />
        </div>
        
        {/* Content area with enhanced styling */}
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 min-h-[calc(100vh-12rem)] p-6 sm:p-8">
              {children}
            </div>
          </div>
          
          {/* Footer */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-200/30 dark:border-gray-800/30 p-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  © 2025 TechValor Ent. • Secure inventory management system
                </p>
              </div>
            </div>
          </div>
        </div>
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
    <nav className="px-4 space-y-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
              active 
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            <Icon className="h-5 w-5" />
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
    <div ref={ref} className="relative z-[9999]">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-full focus:outline-none focus:ring-3 focus:ring-blue-500/50 hover:ring-3 hover:ring-blue-500/25 transition-all duration-200 transform hover:scale-105"
      >
        <UserAvatar user={user} size={size} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-56 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl z-[9999] overflow-hidden"
        >
          <div className="py-2">
            {/* User info section */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role} • {user.isActive ? 'Active' : 'Inactive'}</div>
            </div>
            
            {/* Theme section */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Theme</div>
              <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                {([
                  { k: 'light', label: 'Light' },
                  { k: 'system', label: 'Auto' },
                  { k: 'dark', label: 'Dark' },
                ] as const).map((opt) => (
                  <button
                    key={opt.k}
                    type="button"
                    className={cn(
                      "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                      mode === opt.k 
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    )}
                    onClick={() => setTheme(opt.k)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation links */}
            <div className="py-1">
              <Link
                href="/dashboard/profile"
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={() => setOpen(false)}
              >
                <UserIcon className="h-4 w-4" />
                My Profile
              </Link>
              <Link
                href="/dashboard/settings"
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={() => setOpen(false)}
              >
                <Settings className="h-4 w-4" />
                App Settings
              </Link>
              <button
                type="button"
                role="menuitem"
                className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                onClick={onLogout}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
