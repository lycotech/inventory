"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const onLogout = async () => {
    try {
      setLoading(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button variant="outline" onClick={onLogout} disabled={loading}>
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
