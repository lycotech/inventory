"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ImportResult = {
  ok: boolean;
  importId?: number;
  summary?: {
    total: number;
    successful: number;
    failed: number;
  };
  errors?: { row: number; message: string }[];
};

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("full");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("importType", type);
      const res = await fetch("/api/import", { method: "POST", body: fd });
      
      // Check if response is ok and has content
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error (${res.status}): ${errorText || 'Unknown error'}`);
      }
      
      // Check if response has JSON content
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await res.text();
        throw new Error(`Invalid response format. Expected JSON but got: ${responseText.substring(0, 200)}...`);
      }
      
      const json = await res.json();
      setResult(json);
      if (res.ok) {
        // Trigger stock reload below
        window.dispatchEvent(new CustomEvent("stock:changed"));
      }
    } catch (e) {
      console.error('Import error:', e);
      setResult({ ok: false, errors: [{ row: 0, message: (e as Error).message }] });
    } finally {
      setLoading(false);
    }
  };

  const templateUrl = (t: string) => `/api/import/template/${encodeURIComponent(t)}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
            Import Data
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Upload and process inventory data from Excel (.xlsx) files.
          </p>
        </div>
      </div>

      {/* Import Card */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Upload File</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Select import type and upload your data</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Import Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-3 text-sm focus:border-blue-500 focus:ring-blue-500 dark:text-gray-100"
              >
                <option value="full">Full inventory</option>
                <option value="stock_receive">Stock receive</option>
                <option value="stock_transfer">Stock transfer</option>
                <option value="stock_out">Stock out (sales/consumption)</option>
                <option value="stock_alert">Stock alert levels</option>
                <option value="adjustment">Adjustment</option>
              </select>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">📥 Download CSV Templates:</p>
                <div className="flex flex-wrap gap-2">
                  <a className="text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors" href={templateUrl("full")}>full</a>
                  <a className="text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors" href={templateUrl("stock_receive")}>stock_receive</a>
                  <a className="text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors" href={templateUrl("stock_transfer")}>stock_transfer</a>
                  <a className="text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors" href={templateUrl("stock_out")}>stock_out</a>
                  <a className="text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors" href={templateUrl("stock_alert")}>stock_alert</a>
                  <a className="text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors" href={templateUrl("adjustment")}>adjustment</a>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Excel File (.xlsx)</label>
              <div className="relative">
                <Input 
                  type="file" 
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)} 
                  className="h-11 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {file && (
                <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                  ✓ Selected: {file.name} ({Math.round(file.size / 1024)}KB)
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <Button 
              type="submit" 
              disabled={!file || loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-6"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Importing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Start Import
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Import Results */}
      {result && (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
              result.ok 
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/25' 
                : 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/25'
            }`}>
              {result.ok ? (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Import Results</h2>
              <p className={`text-sm ${result.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {result.ok ? 'Import completed successfully' : 'Import failed'}
              </p>
            </div>
          </div>
          
          {result.ok && result.summary ? (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.summary.total}</div>
                <div className="text-xs text-blue-700 dark:text-blue-300">Total Rows</div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.summary.successful}</div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300">Successful</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{result.summary.failed}</div>
                <div className="text-xs text-red-700 dark:text-red-300">Failed</div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700 dark:text-red-300">
                Import failed. {"error" in result && (result as any).error ? `Reason: ${(result as any).error}` : "Please verify the template and required columns."}
              </p>
            </div>
          )}

          {result.importId && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">Import ID: <span className="font-mono">{result.importId}</span></p>
            </div>
          )}
          
          {!!result.errors?.length && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Errors (first {result.errors.length}):</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {result.errors.map((e, idx) => (
                  <div key={idx} className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-800/30 rounded px-2 py-1">
                    <span className="font-medium">Row {e.row}:</span> {e.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <StockSection />
    </div>
  );
}

type StockRow = {
  id: number;
  barcode: string;
  itemName: string;
  warehouse: string;
  qty: number;
  alert: number;
  expireDate: string | null;
};

function StockSection() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  const load = async (query: string, pageNum = page, pageSize = limit) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query, limit: String(pageSize), page: String(pageNum) });
      const res = await fetch(`/api/inventory/list?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      setRows(json.rows || []);
      setTotal(Number(json.total || 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load("", 1, limit);
    const handler = () => load(q, page, limit);
    window.addEventListener("stock:changed", handler as any);
    return () => window.removeEventListener("stock:changed", handler as any);
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(q, 1, limit);
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Current Stock</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Browse current inventory levels</p>
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
      
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-4">
          <span>Total: <span className="font-semibold text-gray-700 dark:text-gray-300">{total}</span></span>
          <span>Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{Math.max(1, Math.ceil(total / limit) || 1)}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <label>Per page:</label>
          <select
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-2 py-1 text-xs focus:border-purple-500 focus:ring-purple-500"
            value={limit}
            onChange={(e) => {
              const newLimit = Number(e.target.value) || 20;
              setLimit(newLimit);
              setPage(1);
              load(q, 1, newLimit);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
      
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
          rows.map((r) => <StockRowItem key={r.id} row={r} />)
        )}
      </div>
      
      <div className="mt-6 flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Showing {Math.min(limit, rows.length)} of {total} items
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const next = Math.max(1, page - 1);
              setPage(next);
              load(q, next, limit);
            }}
            disabled={page <= 1 || loading}
            className="h-8 px-3 text-xs"
          >
            ← Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const lastPage = Math.max(1, Math.ceil(total / limit) || 1);
              const next = Math.min(lastPage, page + 1);
              setPage(next);
              load(q, next, limit);
            }}
            disabled={loading || page * limit >= total}
            className="h-8 px-3 text-xs"
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
}

function StockRowItem({ row }: { row: StockRow }) {
  const low = row.alert > 0 && row.qty <= row.alert;
  const expDate = row.expireDate ? new Date(row.expireDate) : null;
  const validExpire = expDate && !isNaN(expDate.getTime()) && expDate.getFullYear() > 1971;
  const expSoon = validExpire ? daysUntil(expDate!.toISOString()) <= 0 : false; // basic indicator
  
  return (
    <div className="rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 px-4 py-3 flex items-center justify-between hover:shadow-md transition-all duration-200">
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
          {validExpire && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Expires {expDate!.toLocaleDateString()}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
        <span className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
          {row.qty.toLocaleString()}
        </span>
        <div className="flex flex-col gap-1">
          {low && (
            <span className="text-xs rounded-full px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
              LOW
            </span>
          )}
          {expSoon && (
            <span className="text-xs rounded-full px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
              EXPIRE
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function daysUntil(dateString: string) {
  const d = new Date(dateString).getTime();
  const now = Date.now();
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}
