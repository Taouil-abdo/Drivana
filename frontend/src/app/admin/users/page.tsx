'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';

const ROLES = ['CLIENT', 'DRIVER', 'ADMIN'];

export default function AdminUsers() {
  const { toasts, toast, remove } = useToast();

  const [users,      setUsers]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [confirm,    setConfirm]    = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/admin/users');
      setUsers(res.data ?? []);
    } catch {
      toast('Failed to load users', 'error');
    } finally { setLoading(false); }
  };

  const updateRole = async (id: string, role: string) => {
    try {
      await apiClient.patch(`/admin/users/${id}/role`, { role });
      setUsers(u => u.map(x => x.id === id ? { ...x, role } : x));
      toast('Role updated', 'success');
    } catch { toast('Failed to update role', 'error'); }
  };

  const deleteUser = async (id: string) => {
    try {
      await apiClient.delete(`/admin/users/${id}`);
      setUsers(u => u.filter(x => x.id !== id));
      toast('User deleted', 'success');
    } catch { toast('Failed to delete user', 'error'); }
    setConfirm(null);
  };

  const filtered = users.filter(u =>
    (!roleFilter || u.role === roleFilter) &&
    (!search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      <section className="glass-panel scan-lines fade-rise mb-4 rounded-2xl p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[#79afc5]">Admin Control Center</p>
        <h1 className="mt-1 text-2xl font-black uppercase leading-none tracking-tight text-[#e8fbff] sm:text-3xl">Users</h1>
        <p className="mt-1 text-sm text-[#9cc1d1]">Manage platform users and their roles.</p>
      </section>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or email..."
          className="flex-1 min-w-[180px] rounded-xl border border-[#1e5670] bg-[#051a28] px-3 py-2 text-xs text-[#c8f2ff] placeholder-[#4a8fa8] outline-none focus:border-[#2ec5f5]"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="rounded-xl border border-[#1e5670] bg-[#051a28] px-3 py-2 text-xs text-[#c8f2ff] outline-none focus:border-[#2ec5f5]"
        >
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#2ec5f5] border-t-transparent" />
        </div>
      ) : (
        <div className="glass-panel scan-lines rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1e5670] text-[#4a8fa8] uppercase tracking-[0.12em]">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Phone</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[#4a8fa8]">No users found</td></tr>
              ) : filtered.map((u: any) => (
                <tr key={u.id} className="border-b border-[#0d2e42] hover:bg-[#0a2233]/60 transition">
                  <td className="px-4 py-3 font-semibold text-[#ddf8ff]">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-[#7ea8bc] hidden sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3 text-[#7ea8bc] hidden md:table-cell">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={e => updateRole(u.id, e.target.value)}
                      className="rounded-lg border border-[#1e5670] bg-[#051a28] px-2 py-1 text-[10px] uppercase text-[#c8f2ff] outline-none"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-[#7ea8bc] hidden lg:table-cell">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {confirm === u.id ? (
                      <span className="inline-flex gap-2">
                        <button onClick={() => deleteUser(u.id)} className="rounded-lg bg-[#f87171]/20 px-2 py-1 text-[10px] text-[#f87171] hover:bg-[#f87171]/30">Confirm</button>
                        <button onClick={() => setConfirm(null)} className="rounded-lg bg-[#1e5670]/40 px-2 py-1 text-[10px] text-[#7ea8bc]">Cancel</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirm(u.id)} className="rounded-lg border border-[#7c3d45] bg-[#1a080c] px-2 py-1 text-[10px] text-[#ffc8cf] hover:bg-[#2a0e14]">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
