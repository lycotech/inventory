"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

type TxRow = {
  id: number;
  at: string;
  type: "receive" | "issue" | "adjustment";
  barcode: string;
  itemName: string;
  warehouse: string;
  quantity: number;
  referenceDoc?: string;
  reason?: string;
  by: string;
};

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="text-muted-foreground text-sm">Record stock movements and review history.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ReceiveCard />
        <IssueCard />
      </div>

      <HistoryCard />
    </div>
  );
}

function ReceiveCard() {
  const [barcode, setBarcode] = useState("");
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [found, setFound] = useState<{ itemName: string; qty: number } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState<number | "">("");
  const [ref, setRef] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/warehouses/list', { cache: 'no-store' });
        const json = await res.json();
        if (Array.isArray(json.warehouses)) setWarehouses(json.warehouses);
      } catch {}
    })();
  }, []);

  // Lookup item as soon as both barcode and warehouse are present
  useEffect(() => {
    (async () => {
      setFound(null);
      setNotFound(false);
      setLookupLoading(false);
      if (!barcode || !warehouseName) return;
      setLookupLoading(true);
      try {
        const res = await fetch(`/api/inventory/lookup?barcode=${encodeURIComponent(barcode)}&warehouseName=${encodeURIComponent(warehouseName)}`, { cache: "no-store" });
        const json = await res.json();
        if (json.found) {
          setFound({ itemName: json.item.itemName, qty: json.item.qty });
          setNotFound(false);
        } else {
          setFound(null);
          setNotFound(true);
        }
      } catch {
        setFound(null);
        setNotFound(true);
      } finally {
        setLookupLoading(false);
      }
    })();
  }, [barcode, warehouseName]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
  if (!barcode || !warehouseName || !qty) return;
    try {
      setLoading(true);
      const res = await fetch("/api/inventory/receive", {
        method: "POST",
        headers: { "content-type": "application/json" },
    body: JSON.stringify({ barcode, warehouseName, quantity: Number(qty), referenceDoc: ref || undefined, reason: reason || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to receive");
      setMsg("Received successfully");
      setQty("");
      // Optionally trigger history reload via a custom event
      window.dispatchEvent(new CustomEvent("inventory:changed"));
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-lg font-medium">Receive Stock</h2>
      <form onSubmit={onSubmit} className="mt-3 grid gap-3">
        <div>
          <label className="text-sm font-medium">Barcode</label>
          <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan or type barcode" />
          {lookupLoading && <div className="text-xs text-muted-foreground mt-1">Looking up…</div>}
          {!lookupLoading && found && <div className="text-xs text-muted-foreground mt-1">{found.itemName} • Qty: {found.qty}</div>}
          {!lookupLoading && !found && notFound && warehouseName && barcode && (
            <div className="text-xs text-red-600 mt-1">Item not in this warehouse</div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Warehouse</label>
          {warehouses.length ? (
            <select value={warehouseName} onChange={(e) => setWarehouseName(e.target.value)} className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select a warehouse</option>
              {warehouses.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          ) : (
            <Input value={warehouseName} onChange={(e) => setWarehouseName(e.target.value)} placeholder="e.g. Main" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Quantity</label>
            <Input type="number" value={qty} onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm font-medium">Reference</label>
            <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. GRN-001" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Reason</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!barcode || !warehouseName || !qty || loading}>{loading ? "Saving…" : "Receive"}</Button>
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
        </div>
      </form>
    </div>
  );
}

function IssueCard() {
  const [barcode, setBarcode] = useState("");
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [found, setFound] = useState<{ itemName: string; qty: number } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState<number | "">("");
  const [ref, setRef] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/warehouses/list', { cache: 'no-store' });
        const json = await res.json();
        if (Array.isArray(json.warehouses)) setWarehouses(json.warehouses);
      } catch {}
    })();
  }, []);

  // Lookup item as soon as both barcode and warehouse are present
  useEffect(() => {
    (async () => {
      setFound(null);
      setNotFound(false);
      setLookupLoading(false);
      if (!barcode || !warehouseName) return;
      setLookupLoading(true);
      try {
        const res = await fetch(`/api/inventory/lookup?barcode=${encodeURIComponent(barcode)}&warehouseName=${encodeURIComponent(warehouseName)}`, { cache: "no-store" });
        const json = await res.json();
        if (json.found) {
          setFound({ itemName: json.item.itemName, qty: json.item.qty });
          setNotFound(false);
        } else {
          setFound(null);
          setNotFound(true);
        }
      } catch {
        setFound(null);
        setNotFound(true);
      } finally {
        setLookupLoading(false);
      }
    })();
  }, [barcode, warehouseName]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
  if (!barcode || !warehouseName || !qty) return;
    try {
      setLoading(true);
      const res = await fetch("/api/inventory/issue", {
        method: "POST",
        headers: { "content-type": "application/json" },
    body: JSON.stringify({ barcode, warehouseName, quantity: Number(qty), referenceDoc: ref || undefined, reason: reason || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to issue");
      setMsg("Issued successfully");
      setQty("");
      window.dispatchEvent(new CustomEvent("inventory:changed"));
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-lg font-medium">Issue Stock</h2>
      <form onSubmit={onSubmit} className="mt-3 grid gap-3">
        <div>
          <label className="text-sm font-medium">Barcode</label>
          <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan or type barcode" />
          {lookupLoading && <div className="text-xs text-muted-foreground mt-1">Looking up…</div>}
          {!lookupLoading && found && <div className="text-xs text-muted-foreground mt-1">{found.itemName} • Qty: {found.qty}</div>}
          {!lookupLoading && !found && notFound && warehouseName && barcode && (
            <div className="text-xs text-red-600 mt-1">Item not in this warehouse</div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Warehouse</label>
          {warehouses.length ? (
            <select value={warehouseName} onChange={(e) => setWarehouseName(e.target.value)} className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select a warehouse</option>
              {warehouses.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          ) : (
            <Input value={warehouseName} onChange={(e) => setWarehouseName(e.target.value)} placeholder="e.g. Main" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Quantity</label>
            <Input type="number" value={qty} onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm font-medium">Reference</label>
            <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. ISS-001" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Reason</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!barcode || !warehouseName || !qty || loading} variant="outline">{loading ? "Saving…" : "Issue"}</Button>
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
        </div>
      </form>
    </div>
  );
}

function HistoryCard() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const [q, setQ] = useState(initialQ);
  const [rows, setRows] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/history?q=${encodeURIComponent(query)}&limit=50`, { cache: "no-store" });
      const json = await res.json();
      setRows(json.rows || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(initialQ);
    const handler = () => load(q);
    window.addEventListener("inventory:changed", handler as any);
    return () => window.removeEventListener("inventory:changed", handler as any);
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(q);
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-medium">History</h2>
        <form onSubmit={onSearch} className="flex items-center gap-2">
          <Input placeholder="Search barcode, item, ref, reason" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          <Button type="submit" size="sm" disabled={loading}>{loading ? "Searching…" : "Search"}</Button>
        </form>
      </div>
      <div className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No records.</div>
        ) : (
          rows.map((r) => <HistoryRow key={r.id} row={r} />)
        )}
      </div>
    </div>
  );
}

function HistoryRow({ row }: { row: TxRow }) {
  const badge = useMemo(() => {
    return row.type === "receive" ? "bg-emerald-100 text-emerald-700" : row.type === "issue" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700";
  }, [row.type]);
  return (
    <div className="rounded-lg border px-4 py-3 flex items-center justify-between">
      <div className="min-w-0">
        <div className="font-medium truncate">{row.itemName} <span className="text-xs text-muted-foreground">({row.barcode})</span></div>
        <div className="text-xs text-muted-foreground truncate">{row.warehouse} • {new Date(row.at).toLocaleString()} • by {row.by}</div>
        {(row.referenceDoc || row.reason) && (
          <div className="text-xs text-muted-foreground truncate">{row.referenceDoc ? `${row.referenceDoc}` : ''}{row.referenceDoc && row.reason ? ' • ' : ''}{row.reason || ''}</div>
        )}
      </div>
      <div className="flex items-center gap-3 ml-3">
        <span className="text-sm font-semibold tabular-nums">{row.quantity}</span>
        <span className={`text-xs rounded-full px-2 py-1 ${badge}`}>{row.type}</span>
      </div>
    </div>
  );
}
