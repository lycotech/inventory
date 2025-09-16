import { getSession } from "@/lib/auth";
import { headers } from "next/headers";
import { DashboardNotifications } from "@/components/dashboard/notifications";
import { DashboardCharts } from "@/components/dashboard/charts";
import { Boxes, AlertTriangle, Clock, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    // Middleware also protects this route; returning null avoids flashing content.
    return null;
  }
  // Fetch stats on the server for fast, consistent SSR
  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const host = hdrs.get("host") ?? "localhost:3000";
  const cookie = hdrs.get("cookie") ?? "";
  const base = `${proto}://${host}`;
  const [resStats, resRecent, resAlerts] = await Promise.all([
    fetch(`${base}/api/dashboard/stats`, { cache: "no-store", headers: { cookie } }).catch(() => null),
    fetch(`${base}/api/dashboard/recent`, { cache: "no-store", headers: { cookie } }).catch(() => null),
    fetch(`${base}/api/dashboard/alerts`, { cache: "no-store", headers: { cookie } }).catch(() => null),
  ]);
  const stats = resStats && resStats.ok ? await resStats.json() : null;
  const recent = resRecent && resRecent.ok ? await resRecent.json() : null;
  const alerts = resAlerts && resAlerts.ok ? await resAlerts.json() : null;
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
            Welcome back, {session.user.username}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor your inventory levels, alerts, and recent activities.
          </p>
        </div>
        {stats && <DashboardNotifications initial={{ lowStock: stats.lowStock, expiringSoon: stats.expiringSoon }} />}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Items" value={stats.items} icon={Boxes} tone="sky" />
          <StatCard label="Low Stock" value={stats.lowStock} icon={AlertTriangle} tone="red" />
          <StatCard label="Expiring Soon" value={stats.expiringSoon} icon={Clock} tone="amber" />
          <StatCard label="Transactions Today" value={stats.transactionsToday} icon={RefreshCw} tone="emerald" />
        </div>
      )}

      {/* Charts Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></span>
              Analytics Overview
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Visual insights into your inventory data</p>
          </div>
        </div>
        <DashboardCharts />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <SectionTitle>Recent Activity</SectionTitle>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
            <div className="space-y-4">
              {recent?.recent?.length ? (
                recent.recent.map((r: { id: number; itemName: string; warehouse: string; type: string; quantity: number; at: string; referenceDoc?: string }) => (
                  <RecentRow key={r.id} item={r} />
                ))
              ) : (
                <EmptyState>No recent activity to display.</EmptyState>
              )}
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="lg:col-span-1 space-y-6">
          <SectionTitle>Active Alerts</SectionTitle>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
            <div className="space-y-4">
              {alerts?.active?.length ? (
                alerts.active.map((a: any) => (
                  <AlertCard key={a.id} alert={a} />
                ))
              ) : (
                <EmptyState>No active alerts.</EmptyState>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type Tone = "sky" | "red" | "amber" | "emerald" | "violet";
function StatCard({ label, value, icon: Icon, tone = "sky" }: { label: string; value: number; icon?: React.ComponentType<any>; tone?: Tone }) {
  const styles: Record<Tone, { bg: string; ring: string; text: string; dot: string; glow: string }> = {
    sky: {
      bg: "bg-gradient-to-br from-sky-50 via-blue-50 to-white dark:from-sky-900/30 dark:via-blue-900/20 dark:to-gray-800/50",
      ring: "ring-sky-200/60 dark:ring-sky-800/40",
      text: "text-sky-700 dark:text-sky-300",
      dot: "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25",
      glow: "shadow-sky-500/20",
    },
    red: {
      bg: "bg-gradient-to-br from-rose-50 via-red-50 to-white dark:from-rose-900/30 dark:via-red-900/20 dark:to-gray-800/50",
      ring: "ring-rose-200/60 dark:ring-rose-800/40",
      text: "text-rose-700 dark:text-rose-300",
      dot: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/25",
      glow: "shadow-rose-500/20",
    },
    amber: {
      bg: "bg-gradient-to-br from-amber-50 via-orange-50 to-white dark:from-amber-900/30 dark:via-orange-900/20 dark:to-gray-800/50",
      ring: "ring-amber-200/60 dark:ring-amber-800/40",
      text: "text-amber-700 dark:text-amber-300",
      dot: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25",
      glow: "shadow-amber-500/20",
    },
    emerald: {
      bg: "bg-gradient-to-br from-emerald-50 via-green-50 to-white dark:from-emerald-900/30 dark:via-green-900/20 dark:to-gray-800/50",
      ring: "ring-emerald-200/60 dark:ring-emerald-800/40",
      text: "text-emerald-700 dark:text-emerald-300",
      dot: "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25",
      glow: "shadow-emerald-500/20",
    },
    violet: {
      bg: "bg-gradient-to-br from-violet-50 via-purple-50 to-white dark:from-violet-900/30 dark:via-purple-900/20 dark:to-gray-800/50",
      ring: "ring-violet-200/60 dark:ring-violet-800/40",
      text: "text-violet-700 dark:text-violet-300",
      dot: "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25",
      glow: "shadow-violet-500/20",
    },
  };
  const s = styles[tone];
  return (
    <div className={`relative rounded-2xl border ${s.bg} p-6 ring-1 ${s.ring} shadow-lg ${s.glow} backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-105`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</div>
        {Icon ? (
          <span className={`inline-flex items-center justify-center h-10 w-10 rounded-xl ${s.dot}`}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      <div className={`text-3xl font-bold ${s.text}`}>{value.toLocaleString()}</div>
      
      {/* Animated background element */}
      <div className="absolute inset-0 rounded-2xl opacity-5 bg-gradient-to-br from-transparent via-white to-transparent transform -skew-x-12"></div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-3">
      <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></span>
      {children}
    </h2>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-5h2m-4 0a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1h2a1 1 0 001-1v-1z" />
        </svg>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm">{children}</p>
    </div>
  );
}

