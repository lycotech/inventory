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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
            Inventory Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Record stock movements and review transaction history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => window.location.href = '/dashboard/inventory/stock-items'}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 h-11 px-6"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Manage Stock Items
          </Button>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        <ReceiveCard />
        <TransferCard />
      </div>

      {/* History */}
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
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <span className="text-white font-semibold text-lg">↗</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Receive Stock</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Add inventory to warehouse</p>
        </div>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Barcode</label>
          <Input 
            value={barcode} 
            onChange={(e) => setBarcode(e.target.value)} 
            placeholder="Scan or type barcode" 
            className="h-11 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500"
          />
          {lookupLoading && (
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-2">
              <div className="w-3 h-3 border border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              Looking up item...
            </div>
          )}
          {!lookupLoading && found && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
              <strong>{found.itemName}</strong> • Current stock: {found.qty}
            </div>
          )}
          {!lookupLoading && !found && notFound && warehouseName && barcode && (
            <div className="text-xs text-red-600 dark:text-red-400 mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
              Item not found in this warehouse
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Warehouse</label>
          {warehouses.length ? (
            <select 
              value={warehouseName} 
              onChange={(e) => setWarehouseName(e.target.value)} 
              className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-3 text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:text-gray-100"
            >
              <option value="">Select a warehouse</option>
              {warehouses.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          ) : (
            <Input 
              value={warehouseName} 
              onChange={(e) => setWarehouseName(e.target.value)} 
              placeholder="e.g. Main Warehouse" 
              className="h-11 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500"
            />
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
            <Input 
              type="number" 
              value={qty} 
              onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))} 
              className="h-11 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reference</label>
            <Input 
              value={ref} 
              onChange={(e) => setRef(e.target.value)} 
              placeholder="e.g. GRN-001" 
              className="h-11 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason (Optional)</label>
          <Input 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            placeholder="Purchase order, return, etc." 
            className="h-11 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <Button 
            type="submit" 
            disabled={!barcode || !warehouseName || !qty || loading}
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-6"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              "Receive Stock"
            )}
          </Button>
          {msg && (
            <span className={`text-sm font-medium ${msg.includes('success') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {msg}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function TransferCard() {
  const [barcode, setBarcode] = useState("");
  const [fromWarehouseName, setFromWarehouseName] = useState("");
  const [toWarehouseName, setToWarehouseName] = useState("");
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
      if (!barcode || !fromWarehouseName) return;
      setLookupLoading(true);
      try {
        const res = await fetch(`/api/inventory/lookup?barcode=${encodeURIComponent(barcode)}&warehouseName=${encodeURIComponent(fromWarehouseName)}`, { cache: "no-store" });
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
  }, [barcode, fromWarehouseName]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
  if (!barcode || !fromWarehouseName || !toWarehouseName || !qty) return;
    try {
      setLoading(true);
      const res = await fetch("/api/inventory/transfer", {
        method: "POST",
        headers: { "content-type": "application/json" },
    body: JSON.stringify({ 
      barcode, 
      fromWarehouse: fromWarehouseName, 
      toWarehouse: toWarehouseName, 
      quantity: Number(qty), 
      referenceDoc: ref || undefined, 
      reason: reason || undefined 
    }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to transfer");
      setMsg("Transferred successfully");
      setQty("");
      window.dispatchEvent(new CustomEvent("inventory:changed"));
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
          <span className="text-white font-semibold text-lg">⇄</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Stock Transfer</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Transfer inventory between warehouses</p>
        </div>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Barcode</label>
          <Input 
            value={barcode} 
            onChange={(e) => setBarcode(e.target.value)} 
            placeholder="Scan or type barcode" 
            className="h-11 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
          />
          {lookupLoading && (
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-2">
              <div className="w-3 h-3 border border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              Looking up item...
            </div>
          )}
          {!lookupLoading && found && (
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
              <strong>{found.itemName}</strong> • Available: {found.qty}
            </div>
          )}
          {!lookupLoading && !found && notFound && fromWarehouseName && barcode && (
            <div className="text-xs text-red-600 dark:text-red-400 mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
              Item not found in this warehouse
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From Warehouse</label>
          {warehouses.length ? (
            <select 
              value={fromWarehouseName} 
              onChange={(e) => setFromWarehouseName(e.target.value)} 
              className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-3 text-sm focus:border-green-500 focus:ring-green-500 dark:text-gray-100"
            >
              <option value="">Select source warehouse</option>
              {warehouses.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          ) : (
            <Input 
              value={fromWarehouseName} 
              onChange={(e) => setFromWarehouseName(e.target.value)} 
              placeholder="e.g. Main Warehouse" 
              className="h-11 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
            />
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To Warehouse</label>
          {warehouses.length ? (
            <select 
              value={toWarehouseName} 
              onChange={(e) => setToWarehouseName(e.target.value)} 
              className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-3 text-sm focus:border-green-500 focus:ring-green-500 dark:text-gray-100"
            >
              <option value="">Select destination warehouse</option>
              {warehouses.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          ) : (
            <Input 
              value={toWarehouseName} 
              onChange={(e) => setToWarehouseName(e.target.value)} 
              placeholder="e.g. Branch Warehouse" 
              className="h-11 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
            />
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
            <Input 
              type="number" 
              value={qty} 
              onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))} 
              className="h-11 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reference</label>
            <Input 
              value={ref} 
              onChange={(e) => setRef(e.target.value)} 
              placeholder="e.g. TRF-001" 
              className="h-11 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason (Optional)</label>
          <Input 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            placeholder="Warehouse relocation, stock optimization, etc." 
            className="h-11 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
          />
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <Button 
            type="submit" 
            disabled={!barcode || !fromWarehouseName || !toWarehouseName || !qty || loading}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-6"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              "Transfer Stock"
            )}
          </Button>
          {msg && (
            <span className={`text-sm font-medium ${msg.includes('success') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {msg}
            </span>
          )}
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
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Transaction History</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Recent inventory movements</p>
          </div>
        </div>
        
        <form onSubmit={onSearch} className="flex items-center gap-3 w-full sm:w-auto">
          <Input 
            placeholder="Search items, barcodes..." 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            className="w-full sm:w-64 h-10 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500" 
          />
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 h-10 px-4"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Searching...
              </div>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </Button>
        </form>
      </div>
      
      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No transaction history found.</p>
          </div>
        ) : (
          rows.map((r) => <HistoryRow key={r.id} row={r} />)
        )}
      </div>
    </div>
  );
}

