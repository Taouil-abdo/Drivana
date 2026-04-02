'use client';

import { useState, useMemo } from 'react';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';
import { usePaginatedApi } from '@/lib/usePaginatedApi';
import Pagination from '@/components/admin/Pagination';
import SortTh from '@/components/admin/SortTh';
import { exportCsv } from '@/lib/exportCsv';

const ROLES = ['CLIENT', 'DRIVER', 'ADMIN'];
const LIMIT = 15;

export default function AdminUsers() {
  const { toasts, toast, remove } = useToast();
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [confirm,    setConfirm]    = useState<string | null>(null);
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const extraParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (search)     p.search = search;
    if (roleFilter) p.role   = roleFilter;
    return p;
  }, [search, roleFilter]);

  const { data: users, total, totalPages, page, sortBy, sortDir, loading, goToPage, toggleSort, refresh } =
    usePaginatedApi<any>({ url: '/admin/users', limit: LIMIT, initialSort: 'createdAt', extraParams });

  const allSelected = users.length > 0 && users.every(u => selected.has(u.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(s => { const n = new Set(s); users.forEach(u => n.delete(u.id)); return n; });
    } else {
      setSelected(s => { const n = new Set(s); users.forEach(u => n.add(u.id)); return n; });
    }
  };

  const toggleOne = (id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const updateRole = async (id: string, role: string) => {
    try {
      await apiClient.patch(`/admin/users/${id}/role`, { role });
      toast('Role updated', 'success'); refresh();
    } catch { toast('Failed to update role', 'error'); }
  };

  const deleteUser = async (id: string) => {
    try {
      await apiClient.delete(`/admin/users/${id}`);
      toast('User deleted', 'success');
      setSelected(s => { const n = new Set(s); n.delete(id); return n; });
      refresh();
    } catch { toast('Failed to delete user', 'error'); }
    setConfirm(null);
  };

  const bulkDelete = async () => {
    setBulkDeleting(true);
    let ok = 0;
    for (const id of selected) {
      try { await apiClient.delete(`/admin/users/${id}`); ok++; } catch {}
    }
    toast(`Deleted ${ok} user${ok !== 1 ? 's' : ''}`, 'success');
    setSelected(new Set());
    setBulkDeleting(false);
    refresh();
  };

  const handleExport = () => {
    const rows = users.map(u => ({
      ID:        u.id,
      FirstName: u.firstName,
      LastName:  u.lastName,
      Email:     u.email,
      Phone:     u.phone ?? '',
      Role:      u.role,
      Joined:    new Date(u.createdAt).toLocaleDateString(),
    }));
    exportCsv(`users-${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      <section className="glass-panel scan-lines fade-rise mb-4 rounded-2xl p-4 sm:p-5 flex items-start justify-between">
        <div>
          <p className="section-label text-[10px] uppercase tracking-[0.24em]">Admin Control Center</p>
          <h1 className="page-title mt-1 text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl">Users</h1>
          <p className="subtitle mt-1 text-sm">Manage platform users and their roles.</p>
        </div>
        <button onClick={handleExport}
          className="rounded-xl border border-[#3a3a3a] px-4 py-2 text-xs font-bold uppercase tracking-widest transition hover:border-[#fe7f32]/40 hover:text-[#fe7f32]"
          style={{ color: 'var(--text-soft)' }}>
          ↓ Export CSV
        </button>
      </section>

      <div className="mb-4 flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..."
          className="flex-1 min-w-[180px] rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32]" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2 text-xs text-[#eeeeee] outline-none focus:border-[#fe7f32]">
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#fe7f32]/30 bg-[#fe7f32]/8 px-4 py-2.5">
          <span className="text-xs font-bold text-[#fe7f32]">{selected.size} selected</span>
          <button onClick={bulkDelete} disabled={bulkDeleting}
            className="rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 px-3 py-1 text-[10px] font-bold text-[#f87171] hover:bg-[#f87171]/20 disabled:opacity-50">
            {bulkDeleting ? 'Deleting...' : `Delete ${selected.size}`}
          </button>
          <button onClick={() => setSelected(new Set())}
            className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>Clear</button>
        </div>
      )}

      {loading ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#fe7f32] border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="glass-panel scan-lines rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#3a3a3a]">
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-[#fe7f32]" />
                  </th>
                  <SortTh col="firstName" label="Name"   sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <SortTh col="email"     label="Email"  sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} className="hidden sm:table-cell" />
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.12em] hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Phone</th>
                  <SortTh col="role"      label="Role"   sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <SortTh col="createdAt" label="Joined" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} className="hidden lg:table-cell" />
                  <th className="px-4 py-3 text-right text-[9px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-[#888888]">No users found</td></tr>
                ) : users.map((u: any) => (
                  <tr key={u.id} className="border-b transition" style={{ borderColor: 'var(--line-soft)', background: selected.has(u.id) ? 'rgba(254,127,50,0.05)' : undefined }}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} className="accent-[#fe7f32]" />
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-main)' }}>{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>{u.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <select value={u.role} onChange={e => updateRole(u.id, e.target.value)}
                        className="rounded-lg border border-[#3a3a3a] bg-[#1c1c1c] px-2 py-1 text-[10px] uppercase text-[#eeeeee] outline-none">
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {confirm === u.id ? (
                        <span className="inline-flex gap-2">
                          <button onClick={() => deleteUser(u.id)} className="rounded-lg bg-[#f87171]/20 px-2 py-1 text-[10px] text-[#f87171] hover:bg-[#f87171]/30">Confirm</button>
                          <button onClick={() => setConfirm(null)} className="rounded-lg bg-[#3a3a3a]/40 px-2 py-1 text-[10px] text-[#aaaaaa]">Cancel</button>
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
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPage={goToPage} />
        </>
      )}
    </>
  );
}
