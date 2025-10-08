"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AccessControl } from "@/components/access-control";
import { PrivilegeAssignment } from "@/components/privilege-assignment";

type UserRow = {
  id: number;
  username: string;
  email: string;
  role: "admin" | "manager" | "user";
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
};

function UsersContent() {
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage user accounts for your inventory system.
          </p>
        </div>
      </div>

      {/* Content based on role */}
      {role === "admin" ? (
        <>
          <CreateUserCard />
          <UsersList />
        </>
      ) : role ? (
        <div className="bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 mx-auto bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">Access Restricted</h3>
          <p className="text-amber-700 dark:text-amber-300">
            You don't have permission to manage users. Please contact an administrator for assistance.
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading user permissions...</p>
        </div>
      )}
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
  const [showPrivileges, setShowPrivileges] = useState(false);
  const [privileges, setPrivileges] = useState<{
    menuPermissions: { [key: string]: boolean };
    warehouseAccess: { [key: string]: { canView: boolean; canEdit: boolean; canTransfer: boolean } };
    operationPrivileges: { [key: string]: boolean };
  } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          username, 
          email, 
          password, 
          role,
          ...(privileges || {})
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create user");
      setMsg("User created successfully with privileges");
      setUsername("");
      setEmail("");
      setPassword("");
      setShowPrivileges(false);
      setPrivileges(null);
      // notify list to refresh
      window.dispatchEvent(new CustomEvent("users:changed"));
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create New User</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Add a new user to the system</p>
        </div>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <Input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="e.g. john.doe" 
              className="h-11 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="john.doe@company.com" 
              className="h-11 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Minimum 6 characters" 
              className="h-11 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-3 text-sm focus:border-blue-500 focus:ring-blue-500 dark:text-gray-100"
            >
              <option value="manager">Manager (Inventory Access)</option>
              <option value="user">User (Basic Access)</option>
              <option value="admin">Admin (Full Access)</option>
            </select>
          </div>
        </div>
        
        {/* Privilege Assignment Toggle */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            type="button"
            onClick={() => setShowPrivileges(!showPrivileges)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${showPrivileges ? 'rotate-90' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showPrivileges ? 'Hide' : 'Configure'} User Privileges
          </button>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <Button 
            type="submit" 
            disabled={!username || !email || !password || loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-6"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating User...
              </div>
            ) : (
              "Create User"
            )}
          </Button>
          {msg && (
            <span className={`text-sm font-medium ${msg.includes('created') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {msg}
            </span>
          )}
        </div>
      </form>
      
      {/* Privilege Assignment Panel */}
      {showPrivileges && (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          <PrivilegeAssignment
            onPrivilegesChange={setPrivileges}
          />
        </div>
      )}
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
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">All Users</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {total} user{total !== 1 ? 's' : ''} in system
            </p>
          </div>
        </div>
        
        <form onSubmit={onSearch} className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input 
              placeholder="Search username or email..." 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              className="pl-10 w-64 h-10 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 h-10 px-4"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Searching...
              </div>
            ) : (
              "Search"
            )}
          </Button>
        </form>
      </div>
      
      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">No users found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {q ? 'Try adjusting your search term' : 'Create your first user above'}
            </p>
          </div>
        ) : (
          rows.map((u) => <UserRowItem key={u.id} row={u} />)
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {total} total user{total !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setPage((p) => Math.max(1, p - 1))} 
            disabled={page <= 1}
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 border-0 h-9 px-4"
          >
            Previous
          </Button>
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 px-3 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Page {page}
            </span>
          </div>
          <Button 
            onClick={() => setPage((p) => p + 1)} 
            disabled={rows.length < limit}
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 border-0 h-9 px-4"
          >
            Next
          </Button>
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

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25',
      manager: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25',
      user: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg shadow-gray-500/25'
    };
    return colors[role as keyof typeof colors] || colors.user;
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 shadow-md hover:shadow-lg hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-200">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {(row.username || "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {row.username}
              </h3>
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getRoleBadge(role)}`}>
                {(role || "user").charAt(0).toUpperCase() + (role || "user").slice(1)}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{row.email}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-500">
              <span>Created {new Date(row.createdAt).toLocaleDateString()}</span>
              {row.lastLogin && (
                <>
                  <span>•</span>
                  <span>Last login {new Date(row.lastLogin).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => save({ isActive: !active })}
          disabled={saving}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
            active 
              ? 'bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 hover:from-emerald-200 hover:to-teal-200' 
              : 'bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-700 dark:to-slate-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:from-gray-200 hover:to-slate-200'
          }`}
          title={active ? 'Disable user' : 'Activate user'}
        >
          <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
          {active ? 'Active' : 'Disabled'}
        </button>
      </div>
      
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role:</label>
          <select
            value={role}
            onChange={(e) => save({ role: e.target.value as UserRow["role"] })}
            disabled={saving}
            className="h-9 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-3 text-sm focus:border-blue-500 focus:ring-blue-500 dark:text-gray-100"
          >
            <option value="manager">Manager (Inventory)</option>
            <option value="user">User (Basic)</option>
            <option value="admin">Admin (Full Access)</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <Input 
            type="password" 
            placeholder="New password..." 
            value={pw} 
            onChange={(e) => setPw(e.target.value)} 
            className="w-40 h-9 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 focus:border-amber-500 focus:ring-amber-500"
          />
          <Button 
            disabled={pwSaving || !pw || pw.length < 6}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed h-9 px-4"
            onClick={async () => {
              setPwMsg(null);
              setPwSaving(true);
              try {
                const res = await fetch(`/api/users/${row.id}/password`, { 
                  method: 'POST', 
                  headers: { 'content-type': 'application/json' }, 
                  body: JSON.stringify({ password: pw }) 
                });
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
          >
            {pwSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Updating...
              </div>
            ) : (
              "Set Password"
            )}
          </Button>
        </div>
        
        {saving && (
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            Saving changes...
          </div>
        )}
      </div>
      
      {pwMsg && (
        <div className={`mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50 text-sm font-medium ${
          pwMsg.includes('updated') 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {pwMsg}
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <AccessControl requiredRoles={["admin"]}>
      <UsersContent />
    </AccessControl>
  );
}

