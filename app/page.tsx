"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const [dark, setDark] = useState(false);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
      }
      // After login, speak alert details if enabled
      try {
        const [sRes, stRes] = await Promise.all([
          fetch("/api/settings", { cache: "no-store" }).catch(() => null),
          fetch("/api/dashboard/stats", { cache: "no-store" }).catch(() => null),
        ]);
        const settings = sRes && sRes.ok ? await sRes.json() : {};
        const stats = stRes && stRes.ok ? await stRes.json() : null;
        const speechEnabled = settings?.alertSpeechEnabled ?? true;
        const speechRate = Number.isFinite(Number(settings?.alertSpeechRate)) ? Number(settings.alertSpeechRate) : 1.0;
        const speechVoice = settings?.alertSpeechVoice || 'female';
        if (speechEnabled && stats && typeof window !== "undefined" && "speechSynthesis" in window) {
          const low = Number(stats.lowStock) || 0;
          const exp = Number(stats.expiringSoon) || 0;
          const parts: string[] = [];
          parts.push(`${low} item${low === 1 ? "" : "s"} below stock alert`);
          parts.push(`${exp} item${exp === 1 ? "" : "s"} expiring soon`);
          const utter = new SpeechSynthesisUtterance(parts.join(", "));
          utter.rate = Math.min(2, Math.max(0.5, speechRate));
          try {
            const prefer = speechVoice;
            const voices = window.speechSynthesis.getVoices?.() || [];
            let chosen: SpeechSynthesisVoice | undefined;
            if (prefer && prefer !== 'auto' && prefer !== 'female' && prefer !== 'male') {
              chosen = voices.find(v => v.name === prefer);
            }
            if (!chosen && (prefer === 'female' || prefer === 'male')) {
              const wantFemale = prefer === 'female';
              const byName = voices.find(v => new RegExp(wantFemale ? /(female|woman|samantha|victoria|zira)/i : /(male|man|daniel|david|mark|george|fred)/i).test(v.name));
              const byLang = voices.find(v => (wantFemale ? /female/i : /male/i).test((v as any).gender || ''));
              chosen = byName || byLang || voices.find(v => v.lang?.toLowerCase().startsWith('en')) || voices[0];
              if (wantFemale && utter.pitch !== undefined) utter.pitch = 1.1;
            }
            if (chosen) utter.voice = chosen;
          } catch {}
          try {
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utter);
          } catch {}
        }
      } catch {}
      router.replace("/dashboard");
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };
  // If already authenticated, go straight to dashboard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.authenticated) router.replace("/dashboard");
        }
      } catch {}
    };
    checkAuth();
  }, [router]);
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <main className="w-full max-w-sm rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Sign in</h1>
            <Button size="sm" variant="ghost" onClick={() => setDark((d) => !d)}>
              {dark ? "Light" : "Dark"}
            </Button>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="username">Username</label>
            <input
              id="username"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button className="w-full" onClick={onLogin} disabled={loading || !username || !password}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          {/* Removed demo credentials hint */}
        </div>
      </main>
    </div>
  );
}