function RecentRow({ item }: { item: any }) {
  const typeConfig = {
    receive: { 
      bg: "bg-gradient-to-r from-emerald-500 to-green-600", 
      text: "text-white",
      icon: "↗",
      label: "Received"
    },
    issue: { 
      bg: "bg-gradient-to-r from-blue-500 to-indigo-600", 
      text: "text-white",
      icon: "↙",
      label: "Issued"
    },
    adjustment: { 
      bg: "bg-gradient-to-r from-amber-500 to-orange-600", 
      text: "text-white",
      icon: "⚙",
      label: "Adjusted"
    }
  };
  
  const config = typeConfig[item.type as keyof typeof typeConfig] || typeConfig.adjustment;
  
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center text-white font-semibold shadow-lg`}>
          {config.icon}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.itemName}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span>{item.warehouse}</span>
            <span>•</span>
            <span>{new Date(item.at).toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{Math.abs(item.quantity).toLocaleString()}</span>
        <span className={`text-xs rounded-full px-3 py-1.5 font-medium ${config.bg} ${config.text} shadow-sm`}>
          {config.label}
        </span>
      </div>
    </div>
  );
}

async function AcknowledgeButton({ id }: { id: number }) {
  "use server";
  // Placeholder server action signature
  return null;
}

function AlertCard({ alert }: { alert: any }) {
  const priorityConfig = {
    high: { 
      bg: "bg-gradient-to-r from-red-500 to-rose-600", 
      text: "text-white",
      border: "border-red-200 dark:border-red-800",
      cardBg: "bg-red-50/50 dark:bg-red-900/20"
    },
    medium: { 
      bg: "bg-gradient-to-r from-amber-500 to-orange-600", 
      text: "text-white",
      border: "border-amber-200 dark:border-amber-800",
      cardBg: "bg-amber-50/50 dark:bg-amber-900/20"
    },
    low: { 
      bg: "bg-gradient-to-r from-sky-500 to-blue-600", 
      text: "text-white",
      border: "border-sky-200 dark:border-sky-800",
      cardBg: "bg-sky-50/50 dark:bg-sky-900/20"
    }
  };
  
  const config = priorityConfig[alert.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  
  return (
    <div className={`rounded-xl border ${config.border} ${config.cardBg} p-4 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{alert.inventory.itemName}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {alert.inventory.warehouse}
            {alert.batchNumber && (
              <>
                <span className="mx-1">•</span>
                <span className="font-medium">Batch: {alert.batchNumber}</span>
              </>
            )}
          </div>
        </div>
        <span className={`text-xs rounded-full px-3 py-1.5 font-medium ${config.bg} ${config.text} shadow-sm flex-shrink-0`}>
          {alert.priority.toUpperCase()}
        </span>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">{alert.message}</p>
        {alert.expiryDate && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Expiry: {new Date(alert.expiryDate).toLocaleDateString()}
            {alert.daysUntilExpiry !== undefined && (
              <span className="ml-2">
                ({alert.daysUntilExpiry <= 0 ? 'Expired' : `${alert.daysUntilExpiry} day${alert.daysUntilExpiry !== 1 ? 's' : ''} remaining`})
              </span>
            )}
          </p>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(alert.createdAt).toLocaleString()}
        </div>
        {alert.source !== 'batch_expiry' && (
          <form action={`/api/alerts/${alert.id}/acknowledge`} method="post">
            <button className="text-xs font-medium rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 text-gray-700 dark:text-gray-300">
              Acknowledge
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
