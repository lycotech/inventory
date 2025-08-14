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
      const json = await res.json();
      setResult(json);
      if (res.ok) {
        // Trigger stock reload below
        window.dispatchEvent(new CustomEvent("stock:changed"));
      }
    } catch (e) {
      setResult({ ok: false, errors: [{ row: 0, message: (e as Error).message }] });
    } finally {
      setLoading(false);
    }
  };

  const templateUrl = (t: string) => `/api/import/template/${encodeURIComponent(t)}`;

  return (
  <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Import Data</h1>
        <p className="text-muted-foreground text-sm">Upload and process inventory data from an Excel (.xlsx) file.</p>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Import type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="full">Full inventory</option>
                <option value="stock_receive">Stock receive</option>
                <option value="stock_issue">Stock issue</option>
                <option value="adjustment">Adjustment</option>
              </select>
              <div className="mt-2 text-xs text-muted-foreground">
                Download a CSV template: {" "}
                <a className="underline" href={templateUrl("full")}>full</a> • {" "}
                <a className="underline" href={templateUrl("stock_receive")}>stock_receive</a> • {" "}
                <a className="underline" href={templateUrl("stock_issue")}>stock_issue</a> • {" "}
                <a className="underline" href={templateUrl("adjustment")}>adjustment</a>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">File (.xlsx)</label>
              <Input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div>
            <Button type="submit" disabled={!file || loading}>{loading ? "Importing…" : "Start import"}</Button>
          </div>
        </form>
      </div>

      {result && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-medium mb-2">Result</h2>
          {result.ok && result.summary ? (
            <div className="text-sm">
              <div>Total rows: {result.summary.total}</div>
              <div>Successful: {result.summary.successful}</div>
              <div>Failed: {result.summary.failed}</div>
              {result.importId ? <div className="mt-1 text-muted-foreground">Import ID: {result.importId}</div> : null}
            </div>
          ) : (
            <div className="text-sm text-destructive">Import failed. {"error" in result && (result as any).error ? `Reason: ${(result as any).error}` : "Please verify the template and required columns."}</div>
          )}
          {!!result.errors?.length && (
            <div className="mt-3">
              <div className="text-sm font-medium">Errors (first {result.errors.length}):</div>
              <ul className="mt-1 list-disc list-inside text-sm text-muted-foreground">
                {result.errors.map((e, idx) => (
                  <li key={idx}>Row {e.row}: {e.message}</li>
                ))}
              </ul>
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
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-medium">Current Stock</h2>
        <form onSubmit={onSearch} className="flex items-center gap-2">
          <Input placeholder="Search item, barcode, category, warehouse" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          <Button type="submit" size="sm" disabled={loading}>{loading ? "Searching…" : "Search"}</Button>
        </form>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <div>Total: {total}</div>
        <div className="flex items-center gap-2">
          <label>Per page</label>
          <select
            className="rounded-md border border-input bg-background px-2 py-1"
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
      <div className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No items.</div>
        ) : (
          rows.map((r) => <StockRowItem key={r.id} row={r} />)
        )}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Page {page} of {Math.max(1, Math.ceil(total / limit) || 1)}</div>
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
          >
            Prev
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
          >
            Next
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
    <div className="rounded-lg border px-4 py-3 flex items-center justify-between">
      <div className="min-w-0">
        <div className="font-medium truncate">{row.itemName} <span className="text-xs text-muted-foreground">({row.barcode})</span></div>
        <div className="text-xs text-muted-foreground truncate">{row.warehouse}{validExpire ? ` • Expires ${expDate!.toLocaleDateString()}` : ''}</div>
      </div>
      <div className="flex items-center gap-3 ml-3">
        <span className="text-sm font-semibold tabular-nums">{row.qty}</span>
        {low && <span className="text-xs rounded-full px-2 py-1 bg-red-100 text-red-700">LOW</span>}
        {expSoon && <span className="text-xs rounded-full px-2 py-1 bg-amber-100 text-amber-700">EXPIRE</span>}
      </div>
    </div>
  );
}

function daysUntil(dateString: string) {
  const d = new Date(dateString).getTime();
  const now = Date.now();
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}
