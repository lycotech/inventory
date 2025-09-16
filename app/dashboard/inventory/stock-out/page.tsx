"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AccessControl } from "@/components/access-control";

export default function StockOutPage() {
  return (
    <AccessControl requiredRoles={["admin", "manager"]}>
      <StockOutContent />
    </AccessControl>
  );
}

function StockOutContent() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
            Stock Out
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Record items sold or consumed from inventory.
          </p>
        </div>
      </div>

      {/* Stock Out Card */}
      <div className="grid md:grid-cols-1 max-w-2xl mx-auto">
        <StockOutCard />
      </div>
    </div>
  );
}

function StockOutCard() {
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
        } else {
          setNotFound(true);
        }
      } catch {}
      setLookupLoading(false);
    })();
  }, [barcode, warehouseName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!found || !qty) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/inventory/stock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode,
          warehouseName,
          quantity: Number(qty),
          referenceDoc: ref || undefined,
          reason: reason || "Stock sold/consumed",
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setMsg("✅ Stock out recorded successfully!");
        setBarcode("");
        setWarehouseName("");
        setQty("");
        setRef("");
        setReason("");
        setFound(null);
        setNotFound(false);
      } else {
        setMsg(`❌ ${json.error || "Unknown error"}`);
      }
    } catch {
      setMsg("❌ Failed to record stock out");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Stock Out</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Remove inventory from stock (sales/consumption)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Barcode *
            </label>
            <Input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan or type barcode"
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Warehouse *
            </label>
            <select
              value={warehouseName}
              onChange={(e) => setWarehouseName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="">Select warehouse</option>
              {warehouses.map((wh, index) => {
                const warehouse = typeof wh === 'string' ? wh : String(wh);
                return (
                  <option key={`stock-out-warehouse-${index}-${warehouse}`} value={warehouse}>
                    {warehouse}
                  </option>
                );
              })}
            </select>
          </div>

          {lookupLoading && (
            <div className="text-blue-600 dark:text-blue-400 text-sm">
              🔍 Looking up item...
            </div>
          )}

          {found && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
              <p className="text-green-800 dark:text-green-200 text-sm">
                ✅ <strong>{found.itemName}</strong> — Current stock: {found.qty}
              </p>
            </div>
          )}

          {notFound && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-red-800 dark:text-red-200 text-sm">
                ❌ Item not found in this warehouse
              </p>
            </div>
          )}

          {found && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity to Remove *
                </label>
                <Input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g., 3"
                  min="1"
                  max={found.qty}
                  className="w-full"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Available: {found.qty} units
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reference Document
                </label>
                <Input
                  type="text"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  placeholder="e.g., SALE-001, INV-123"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason
                </label>
                <Input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Sold to customer, Used in production"
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !qty}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg shadow-red-500/25"
              >
                {loading ? "Recording..." : "Record Stock Out"}
              </Button>
            </>
          )}

          {msg && (
            <div className={`p-3 rounded-md text-sm ${
              msg.startsWith("✅") 
                ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700"
                : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700"
            }`}>
              {msg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
