"use client";

import { useEffect, useState } from "react";
import { UserCog, UserPlus, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

type User = {
  username: string;
  role: "tenaga_kesehatan" | "masyarakat" | "admin";
  name: string;
  phone?: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"tenaga_kesehatan" | "masyarakat" | "admin">("tenaga_kesehatan");
  const [password, setPassword] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await api.get<User[]>("/api/admin/users");
      setUsers(list);
    } catch (e) {
      toast.error(`Gagal load users: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password) {
      toast.error("Nama dan password wajib");
      return;
    }
    try {
      await api.post<User>("/api/admin/users", { name, phone, password, role });
      toast.success("User dibuat");
      setName(""); setPhone(""); setPassword(""); setShowForm(false);
      refresh();
    } catch (e) {
      toast.error(`Gagal: ${e}`);
    }
  };

  const handleDelete = async (username: string) => {
    if (!confirm(`Hapus user ${username}?`)) return;
    try {
      await api.delete(`/api/admin/users/${username}`);
      toast.success("User dihapus");
      refresh();
    } catch (e) {
      toast.error(`Gagal: ${e}`);
    }
  };

  const generatedUsername = name && phone ? name.toLowerCase().replace(/\s/g, "") + phone.slice(-4) : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="w-6 h-6 text-blue-500" />
            Manage Users
          </h1>
          <p className="text-sm text-slate-500 mt-1">{users.length} user terdaftar</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl">
          <UserPlus className="w-4 h-4" /> Tambah User
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Tambah User Baru</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nama</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Telepon</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as "tenaga_kesehatan" | "masyarakat" | "admin")} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
                <option value="tenaga_kesehatan">Tenaga Kesehatan</option>
                <option value="masyarakat">Masyarakat</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          {generatedUsername && (
            <p className="text-xs text-slate-500">Username auto-generated: <span className="font-mono text-purple-400">{generatedUsername}</span></p>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 text-sm rounded-lg text-slate-400 hover:text-white">Batal</button>
            <button type="submit" className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg">Simpan</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat...
        </div>
      ) : (
        <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-slate-500">
                <th className="text-left p-3 px-4">Username</th>
                <th className="text-left p-3">Nama</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Telepon</th>
                <th className="text-right p-3 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.username} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3 px-4 font-mono text-xs text-purple-400">{u.username}</td>
                  <td className="p-3">{u.name}</td>
                  <td className="p-3"><span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400">{u.role}</span></td>
                  <td className="p-3 text-slate-400">{u.phone || "-"}</td>
                  <td className="p-3 px-4 text-right">
                    <button onClick={() => handleDelete(u.username)} aria-label={`Delete ${u.username}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
