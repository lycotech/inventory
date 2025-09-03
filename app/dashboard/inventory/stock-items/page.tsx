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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
            Stock Items
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and manage stock items with editable alert levels. Click on alert levels to edit.
          </p>
        </div>
      </div>

      {/* Stock Items Card */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Inventory Items</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Browse and edit stock alert levels</p>
          </div>
        </div>

        <form onSubmit={onSearch} className="flex items-center gap-3 flex-wrap mb-6">
          <Input
            placeholder="Search item name, barcode, category, warehouse"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:w-64 h-11 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
          />
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 h-11 px-6"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Searching...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </div>
            )}
          </Button>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-700 dark:text-gray-300">Warehouse:</label>
              <select
                className="h-9 border border-gray-300 dark:border-gray-600 rounded-md px-3 text-sm bg-gray-50 dark:bg-gray-700 focus:border-indigo-500 focus:ring-indigo-500"
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
              <label className="text-gray-700 dark:text-gray-300">Category:</label>
              <select
                className="h-9 border border-gray-300 dark:border-gray-600 rounded-md px-3 text-sm bg-gray-50 dark:bg-gray-700 focus:border-indigo-500 focus:ring-indigo-500"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); syncUrl({ category: e.target.value || "", page: 1 }); load(q, 1, limit, warehouse, e.target.value); }}
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-700 dark:text-gray-300">Per page:</label>
              <select
                className="h-9 border border-gray-300 dark:border-gray-600 rounded-md px-3 text-sm bg-gray-50 dark:bg-gray-700 focus:border-indigo-500 focus:ring-indigo-500"
                value={limit}
                onChange={(e) => onLimit(Number(e.target.value))}
              >
                {[10, 20, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </form>
        
        <div className="space-y-3">
          {rows.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">No items found.</p>
            </div>
          ) : (
            rows.map((r) => <RowView key={r.id} row={r} />)
          )}
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {pages} • Showing {rows.length} of {total} item{total === 1 ? "" : "s"}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => onPage(-1)} 
              disabled={page <= 1 || loading}
              className="h-9 px-4"
            >
              ← Prev
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => onPage(1)} 
              disabled={page >= pages || loading}
              className="h-9 px-4"
            >
              Next →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RowView({ row }: { row: Row }) {
  const [isEditing, setIsEditing] = useState(false);
  const [alertLevel, setAlertLevel] = useState(row.alert);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const badge = row.qty <= row.alert ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";

  // Safe formatting functions to avoid hydration issues
  const formatQuantity = (quantity: number) => {
    if (!mounted) return "0";
    return quantity.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    if (!mounted) return "Loading...";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  const saveAlert = async () => {
    if (alertLevel === row.alert) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const response = await fetch(`/api/inventory/update-alert`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: row.id,
          stockAlertLevel: alertLevel
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update alert level');
      }

      setMsg('✓ Updated');
      row.alert = alertLevel; // Update local data
      setTimeout(() => setMsg(null), 2000);
      setIsEditing(false);
    } catch (error: any) {
      setMsg(`Error: ${error.message}`);
      setTimeout(() => setMsg(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setAlertLevel(row.alert);
    setIsEditing(false);
    setMsg(null);
  };

  return (
    <div className="rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 px-4 py-3 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {row.itemName} 
            <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">({row.barcode})</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 flex-wrap mt-1">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {row.warehouse}
            </span>
            {row.expireDate && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Expires {formatDate(row.expireDate)}
                </span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
              {formatQuantity(row.qty)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Stock</div>
          </div>
          
          <div className="text-center">
            {isEditing ? (
              <div className="flex flex-col items-center gap-1">
                <input
                  type="number"
                  value={alertLevel}
                  onChange={(e) => setAlertLevel(Number(e.target.value) || 0)}
                  className="w-16 h-8 text-sm text-center border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 focus:border-blue-500 focus:ring-blue-500"
                  disabled={loading}
                  autoFocus
                />
                <div className="flex gap-1">
                  <button
                    onClick={saveAlert}
                    disabled={loading}
                    className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50"
                  >
                    {loading ? '...' : '✓'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={loading}
                    className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-semibold tabular-nums text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 cursor-pointer"
                >
                  {formatQuantity(row.alert)}
                </button>
                <div className="text-xs text-gray-500 dark:text-gray-400">Alert Level</div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-1">
            <span className={`text-xs rounded-full px-2 py-1 font-medium ${badge}`}>
              {row.qty <= row.alert ? "LOW" : "OK"}
            </span>
          </div>
        </div>
      </div>
      
      {msg && (
        <div className={`mt-2 text-xs px-2 py-1 rounded ${
          msg.includes('Error') ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
        }`}>
          {msg}
        </div>
      )}
    </div>
  );
}
