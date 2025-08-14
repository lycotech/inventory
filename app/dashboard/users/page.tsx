"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type UserRow = {
  id: number;
  username: string;
  email: string;
  role: "admin" | "manager" | "user";
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
};

export default function UsersPage() {
  const [role, setRole] = useState<"admin" | "manager" | "user" | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await res.json();
        setRole(json?.user?.role || null);
      } catch {
        setRole(null);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-muted-foreground text-sm">Create accounts for stock managers and admins.</p>
      </div>
      {role === "admin" ? (
        <>
          <CreateUserCard />
          <UsersList />
        </>
      ) : role ? (
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">You don't have permission to manage users. Please contact an admin.</div>
      ) : null}
    </div>
  );
}

function CreateUserCard() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("manager");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, email, password, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create user");
      setMsg("User created");
      setUsername("");
      setEmail("");
      setPassword("");
      // notify list to refresh
      window.dispatchEvent(new CustomEvent("users:changed"));
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-lg font-medium">Create New User</h2>
      <form onSubmit={onSubmit} className="mt-3 grid gap-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. johndoe" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 6 chars" />
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm w-full">
              <option value="manager">Manager (stock)</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!username || !email || !password || loading}>{loading ? "Creating…" : "Create User"}</Button>
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
        </div>
      </form>
    </div>
  );
}

function UsersList() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/users/list?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      setRows(json.rows || []);
      setTotal(json.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("users:changed", handler as any);
    return () => window.removeEventListener("users:changed", handler as any);
  }, [page]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-medium">All Users</h2>
        <form onSubmit={onSearch} className="flex items-center gap-2">
          <Input placeholder="Search username or email" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          <Button type="submit" size="sm" disabled={loading}>{loading ? "Searching…" : "Search"}</Button>
        </form>
      </div>
      <div className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No users.</div>
        ) : (
          rows.map((u) => <UserRowItem key={u.id} row={u} />)
        )}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{total} total</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
          <div className="text-sm">Page {page}</div>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={rows.length < limit}>Next</Button>
        </div>
      </div>
    </div>
  );
}

function UserRowItem({ row }: { row: UserRow }) {
  const [role, setRole] = useState<UserRow["role"]>(row.role);
  const [active, setActive] = useState<boolean>(row.isActive);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  const save = async (changes: Partial<{ role: UserRow["role"]; isActive: boolean }>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${row.id}/update`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(changes),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update");
      setRole(json.user.role);
      setActive(json.user.isActive);
    } catch (e) {
      // no-op display; keep state
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <div className="font-medium truncate">{row.username} <span className="text-xs text-muted-foreground">({row.email})</span></div>
        <div className="text-xs text-muted-foreground truncate">Created {new Date(row.createdAt).toLocaleString()} {row.lastLogin && `• Last login ${new Date(row.lastLogin).toLocaleString()}`}</div>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={role}
          onChange={(e) => save({ role: e.target.value as UserRow["role"] })}
          disabled={saving}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="manager">Manager</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={() => save({ isActive: !active })}
          disabled={saving}
          className={`text-xs rounded-md border px-2 py-1 ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-700'}`}
          title={active ? 'Disable user' : 'Activate user'}
        >
          {active ? 'Active' : 'Disabled'}
        </button>
        <div className="flex items-center gap-2">
          <Input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} className="w-40" />
          <Button size="sm" variant="outline" disabled={pwSaving || !pw || pw.length < 6}
            onClick={async () => {
              setPwMsg(null);
              setPwSaving(true);
              try {
                const res = await fetch(`/api/users/${row.id}/password`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: pw }) });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'Failed');
                setPw('');
                setPwMsg('Password updated');
              } catch (e: any) {
                setPwMsg(e.message);
              } finally {
                setPwSaving(false);
              }
            }}
          >{pwSaving ? 'Saving…' : 'Set Password'}</Button>
        </div>
      </div>
      {pwMsg && <div className="w-full text-xs text-muted-foreground -mt-2">{pwMsg}</div>}
    </div>
  );
}

