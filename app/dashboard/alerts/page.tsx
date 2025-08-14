"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type AlertRow = {
  id: number;
  type: "low_stock" | "expiring" | "negative_stock";
  priority: "low" | "medium" | "high";
  message: string;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  inventory: {
    id: number;
    itemName: string;
    barcode: string;
    warehouse: string;
  };
};

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Alert System</h1>
        <ul className="text-muted-foreground text-sm list-disc ml-5 mt-2 space-y-1">
          <li>Low stock alerts when quantity falls below alert level</li>
          <li>Expiration date warnings based on expire date alert settings</li>
          <li>Negative stock alerts (if issues exceed available stock)</li>
          <li>Dashboard showing all active alerts with priority levels</li>
          <li>Alert history and acknowledgment system</li>
        </ul>
      </div>
      <ActiveAlertsSections />
      <AlertsList />
    </div>
  );
}

function AlertsList() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");
  const [priority, setPriority] = useState("");
  const [type, setType] = useState("");
  const [ack, setAck] = useState("false"); // default show unacknowledged
  const [rows, setRows] = useState<AlertRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [sort, setSort] = useState("createdAt"); // createdAt | priority
  const [order, setOrder] = useState("desc"); // asc | desc
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  const load = async () => {
    setLoading(true);
    try {
  const params = new URLSearchParams({ q, limit: String(limit), page: String(page), sort, order });
      if (priority) params.set("priority", priority);
      if (type) params.set("type", type);
      if (ack) params.set("acknowledged", ack);
      const res = await fetch(`/api/alerts/list?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      setRows(json.rows || []);
      setTotal(json.total || 0);
      setSelected([]);
    } finally {
      setLoading(false);
    }
  };

  // Sync filters from URL query params whenever they change (e.g., clicking dashboard links)
  useEffect(() => {
    const qp = searchParams;
    if (!qp) return;
    const q0 = qp.get("q") || "";
    const pr0 = qp.get("priority") || "";
    const ty0 = qp.get("type") || "";
    const ack0 = qp.get("acknowledged");
    setQ(q0);
    setPriority(pr0);
    setType(ty0);
    if (ack0 === "true" || ack0 === "false" || ack0 === "") setAck(ack0 ?? "");
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    load();
  }, [page, sort, order, q, priority, type, ack]);

  // Poll for real-time-ish updates every 15s when viewing unacknowledged
  useEffect(() => {
    const id = setInterval(() => {
      if (ack === "false") load();
    }, 15000);
    return () => clearInterval(id);
  }, [ack, page, sort, order, q, priority, type]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const onBulkAck = async () => {
    if (!selected.length) return;
    for (const id of selected) {
      await fetch(`/api/alerts/${id}/acknowledge`, { method: "POST" });
    }
    await load();
  };

  return (
  <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
    <form onSubmit={onSearch} className="flex items-center gap-2 flex-wrap">
          <Input placeholder="Search message, item, barcode, warehouse" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">All types</option>
            <option value="low_stock">Low stock</option>
            <option value="expiring">Expiring</option>
            <option value="negative_stock">Negative stock</option>
          </select>
          <select value={ack} onChange={(e) => setAck(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="false">Unacknowledged</option>
            <option value="true">Acknowledged</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="createdAt">Sort by date</option>
            <option value="priority">Sort by priority</option>
          </select>
          <select value={order} onChange={(e) => setOrder(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <Button type="submit" size="sm" disabled={loading}>{loading ? "Loading…" : "Apply"}</Button>
        </form>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onBulkAck} disabled={!selected.length}>Acknowledge Selected</Button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No alerts.</div>
        ) : (
          rows.map((r) => (
            <AlertRowItem key={r.id} row={r} selected={selected.includes(r.id)} onToggle={() => setSelected((s) => s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id])} onAck={async () => { await fetch(`/api/alerts/${r.id}/acknowledge`, { method: "POST" }); await load(); }} />
          ))
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{total} total</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
          <div className="text-sm">Page {page}</div>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={rows.length < limit}>Next</Button>
        </div>
      </div>
    </div>
  );
}

function ActiveAlertsSections() {
  const [loading, setLoading] = useState(false);
  const [low, setLow] = useState<AlertRow[]>([]);
  const [exp, setExp] = useState<AlertRow[]>([]);
  const [neg, setNeg] = useState<AlertRow[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/alerts/active`, { cache: "no-store" });
        const json = await res.json();
        const rows = (json.rows || []) as any[];
        const mk = (r: any): AlertRow => ({
          id: r.inventory.id,
          type: r.type,
          priority: r.priority,
          message: r.message,
      createdAt: r.createdAt || new Date().toISOString(),
      acknowledged: true, // hide ack button in active sections (these are computed, not logged)
          acknowledgedBy: null,
          acknowledgedAt: null,
          inventory: {
            id: r.inventory.id,
            itemName: r.inventory.itemName,
            barcode: r.inventory.barcode,
            warehouse: r.inventory.warehouse,
          },
        });
        setLow(rows.filter((x) => x.type === "low_stock").map(mk));
        setExp(rows.filter((x) => x.type === "expiring").map(mk));
        setNeg(rows.filter((x) => x.type === "negative_stock").map(mk));
      } finally {
        setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const Section = ({ title, rows, type }: { title: string; rows: AlertRow[]; type: string }) => (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{title} <span className="text-xs text-muted-foreground">({rows.length})</span></h3>
        <Link href={`/dashboard/alerts?type=${encodeURIComponent(type)}&acknowledged=false`} className="text-xs text-primary underline">View all</Link>
      </div>
      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {!loading && rows.length === 0 && <div className="text-sm text-muted-foreground">No active alerts.</div>}
      <div className="mt-2 space-y-2">
        {rows.map((r) => (
          <div key={`${r.type}-${r.id}`} className="rounded-lg border px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs rounded-full px-2 py-1 ${r.priority === 'high' ? 'bg-red-100 text-red-700' : r.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>{r.priority.toUpperCase()}</span>
                  <span className="text-xs rounded-full px-2 py-1 bg-secondary/50">{r.type}</span>
                </div>
                <div className="font-medium truncate mt-1">{r.inventory.itemName} <span className="text-xs text-muted-foreground">({r.inventory.barcode})</span></div>
                <div className="text-xs text-muted-foreground truncate">{r.inventory.warehouse}</div>
                <div className="text-sm mt-1">{r.message}</div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/inventory?q=${encodeURIComponent(r.inventory.barcode)}`} className="text-xs rounded-md border px-2 py-1 hover:bg-accent">
                  View item
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Section title="Low stock" rows={low} type="low_stock" />
      <Section title="Expiring soon" rows={exp} type="expiring" />
      <Section title="Negative stock" rows={neg} type="negative_stock" />
    </div>
  );
}

function AlertRowItem({ row, selected, onToggle, onAck }: { row: AlertRow; selected: boolean; onToggle: () => void; onAck: () => Promise<void> }) {
  const color = useMemo(() => row.priority === "high" ? "bg-red-100 text-red-700" : row.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700", [row.priority]);
  return (
    <div className="rounded-lg border px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <input type="checkbox" className="mt-1" checked={selected} onChange={onToggle} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-xs rounded-full px-2 py-1 ${color}`}>{row.priority.toUpperCase()}</span>
              <span className="text-xs rounded-full px-2 py-1 bg-secondary/50">{row.type}</span>
              {!row.acknowledged && <span className="text-xs rounded-full px-2 py-1 bg-blue-100 text-blue-700">ACTIVE</span>}
            </div>
            <div className="font-medium truncate mt-1">{row.inventory.itemName} <span className="text-xs text-muted-foreground">({row.inventory.barcode})</span></div>
            <div className="text-xs text-muted-foreground truncate">{row.inventory.warehouse} • {new Date(row.createdAt).toLocaleString()}</div>
            <div className="text-sm mt-1">{row.message}</div>
            {row.acknowledged && (
              <div className="text-xs text-muted-foreground mt-1">Ack by {row.acknowledgedBy} • {row.acknowledgedAt ? new Date(row.acknowledgedAt).toLocaleString() : ''}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/inventory?q=${encodeURIComponent(row.inventory.barcode)}`} className="text-xs rounded-md border px-2 py-1 hover:bg-accent">
            View item
          </Link>
          {!row.acknowledged && (
            <Button size="sm" onClick={onAck}>Acknowledge</Button>
          )}
        </div>
      </div>
    </div>
  );
}
