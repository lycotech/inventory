"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function download(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = ""; // use server-provided filename
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function ReportsPage() {
  const [defaultFormat, setDefaultFormat] = useState<string>("csv");
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/settings", { cache: "no-store" });
        if (r.ok) {
          const s = await r.json();
          if (s?.defaultReportFormat) setDefaultFormat(String(s.defaultReportFormat));
        }
      } catch {}
    })();
  }, []);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-muted-foreground text-sm">Generate reports in CSV, Excel, or PDF.</p>
      </div>

      <InventoryReports initialFormat={defaultFormat} />
      <TransactionReports initialFormat={defaultFormat} />
      <AnalyticsReports />
    </div>
  );
}

function InventoryReports({ initialFormat = "csv" }: { initialFormat?: string }) {
  const [q, setQ] = useState("");
  const [days, setDays] = useState(30);
  const [format, setFormat] = useState(initialFormat);
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-lg font-medium mb-2">Inventory Reports</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-md border p-3">
          <div className="font-medium">Current Stock Report</div>
          <div className="text-xs text-muted-foreground">Real-time stock levels with filters</div>
          <div className="mt-2 flex items-center gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search filter (optional)" />
            <select className="rounded-md border px-2 py-1 text-sm" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
              <option value="pdf">PDF</option>
            </select>
            <Button size="sm" onClick={() => download(`/api/reports/generate?type=current_stock&format=${format}&q=${encodeURIComponent(q)}`)}>Download</Button>
          </div>
        </div>
        <div className="rounded-md border p-3">
          <div className="font-medium">Low Stock Alert Report</div>
          <div className="text-xs text-muted-foreground">Items below alert levels</div>
          <div className="mt-2 flex items-center gap-2">
            <select className="rounded-md border px-2 py-1 text-sm" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
              <option value="pdf">PDF</option>
            </select>
            <Button size="sm" onClick={() => download(`/api/reports/generate?type=low_stock&format=${format}`)}>Download</Button>
          </div>
        </div>
        <div className="rounded-md border p-3">
          <div className="font-medium">Expiry Report</div>
          <div className="text-xs text-muted-foreground">Items expiring within X days</div>
          <div className="mt-2 flex items-center gap-2">
            <Input type="number" value={days} onChange={(e) => setDays(Number(e.target.value) || 0)} className="w-32" />
            <select className="rounded-md border px-2 py-1 text-sm" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
              <option value="pdf">PDF</option>
            </select>
            <Button size="sm" onClick={() => download(`/api/reports/generate?type=expiry&format=${format}&days=${days}`)}>Download</Button>
          </div>
        </div>
        <div className="rounded-md border p-3 opacity-60">
          <div className="font-medium">Overstock Report</div>
          <div className="text-xs text-muted-foreground">Items with excess inventory</div>
          <div className="mt-2 text-xs">Coming soon</div>
        </div>
        <div className="rounded-md border p-3 opacity-60">
          <div className="font-medium">Dead Stock Report</div>
          <div className="text-xs text-muted-foreground">No movement in X days</div>
          <div className="mt-2 text-xs">Coming soon</div>
        </div>
        <div className="rounded-md border p-3 opacity-60">
          <div className="font-medium">ABC Analysis</div>
          <div className="text-xs text-muted-foreground">Classification by value/movement</div>
          <div className="mt-2 text-xs">Coming soon</div>
        </div>
        <div className="rounded-md border p-3 opacity-60">
          <div className="font-medium">Stock Valuation Report</div>
          <div className="text-xs text-muted-foreground">Total value by category/warehouse</div>
          <div className="mt-2 text-xs">Coming soon</div>
        </div>
      </div>
    </div>
  );
}

function TransactionReports({ initialFormat = "csv" }: { initialFormat?: string }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [format, setFormat] = useState(initialFormat);
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-lg font-medium mb-2">Transaction Reports</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-md border p-3">
          <div className="font-medium">Stock Movement Report</div>
          <div className="text-xs text-muted-foreground">All transactions in date range</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <select className="rounded-md border px-2 py-1 text-sm" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
              <option value="pdf">PDF</option>
            </select>
            <Button size="sm" onClick={() => {
              const params = new URLSearchParams();
              params.set("type", "stock_movement");
              params.set("format", format);
              if (start) params.set("start", start);
              if (end) params.set("end", end);
              download(`/api/reports/generate?${params.toString()}`);
            }}>Download</Button>
          </div>
        </div>
        <div className="rounded-md border p-3 opacity-60">
          <div className="font-medium">Receive Summary</div>
          <div className="text-xs text-muted-foreground">Receives by supplier/date</div>
          <div className="mt-2 text-xs">Coming soon</div>
        </div>
        <div className="rounded-md border p-3 opacity-60">
          <div className="font-medium">Issue Summary</div>
          <div className="text-xs text-muted-foreground">Issues by reason/department</div>
          <div className="mt-2 text-xs">Coming soon</div>
        </div>
        <div className="rounded-md border p-3 opacity-60">
          <div className="font-medium">Adjustment Report</div>
          <div className="text-xs text-muted-foreground">Adjustments with reasons</div>
          <div className="mt-2 text-xs">Coming soon</div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsReports() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-lg font-medium mb-2">Performance & Analytics Reports</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-md border p-3 opacity-60">
          <div className="font-medium">User Activity Report</div>
          <div className="text-xs text-muted-foreground">Actions by user and time</div>
          <div className="mt-2 text-xs">Coming soon</div>
        </div>
        <div className="rounded-md border p-3 opacity-60">
          <div className="font-medium">Import Statistics</div>
          <div className="text-xs text-muted-foreground">Import success/failure rates</div>
          <div className="mt-2 text-xs">Coming soon</div>
        </div>
        <div className="rounded-md border p-3 opacity-60">
          <div className="font-medium">Alert Response Report</div>
          <div className="text-xs text-muted-foreground">Alert acknowledgment metrics</div>
          <div className="mt-2 text-xs">Coming soon</div>
        </div>
        <div className="rounded-md border p-3 opacity-60">
          <div className="font-medium">Inventory Accuracy</div>
          <div className="text-xs text-muted-foreground">Discrepancy analysis</div>
          <div className="mt-2 text-xs">Coming soon</div>
        </div>
        <div className="rounded-md border p-3 opacity-60">
          <div className="font-medium">System Usage Report</div>
          <div className="text-xs text-muted-foreground">Feature usage statistics</div>
          <div className="mt-2 text-xs">Coming soon</div>
        </div>
      </div>
    </div>
  );
}
