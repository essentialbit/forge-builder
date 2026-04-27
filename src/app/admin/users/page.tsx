"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor";
  lastLogin: number | null;
  createdAt: number;
}

interface NewUserForm {
  name: string;
  email: string;
  password: string;
  role: "admin" | "editor";
}

export default function UsersPage() {
  const me = getCurrentUserFromCookie();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add user form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewUserForm>({ name: "", email: "", password: "", role: "editor" });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Reset link modal
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load users");
      setUsers(data.users);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create user");
      setForm({ name: "", email: "", password: "", role: "editor" });
      setShowForm(false);
      await fetchUsers();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setFormLoading(false);
    }
  }

  async function changeRole(id: string, role: "admin" | "editor") {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    await fetchUsers();
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    await fetchUsers();
  }

  async function generateReset(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: "POST" });
    const data = await res.json();
    setResetUrl(data.resetUrl ?? null);
  }

  if (me?.role !== "admin") {
    return (
      <div className="p-8 text-slate-400">You need admin access to manage users.</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage who can access Forge Builder</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          {showForm ? "Cancel" : "+ Add User"}
        </Button>
      </div>

      {/* Add user form */}
      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">New User</h2>
          <form onSubmit={addUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Name</label>
              <Input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={formLoading}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Email</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                disabled={formLoading}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Password</label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                disabled={formLoading}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "editor" })}
                disabled={formLoading}
                className="w-full h-10 rounded-md bg-slate-800 border border-slate-700 text-white px-3 text-sm"
              >
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {formError && (
              <div className="sm:col-span-2 bg-red-950/60 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300">
                {formError}
              </div>
            )}
            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={formLoading}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                {formLoading ? "Creating…" : "Create User"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-400 text-sm">{error}</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Last login</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{u.name || "—"}</div>
                    <div className="text-slate-400 text-xs">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {u.id === me?.id ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-amber-500/20 text-amber-300" : "bg-slate-700 text-slate-300"}`}>
                        {u.role}
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value as "admin" | "editor")}
                        className="bg-slate-800 border border-slate-700 text-white rounded-md px-2 py-1 text-xs"
                      >
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => generateReset(u.id)}
                        className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
                        title="Generate password reset link"
                      >
                        Reset link
                      </button>
                      {u.id !== me?.id && (
                        <button
                          onClick={() => deleteUser(u.id, u.email)}
                          className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reset URL modal */}
      {resetUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-white font-semibold mb-2">Password Reset Link</h3>
            <p className="text-slate-400 text-sm mb-4">Share this link with the user. It expires in 1 hour.</p>
            <div className="bg-slate-800 rounded-lg p-3 mb-4 break-all">
              <a href={resetUrl} className="text-amber-400 text-xs underline underline-offset-2 break-all">
                {resetUrl}
              </a>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => { navigator.clipboard.writeText(resetUrl); }}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold flex-1"
              >
                Copy Link
              </Button>
              <Button
                onClick={() => setResetUrl(null)}
                variant="ghost"
                className="text-slate-400 hover:text-white flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