function HistoryRow({ row }: { row: TxRow }) {
  const typeConfig = useMemo(() => {
    const configs = {
      receive: { 
        bg: "bg-gradient-to-r from-emerald-500 to-green-600", 
        text: "text-white",
        icon: "↗",
        label: "Received",
        cardBg: "bg-emerald-50/50 dark:bg-emerald-900/20",
        border: "border-emerald-200/50 dark:border-emerald-800/50"
      },
      issue: { 
        bg: "bg-gradient-to-r from-blue-500 to-indigo-600", 
        text: "text-white",
        icon: "↙",
        label: "Issued",
        cardBg: "bg-blue-50/50 dark:bg-blue-900/20",
        border: "border-blue-200/50 dark:border-blue-800/50"
      },
      adjustment: { 
        bg: "bg-gradient-to-r from-amber-500 to-orange-600", 
        text: "text-white",
        icon: "⚙",
        label: "Adjusted",
        cardBg: "bg-amber-50/50 dark:bg-amber-900/20",
        border: "border-amber-200/50 dark:border-amber-800/50"
      }
    };
    return configs[row.type as keyof typeof configs] || configs.adjustment;
  }, [row.type]);

  return (
    <div className={`rounded-xl border ${typeConfig.border} ${typeConfig.cardBg} p-4 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className={`w-10 h-10 rounded-xl ${typeConfig.bg} flex items-center justify-center text-white font-semibold shadow-lg flex-shrink-0`}>
            {typeConfig.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {row.itemName} 
              <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">({row.barcode})</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 flex-wrap">
              <span>{row.warehouse}</span>
              <span>•</span>
              <span>{new Date(row.at).toLocaleString()}</span>
              <span>•</span>
              <span>by {row.by}</span>
            </div>
            {(row.referenceDoc || row.reason) && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                {row.referenceDoc && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">{row.referenceDoc}</span>}
                {row.reason && <span>{row.reason}</span>}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
            {row.type === 'issue' ? '-' : '+'}{Math.abs(row.quantity).toLocaleString()}
          </span>
          <span className={`text-xs rounded-full px-3 py-1.5 font-medium ${typeConfig.bg} ${typeConfig.text} shadow-sm`}>
            {typeConfig.label}
          </span>
        </div>
      </div>
    </div>
  );
}
