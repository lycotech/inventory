import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { headers } from "next/headers";
import { DashboardNotifications } from "@/components/dashboard/notifications";

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Welcome, {session.user.username}</h1>
        <LogoutButton />
      </div>
  {stats && <DashboardNotifications initial={{ lowStock: stats.lowStock, expiringSoon: stats.expiringSoon }} />}
      <p className="text-muted-foreground">Monitor your inventory levels, alerts, and recent activities.</p>
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          <StatCard label="Items" value={stats.items} />
          <StatCard label="Low stock" value={stats.lowStock} />
          <StatCard label="Expiring soon" value={stats.expiringSoon} />
          <StatCard label="Tx today" value={stats.transactionsToday} />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionTitle>Recent Activity</SectionTitle>
          <div className="space-y-3">
            {recent?.recent?.length ? (
              recent.recent.map((r: any) => (
                <RecentRow key={r.id} item={r} />
              ))
            ) : (
              <EmptyState>Nothing yet.</EmptyState>
            )}
          </div>
        </div>
        <div className="lg:col-span-1">
          <SectionTitle>Active Alerts</SectionTitle>
          <div className="space-y-3">
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
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-medium mb-3">{children}</h2>;
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border p-6 text-sm text-muted-foreground">{children}</div>;
}

function RecentRow({ item }: { item: any }) {
  const badge = item.type === "receive" ? "bg-emerald-100 text-emerald-700" : item.type === "issue" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700";
  return (
    <div className="rounded-lg border bg-card px-4 py-3 flex items-center justify-between">
      <div>
        <div className="font-medium">{item.itemName}</div>
        <div className="text-xs text-muted-foreground">{item.warehouse} • {new Date(item.at).toLocaleString()}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">{item.quantity}</span>
        <span className={`text-xs rounded-full px-2 py-1 ${badge}`}>{item.type}</span>
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
  const priorityColor = alert.priority === "high" ? "bg-red-100 text-red-700" : alert.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700";
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{alert.inventory.itemName}</div>
          <div className="text-xs text-muted-foreground">{alert.inventory.warehouse}</div>
          <div className="text-sm mt-1">{alert.message}</div>
        </div>
        <span className={`text-xs rounded-full px-2 py-1 ${priorityColor}`}>{alert.priority.toUpperCase()}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</div>
        <form action={`/api/alerts/${alert.id}/acknowledge`} method="post">
          <button className="text-xs rounded-md border px-2 py-1 hover:bg-accent">Acknowledge</button>
        </form>
      </div>
    </div>
  );
}
