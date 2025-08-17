"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Stats = { items: number; lowStock: number; expiringSoon: number; transactionsToday: number };

export function DashboardNotifications({ initial }: { initial: Pick<Stats, "lowStock" | "expiringSoon"> }) {
  const [low, setLow] = useState(initial.lowStock);
  const [exp, setExp] = useState(initial.expiringSoon);
  const timer = useRef<number | null>(null);
  const last = useRef<{ low: number; exp: number }>({ low: initial.lowStock, exp: initial.expiringSoon });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const settingsRef = useRef<{ soundEnabled: boolean; volume: number; speechEnabled: boolean; speechRate: number; speechVoice?: string }>({ soundEnabled: true, volume: 0.6, speechEnabled: true, speechRate: 1.0, speechVoice: 'female' });

  useEffect(() => {
    // Load alert sound preferences
    (async () => {
      try {
        const rs = await fetch("/api/settings", { cache: "no-store" });
        if (rs.ok) {
          const s = await rs.json();
          settingsRef.current.soundEnabled = s?.alertSoundEnabled ?? true;
          const vol = Number(s?.alertSoundVolume);
          settingsRef.current.volume = Number.isFinite(vol) ? Math.min(1, Math.max(0, vol)) : 0.6;
          settingsRef.current.speechEnabled = s?.alertSpeechEnabled ?? true;
          const rate = Number(s?.alertSpeechRate);
          settingsRef.current.speechRate = Number.isFinite(rate) ? Math.min(2, Math.max(0.5, rate)) : 1.0;
          settingsRef.current.speechVoice = s?.alertSpeechVoice || 'female';
        }
      } catch {}
    })();

    // Prepare audio element lazily when user interacts to satisfy autoplay policies
    const onFirst = () => {
      if (!audioRef.current) {
        const el = new Audio();
        // Simple beep using Web Audio Data URI (440Hz tone 200ms)
        el.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAAEsAAACABYAAABkYXRhABAAAAAAgICAf39/foCAgH9/f36AgIB/f39+gICAgH9/f36AgIB/f39+gICAf39/foCAgH9/f34=";
        el.volume = settingsRef.current.volume;
        audioRef.current = el;
      }
      window.removeEventListener("click", onFirst);
      window.removeEventListener("keydown", onFirst);
    };
    window.addEventListener("click", onFirst);
    window.addEventListener("keydown", onFirst);

    const poll = async () => {
      try {
        const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as Stats;
        const incLow = json.lowStock > last.current.low;
        const incExp = json.expiringSoon > last.current.exp;
        const inc = incLow || incExp;
        setLow(json.lowStock);
        setExp(json.expiringSoon);
        last.current = { low: json.lowStock, exp: json.expiringSoon };
        if (inc) {
          // Prefer speech when enabled
          if (settingsRef.current.speechEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            const parts: string[] = [];
            if (incLow) parts.push(`${json.lowStock} item${json.lowStock === 1 ? '' : 's'} below stock alert`);
            if (incExp) parts.push(`${json.expiringSoon} item${json.expiringSoon === 1 ? '' : 's'} expiring soon`);
            const utterance = new SpeechSynthesisUtterance(parts.join(' and '));
            utterance.rate = settingsRef.current.speechRate;
            // Pick preferred voice if possible
            try {
              const prefer = settingsRef.current.speechVoice || 'female';
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
                if (wantFemale && utterance.pitch !== undefined) utterance.pitch = 1.1;
              }
              if (chosen) utterance.voice = chosen;
            } catch {}
            try {
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(utterance);
            } catch {}
          } else if (settingsRef.current.soundEnabled && audioRef.current) {
            try {
              audioRef.current.currentTime = 0;
              audioRef.current.volume = settingsRef.current.volume;
              void audioRef.current.play();
            } catch {}
          }
        }
      } catch {}
    };
    timer.current = window.setInterval(poll, 30000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      window.removeEventListener("click", onFirst);
      window.removeEventListener("keydown", onFirst);
    };
  }, []);

  if (low <= 0 && exp <= 0) return null;

  return (
    <div className="space-y-2">
      {low > 0 && (
        <Banner
          tone="danger"
          title={`${low} item${low === 1 ? "" : "s"} at or below stock alert`}
          href="/dashboard/alerts?type=low_stock&acknowledged=false"
          cta="View low stock"
        />
      )}
      {exp > 0 && (
        <Banner
          tone="warning"
          title={`${exp} item${exp === 1 ? "" : "s"} expiring soon`}
          href="/dashboard/alerts?type=expiring&acknowledged=false"
          cta="View expiring"
        />
      )}
    </div>
  );
}

function Banner({ tone, title, href, cta }: { tone: "danger" | "warning"; title: string; href: string; cta: string }) {
  const klass = tone === "danger" ? "border-red-300 bg-red-50 text-red-800" : "border-amber-300 bg-amber-50 text-amber-800";
  const btn = tone === "danger" ? "border-red-300 hover:bg-red-100" : "border-amber-300 hover:bg-amber-100";
  return (
    <div className={`rounded-lg border px-4 py-3 ${klass} flex items-center justify-between`}>
      <div className="text-sm font-medium">{title}</div>
      <Link href={href} className={`text-xs rounded-md border px-2 py-1 ${btn}`}>{cta}</Link>
    </div>
  );
}
