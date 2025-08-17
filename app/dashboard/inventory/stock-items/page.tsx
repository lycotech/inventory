"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";

interface Row {
  id: number;
  barcode: string;
  itemName: string;
  warehouse: string;
  qty: number;
  alert: number;
  expireDate?: string | null;
}

export default function StockItemsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";
  const initialPage = Number(searchParams.get("page") || 1) || 1;
  const initialLimit = Number(searchParams.get("limit") || 20) || 20;
  const initialWh = searchParams.get("warehouse") || "";
  const initialCat = searchParams.get("category") || "";

  const [q, setQ] = useState(initialQ);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [warehouse, setWarehouse] = useState(initialWh);
  const [category, setCategory] = useState(initialCat);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / Math.max(1, limit))), [total, limit]);

  const syncUrl = (next: { q?: string; page?: number; limit?: number; warehouse?: string; category?: string }) => {
    const url = new URL(window.location.href);
    const sp = url.searchParams;
    if (next.q !== undefined) sp.set("q", next.q);
    if (next.page !== undefined) sp.set("page", String(next.page));
    if (next.limit !== undefined) sp.set("limit", String(next.limit));
    if (next.warehouse !== undefined) {
      if (next.warehouse) sp.set("warehouse", next.warehouse); else sp.delete("warehouse");
    }
    if (next.category !== undefined) {
      if (next.category) sp.set("category", next.category); else sp.delete("category");
    }
    router.replace(`${url.pathname}?${sp.toString()}`);
  };

  const load = async (qVal: string, pageVal: number, limitVal: number, warehouseVal: string, categoryVal: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/list?q=${encodeURIComponent(qVal)}&page=${pageVal}&limit=${limitVal}&warehouse=${encodeURIComponent(warehouseVal || "")}&category=${encodeURIComponent(categoryVal || "")}`, { cache: "no-store" });
      const json = await res.json();
      setRows(json.rows || []);
      setTotal(json.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(initialQ, initialPage, initialLimit, initialWh, initialCat);
    (async () => {
      try {
        const [w, c] = await Promise.all([
          fetch("/api/warehouses/list", { cache: "no-store" }).then(r => r.ok ? r.json() : { warehouses: [] }).catch(() => ({ warehouses: [] })),
          fetch("/api/categories/list", { cache: "no-store" }).then(r => r.ok ? r.json() : { categories: [] }).catch(() => ({ categories: [] })),
        ]);
        setWarehouses(w.warehouses || []);
        setCategories(c.categories || []);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    syncUrl({ q, page: 1, limit, warehouse, category });
    load(q, 1, limit, warehouse, category);
  };

  const onPage = (dir: -1 | 1) => {
    const next = Math.min(pages, Math.max(1, page + dir));
    if (next === page) return;
    setPage(next);
  syncUrl({ page: next });
  load(q, next, limit, warehouse, category);
  };

  const onLimit = (val: number) => {
    const v = Math.max(1, Math.min(200, val || 20));
    setLimit(v);
    setPage(1);
  syncUrl({ limit: v, page: 1 });
  load(q, 1, v, warehouse, category);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Stock Item</h1>
        <p className="text-muted-foreground text-sm">Showing all stock items with pagination and search.</p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <form onSubmit={onSearch} className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Search item name, barcode, category, warehouse"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-64"
          />
          <Button type="submit" size="sm" disabled={loading}>{loading ? "Searching…" : "Search"}</Button>
          <div className="flex items-center gap-2 text-sm">
            <span>Warehouse</span>
            <select
              className="border rounded-md px-2 py-1 text-sm"
              value={warehouse}
              onChange={(e) => { setWarehouse(e.target.value); setPage(1); syncUrl({ warehouse: e.target.value || "", page: 1 }); load(q, 1, limit, e.target.value, category); }}
            >
              <option value="">All</option>
              {warehouses.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Category</span>
            <select
              className="border rounded-md px-2 py-1 text-sm"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); syncUrl({ category: e.target.value || "", page: 1 }); load(q, 1, limit, warehouse, e.target.value); }}
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span>Per page</span>
            <select
              className="border rounded-md px-2 py-1 text-sm"
              value={limit}
              onChange={(e) => onLimit(Number(e.target.value))}
            >
              {[10, 20, 50, 100, 200].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </form>
        <div className="mt-3 space-y-2">
          {rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No items found.</div>
          ) : (
            rows.map((r) => <RowView key={r.id} row={r} />)
          )}
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span>
            Page {page} of {pages} • {total} item{total === 1 ? "" : "s"}
          </span>
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
  const badge = row.qty <= row.alert ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700";
  return (
    <div className="rounded-lg border px-4 py-3 flex items-center justify-between">
      <div className="min-w-0">
        <div className="font-medium truncate">{row.itemName} <span className="text-xs text-muted-foreground">({row.barcode})</span></div>
        <div className="text-xs text-muted-foreground truncate">{row.warehouse}{row.expireDate ? ` • Expires ${new Date(row.expireDate).toLocaleDateString()}` : ""}</div>
      </div>
      <div className="flex items-center gap-3 ml-3">
        <span className="text-sm font-semibold tabular-nums">{row.qty}</span>
        <span className={`text-xs rounded-full px-2 py-1 ${badge}`}>{row.qty <= row.alert ? "Low" : "OK"}</span>
      </div>
    </div>
  );
}
