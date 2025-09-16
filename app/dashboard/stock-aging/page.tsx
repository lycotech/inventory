"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Row {
  id: number;
  inventoryId: number;
  batchNumber?: string | null;
  receiveDate: string;
  quantityReceived: number;
  quantityRemaining: number;
  agingDays: number;
  status: string;
  lastMovementDate?: string | null;
  createdAt: string;
  updatedAt: string;
  itemName: string;
  barcode: string;
  warehouseName: string;
  category: string;
  agingCategoryName?: string | null;
  agingColor?: string | null;
}

export default function StockAgingPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [warehouse, setWarehouse] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const pages = useMemo(() => Math.max(1, Math.ceil(total / Math.max(1, limit))), [total, limit]);

  const load = async (opts?: { q?: string; page?: number; limit?: number; warehouse?: string; category?: string; status?: string }) => {
    const query = new URLSearchParams();
    query.set("q", (opts?.q ?? q) || "");
    query.set("page", String(opts?.page ?? page));
    query.set("limit", String(opts?.limit ?? limit));
    if ((opts?.warehouse ?? warehouse)) query.set("warehouse", (opts?.warehouse ?? warehouse));
    if ((opts?.category ?? category)) query.set("category", (opts?.category ?? category));
    if ((opts?.status ?? status)) query.set("status", (opts?.status ?? status));
    setLoading(true);
    try {
      const res = await fetch(`/api/stock-aging/list?${query.toString()}`, { cache: "no-store" });
      const json = await res.json();
      setRows(json.rows || []);
      setTotal(json.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ page: 1 });
    (async () => {
      try {
        const [w, c] = await Promise.all([
          fetch("/api/warehouses/list", { cache: "no-store" }).then(r => r.ok ? r.json() : { warehouses: [] }).catch(() => ({ warehouses: [] })),
          fetch("/api/categories/list", { cache: "no-store" }).then(r => r.ok ? r.json() : { categories: [] }).catch(() => ({ categories: [] })),
        ]);
        setWarehouses(w.warehouses || []);
        setCategories(c.categories?.map((x: string | { categoryName: string }) => typeof x === 'string' ? x : x.categoryName || x) || []);
      } catch {}
    })();
  }, []);

  const onSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load({ q, page: 1 }); };
  const onPage = (d: -1 | 1) => { const nx = Math.min(pages, Math.max(1, page + d)); if (nx !== page) { setPage(nx); load({ page: nx }); } };
  const onLimit = (n: number) => { const v = Math.max(1, Math.min(200, n)); setLimit(v); setPage(1); load({ page: 1, limit: v }); };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Stock Aging</h1>
        <p className="text-muted-foreground text-sm">Insights into inventory aging to identify slow-moving or at-risk stock.</p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <form onSubmit={onSearch} className="flex items-center gap-2 flex-wrap">
          <Input placeholder="Search item, barcode or batch" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          <Button type="submit" size="sm" disabled={loading}>{loading ? "Searching…" : "Search"}</Button>
          <div className="flex items-center gap-2 text-sm">
            <span>Warehouse</span>
            <select className="border rounded-md px-2 py-1 text-sm" value={warehouse} onChange={(e) => { setWarehouse(e.target.value); setPage(1); load({ page: 1, warehouse: e.target.value }); }}>
              <option value="">All</option>
              {warehouses.map((w, index) => {
                const warehouse = typeof w === 'string' ? w : String(w);
                return <option key={`aging-warehouse-${index}-${warehouse}`} value={warehouse}>{warehouse}</option>;
              })}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Category</span>
            <select className="border rounded-md px-2 py-1 text-sm" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); load({ page: 1, category: e.target.value }); }}>
              <option value="">All</option>
              {categories.map((c, index) => {
                const category = typeof c === 'string' ? c : String(c);
                return <option key={`aging-category-${index}-${category}`} value={category}>{category}</option>;
              })}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Status</span>
            <select className="border rounded-md px-2 py-1 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); load({ page: 1, status: e.target.value }); }}>
              <option value="">All</option>
              {['active','issue','expired','adjusted'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span>Per page</span>
            <select className="border rounded-md px-2 py-1 text-sm" value={limit} onChange={(e) => onLimit(Number(e.target.value))}>
              {[10,20,50,100,200].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </form>

        <div className="mt-3 space-y-2">
          {rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No records.</div>
          ) : (
            rows.map(r => <RowView key={r.id} row={r} />)
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span>Page {page} of {pages} • {total} record{total === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onPage(-1)} disabled={page <= 1 || loading}>Prev</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onPage(1)} disabled={page >= pages || loading}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RowView({ row }: { row: Row }) {
  const color = row.agingColor || (row.agingDays <= 30 ? '#28a745' : row.agingDays <= 60 ? '#72b01d' : row.agingDays <= 90 ? '#ffc107' : row.agingDays <= 180 ? '#fd7e14' : '#dc3545');
  return (
    <div className="rounded-lg border px-4 py-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-medium truncate">{row.itemName} <span className="text-xs text-muted-foreground">({row.barcode})</span></div>
          <div className="text-xs text-muted-foreground truncate">{row.warehouseName} • Batch {row.batchNumber || '-'} • Received {new Date(row.receiveDate).toLocaleDateString()}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm tabular-nums">Recv {row.quantityReceived}</span>
          <span className="text-sm tabular-nums">Remain {row.quantityRemaining}</span>
          <span className="text-xs rounded-full px-2 py-1" style={{ backgroundColor: color, color: '#fff' }}>{row.agingCategoryName || `${row.agingDays}d`}</span>
        </div>
      </div>
      {row.lastMovementDate && <div className="text-xs text-muted-foreground mt-1">Last move {new Date(row.lastMovementDate).toLocaleString()}</div>}
    </div>
  );
}
