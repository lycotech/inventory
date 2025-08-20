"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Sun, Moon, Boxes } from "lucide-react";

export default function Home() {
  const [dark, setDark] = useState(false);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoErr, setLogoErr] = useState(false);
  const [appName, setAppName] = useState<string>("InvAlert");
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && username && password && !loading) {
      onLogin();
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
  // Load branding (logo and app name) for login screen
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/settings", { cache: "no-store" });
        if (r.ok) {
          const s = await r.json();
          const shorty = s?.appShortName || s?.appName;
          if (shorty) setAppName(String(shorty));
          if (s?.appLogoDataUrl) setLogoUrl(String(s.appLogoDataUrl));
          else if (s?.appLogoUrl) setLogoUrl(String(s.appLogoUrl));
        }
      } catch {}
    })();
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center p-4 transition-all duration-300">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Theme toggle button - positioned absolutely */}
        <button 
          onClick={() => setDark((d) => !d)}
          className="absolute -top-16 right-0 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          aria-label="Toggle theme"
        >
          {dark ? (
            <Sun className="h-5 w-5 text-yellow-500" />
          ) : (
            <Moon className="h-5 w-5 text-blue-600" />
          )}
        </button>

        {/* Login card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl">
          {/* Header section with logo */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 dark:from-blue-700/90 dark:to-indigo-700/90"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                {logoUrl && !logoErr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={appName}
                    className="h-16 md:h-20 w-auto drop-shadow-lg"
                    onError={() => setLogoErr(true)}
                  />
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                    <div className="relative bg-white/10 p-4 rounded-full border border-white/20">
                      <Boxes className="h-8 w-8 text-white" />
                    </div>
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">{appName}</h1>
              <p className="text-blue-100 text-sm">Inventory Management System</p>
            </div>
          </div>

          {/* Form section */}
          <div className="p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Welcome Back</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Please sign in to your account</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} className="space-y-4">
              {/* Username field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoComplete="username"
                  className="h-12 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  disabled={loading}
                />
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    autoComplete="current-password"
                    className="h-12 pr-12 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 animate-in slide-in-from-top-1 duration-300">
                  <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                    <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full"></span>
                    {error}
                  </p>
                </div>
              )}

              {/* Sign in button */}
              <Button 
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg" 
                disabled={loading || !username || !password}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Secure inventory management • {new Date().getFullYear()}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                © 2025 TechValor Ent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
