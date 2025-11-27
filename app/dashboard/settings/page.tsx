"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, Palette, Bell, FileText, Upload, Image, Trash2 } from "lucide-react";
import { AccessControl } from "@/components/access-control";
import StockResetComponent from "@/components/admin/stock-reset";

type SettingsMap = Record<string, any>;

function SettingsContent() {
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
          appName: "InvAlert – Inventory Alert",
          appShortName: "InvAlert",
          appLogoDataUrl: "",
          defaultTimezone: "UTC",
          themeMode: "system",
          defaultPageSize: 20,
          defaultReportFormat: "csv",
          expiryAlertDaysDefault: 30,
          alertsPollSeconds: 30,
          preventNegativeIssue: true,
            alertSoundEnabled: true,
            alertSoundVolume: 0.6,
          alertSpeechEnabled: true,
          alertSpeechRate: 1.0,
          alertSpeechVoice: "female",
          alertEmailRecipients: [],
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

  // Populate available system voices for selection
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const load = () => {
      const vs = window.speechSynthesis.getVoices?.() || [];
      setVoices(vs);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      if (window.speechSynthesis.onvoiceschanged === load) {
        window.speechSynthesis.onvoiceschanged = null as any;
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Application Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Configure your inventory management system</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-gray-600 dark:text-gray-400">Loading settings...</span>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 space-y-4 shadow-lg shadow-gray-500/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">General Settings</h2>
            </div>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">App name</span>
              <Input 
                value={settings.appName || ""} 
                onChange={(e) => write("appName", e.target.value)}
                className="bg-white/70 dark:bg-gray-900/70 border-gray-300/50 dark:border-gray-600/50 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </label>
              <div className="grid gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                <div className="inline-flex rounded-xl border border-gray-300/50 dark:border-gray-600/50 overflow-hidden bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
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
                        className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                          active 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
                            : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                        } ${idx>0 ? 'border-l border-gray-300/50 dark:border-gray-600/50' : ''}`}
                        onClick={() => { write('themeMode', opt.k); applyTheme(opt.k); }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose light, dark, or follow system preferences</span>
              </div>
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">App logo</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickLogo(e.target.files?.[0] || null)}
                  className="block text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400 dark:hover:file:bg-blue-900/30"
                />
                {settings.appLogoDataUrl && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    onClick={() => write("appLogoDataUrl", "")}
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove logo
                  </button>
                )}
              </div>
              {settings.appLogoDataUrl ? (
                <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="App logo preview"
                    src={settings.appLogoDataUrl}
                    className="h-16 w-auto border rounded-lg bg-white p-2 shadow-sm"
                  />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 dark:text-gray-100">Logo Preview</div>
                    <div className="text-gray-500 dark:text-gray-400">This will appear in your application</div>
                  </div>
                </div>
              ) : null}
            </div>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Default timezone</span>
              <select
                className="border border-gray-300/50 dark:border-gray-600/50 rounded-xl px-3 py-2 text-sm bg-white/70 dark:bg-gray-900/70 focus:border-blue-500/50 focus:ring-blue-500/20 focus:outline-none transition-colors"
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

          <section className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 space-y-4 shadow-lg shadow-gray-500/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Default Settings</h2>
            </div>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">App short name</span>
              <Input 
                value={settings.appShortName || ""} 
                onChange={(e) => write("appShortName", e.target.value)}
                className="bg-white/70 dark:bg-gray-900/70 border-gray-300/50 dark:border-gray-600/50 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">Shown in nav bars and compact UI areas.</span>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Default page size</span>
              <Input 
                type="number" 
                value={settings.defaultPageSize || 20} 
                onChange={(e) => write("defaultPageSize", Number(e.target.value) || 0)}
                className="bg-white/70 dark:bg-gray-900/70 border-gray-300/50 dark:border-gray-600/50 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Default report format</span>
              <select
                className="border border-gray-300/50 dark:border-gray-600/50 rounded-xl px-3 py-2 text-sm bg-white/70 dark:bg-gray-900/70 focus:border-blue-500/50 focus:ring-blue-500/20 focus:outline-none transition-colors"
                value={settings.defaultReportFormat || "csv"}
                onChange={(e) => write("defaultReportFormat", e.target.value)}
              >
                <option value="csv">CSV</option>
                <option value="xlsx">Excel</option>
                <option value="pdf">PDF</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Default expiry alert days</span>
              <Input 
                type="number" 
                value={settings.expiryAlertDaysDefault || 30} 
                onChange={(e) => write("expiryAlertDaysDefault", Number(e.target.value) || 0)}
                className="bg-white/70 dark:bg-gray-900/70 border-gray-300/50 dark:border-gray-600/50 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </label>
          </section>

          <section className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 space-y-4 shadow-lg shadow-gray-500/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Alerts & Behavior</h2>
            </div>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active alerts auto-refresh (seconds)</span>
              <Input 
                type="number" 
                value={settings.alertsPollSeconds || 30} 
                onChange={(e) => write("alertsPollSeconds", Number(e.target.value) || 0)}
                className="bg-white/70 dark:bg-gray-900/70 border-gray-300/50 dark:border-gray-600/50 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </label>
            <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prevent negative stock issue</span>
              <Switch checked={!!settings.preventNegativeIssue} onCheckedChange={(v) => write("preventNegativeIssue", v)} />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Play sound on new active alerts</span>
              <Switch checked={!!settings.alertSoundEnabled} onCheckedChange={(v) => write("alertSoundEnabled", v)} />
            </div>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Alert sound volume ({Math.round(((settings.alertSoundVolume ?? 0.6) as number) * 100)}%)</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.alertSoundVolume ?? 0.6}
                onChange={(e) => write("alertSoundVolume", Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb:bg-blue-500 slider-thumb:border-0 slider-thumb:rounded-full slider-thumb:cursor-pointer"
              />
            </label>
            <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Speak alerts (text-to-speech)</span>
              <Switch checked={!!settings.alertSpeechEnabled} onCheckedChange={(v) => write("alertSpeechEnabled", v)} />
            </div>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Speech voice</span>
              <select
                className="border border-gray-300/50 dark:border-gray-600/50 rounded-xl px-3 py-2 text-sm bg-white/70 dark:bg-gray-900/70 focus:border-blue-500/50 focus:ring-blue-500/20 focus:outline-none transition-colors"
                value={settings.alertSpeechVoice || "female"}
                onChange={(e) => write("alertSpeechVoice", e.target.value)}
              >
                <option value="auto">System default</option>
                <option value="female">Prefer female</option>
                <option value="male">Prefer male</option>
                {voices.length > 0 && <option disabled>──────────</option>}
                {voices.map((v) => (
                  <option key={v.name + v.lang} value={v.name}>
                    {v.name} {v.lang ? `(${v.lang})` : ""}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose a specific voice or a preference. Availability depends on the device.</span>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Speech rate ({(settings.alertSpeechRate ?? 1.0).toFixed(1)}x)</span>
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.1}
                value={settings.alertSpeechRate ?? 1.0}
                onChange={(e) => write("alertSpeechRate", Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Stock alert notification emails</span>
              <textarea
                className="border border-gray-300/50 dark:border-gray-600/50 rounded-xl px-3 py-3 text-sm min-h-24 bg-white/70 dark:bg-gray-900/70 focus:border-blue-500/50 focus:ring-blue-500/20 focus:outline-none resize-none transition-colors"
                placeholder="Enter one or many emails, separated by comma or newline"
                value={(Array.isArray(settings.alertEmailRecipients) ? settings.alertEmailRecipients : []).join(", ")}
                onChange={(e) => {
                  const raw = e.target.value;
                  const tokens = raw.split(/[\n,;\s]+/g).map((x) => x.trim().toLowerCase()).filter(Boolean);
                  // simple email filter
                  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  const uniq: string[] = [];
                  for (const t of tokens) {
                    if (emailRe.test(t) && !uniq.includes(t)) uniq.push(t);
                  }
                  write("alertEmailRecipients", uniq);
                }}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">These addresses will receive stock alerts (feature can be wired to email later). Separate multiple emails with commas or new lines.</span>
            </label>
          </section>
        </div>
      )}

      {/* Stock Reset Section - Admin Only */}
      {!loading && (
        <section className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-red-200/50 dark:border-red-700/50 p-6 shadow-lg shadow-red-500/5">
          <StockResetComponent 
            onResetComplete={(result) => {
              console.log('Stock reset completed:', result);
            }} 
          />
        </section>
      )}

      <div className="flex items-center gap-4 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
        <Button 
          onClick={onSave} 
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Saving...
            </div>
          ) : (
            "Save settings"
          )}
        </Button>
        {saved && (
          <span className={`text-sm font-medium ${saved === "Saved" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {saved}
          </span>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AccessControl requiredRoles={["admin"]}>
      <SettingsContent />
    </AccessControl>
  );
}
