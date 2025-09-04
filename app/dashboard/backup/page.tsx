"use client";

import { useEffect, useState } from "react";
import { AccessControl } from "@/components/access-control";

function BackupContent() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (j?.authenticated && j?.user?.role === "admin") setIsAdmin(true);
      } catch {}
    })();
  }, []);

  const doDownload = async () => {
    try {
      setDownloading(true);
      const r = await fetch("/api/backup/export?format=json", { cache: "no-store" });
      if (!r.ok) {
        alert("Backup failed: " + r.status);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = r.headers.get("content-disposition")?.match(/filename=(.+)$/)?.[1] || "backup.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Backup</h1>
        <p className="text-muted-foreground text-sm">Download a JSON backup of your data.</p>
      </div>
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Export now</div>
            <div className="text-xs text-muted-foreground">Generates a JSON file with key tables.</div>
          </div>
          <button
            className="text-sm rounded-md border px-3 py-2 hover:bg-accent disabled:opacity-50"
            onClick={doDownload}
            disabled={!isAdmin || downloading}
            title={!isAdmin ? "Admin only" : undefined}
          >
            {downloading ? "Preparing…" : "Download backup"}
          </button>
        </div>
      </div>
      {!isAdmin && (
        <div className="text-xs text-muted-foreground">You need admin privileges to export backups.</div>
      )}
    </div>
  );
}

export default function BackupPage() {
  return (
    <AccessControl requiredRoles={["admin"]}>
      <BackupContent />
    </AccessControl>
  );
}
