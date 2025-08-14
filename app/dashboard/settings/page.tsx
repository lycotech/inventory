"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

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
        const merged = {
          appName: "Femi Inventory",
          appLogoDataUrl: "",
          defaultTimezone: "UTC",
          themeMode: "system",
          defaultPageSize: 20,
          defaultReportFormat: "csv",
          expiryAlertDaysDefault: 30,
          alertsPollSeconds: 30,
          preventNegativeIssue: true,
          ...data,
        } as SettingsMap;
        setSettings(merged);
        // Apply saved theme
        const mode = (merged.themeMode as string) || "system";
        const root = document.documentElement;
        const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
        const wantDark = mode === 'dark' || (mode === 'system' && mq?.matches);
        if (wantDark) root.classList.add('dark'); else root.classList.remove('dark');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const write = (k: string, v: any) => setSettings((s) => ({ ...s, [k]: v }));
    const applyTheme = (mode: string) => {
      const root = document.documentElement;
      const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
      const wantDark = mode === 'dark' || (mode === 'system' && mq?.matches);
      if (wantDark) root.classList.add('dark'); else root.classList.remove('dark');
    };
  const onPickLogo = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 300 * 1024) {
      const cont = confirm("This image is larger than 300KB. Continue?");
      if (!cont) return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      write("appLogoDataUrl", result);
    };
    reader.readAsDataURL(file);
  };
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
              <div className="grid gap-1 text-sm">
                <span>Theme</span>
                <div className="inline-flex rounded-md border overflow-hidden">
                  {([
                    { k: 'light', label: 'Light' },
                    { k: 'system', label: 'System' },
                    { k: 'dark', label: 'Dark' },
                  ] as const).map((opt, idx) => {
                    const active = (settings.themeMode || 'system') === opt.k;
                    return (
                      <button
                        key={opt.k}
                        type="button"
                        className={`px-3 py-1.5 text-xs ${active ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent'} ${idx>0 ? 'border-l' : ''}`}
                        onClick={() => { write('themeMode', opt.k); applyTheme(opt.k); }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs text-muted-foreground">Choose light, dark, or follow system</span>
              </div>
            <div className="grid gap-2 text-sm">
              <span>App logo</span>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickLogo(e.target.files?.[0] || null)}
                  className="block text-xs"
                />
                {settings.appLogoDataUrl && (
                  <button
                    type="button"
                    className="text-xs rounded-md border px-2 py-1 hover:bg-accent"
                    onClick={() => write("appLogoDataUrl", "")}
                  >
                    Remove logo
                  </button>
                )}
              </div>
              {settings.appLogoDataUrl ? (
                <div className="mt-1 flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="App logo preview"
                    src={settings.appLogoDataUrl}
                    className="h-10 w-auto border rounded bg-white p-1"
                  />
                  <span className="text-xs text-muted-foreground">Preview</span>
                </div>
              ) : null}
            </div>
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
            <div className="flex items-center justify-between text-sm">
              <span>Prevent negative stock issue</span>
              <Switch checked={!!settings.preventNegativeIssue} onCheckedChange={(v) => write("preventNegativeIssue", v)} />
            </div>
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
