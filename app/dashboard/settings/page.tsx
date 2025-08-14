"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SettingsMap = Record<string, any>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsMap>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const data = res.ok ? await res.json() : {};
        if (!mounted) return;
        setSettings({
          appName: "Femi Inventory",
          defaultTimezone: "UTC",
          defaultPageSize: 20,
          defaultReportFormat: "csv",
          expiryAlertDaysDefault: 30,
          alertsPollSeconds: 30,
          preventNegativeIssue: true,
          ...data,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const write = (k: string, v: any) => setSettings((s) => ({ ...s, [k]: v }));
  const onSave = async () => {
    setSaving(true);
    setSaved(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(res.ok ? "Saved" : "Failed");
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(null), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">Application preferences and configuration.</p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <section className="rounded-lg border p-4 space-y-3">
            <h2 className="text-lg font-medium">General</h2>
            <label className="grid gap-1 text-sm">
              <span>App name</span>
              <Input value={settings.appName || ""} onChange={(e) => write("appName", e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Default timezone</span>
              <select
                className="border rounded-md px-2 py-1 text-sm"
                value={settings.defaultTimezone || "UTC"}
                onChange={(e) => write("defaultTimezone", e.target.value)}
              >
                <option value="UTC">UTC</option>
                <option value="Africa/Lagos">Africa/Lagos</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </label>
          </section>

          <section className="rounded-lg border p-4 space-y-3">
            <h2 className="text-lg font-medium">Defaults</h2>
            <label className="grid gap-1 text-sm">
              <span>Default page size</span>
              <Input type="number" value={settings.defaultPageSize || 20} onChange={(e) => write("defaultPageSize", Number(e.target.value) || 0)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Default report format</span>
              <select
                className="border rounded-md px-2 py-1 text-sm"
                value={settings.defaultReportFormat || "csv"}
                onChange={(e) => write("defaultReportFormat", e.target.value)}
              >
                <option value="csv">CSV</option>
                <option value="xlsx">Excel</option>
                <option value="pdf">PDF</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Default expiry alert days</span>
              <Input type="number" value={settings.expiryAlertDaysDefault || 30} onChange={(e) => write("expiryAlertDaysDefault", Number(e.target.value) || 0)} />
            </label>
          </section>

          <section className="rounded-lg border p-4 space-y-3">
            <h2 className="text-lg font-medium">Alerts & Behavior</h2>
            <label className="grid gap-1 text-sm">
              <span>Active alerts auto-refresh (seconds)</span>
              <Input type="number" value={settings.alertsPollSeconds || 30} onChange={(e) => write("alertsPollSeconds", Number(e.target.value) || 0)} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!settings.preventNegativeIssue} onChange={(e) => write("preventNegativeIssue", e.target.checked)} />
              <span>Prevent negative stock issue</span>
            </label>
          </section>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
        {saved && <span className="text-sm text-muted-foreground">{saved}</span>}
      </div>
    </div>
  );
}
