'use client';

import { useState, useMemo } from 'react';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';
import { usePaginatedApi } from '@/lib/usePaginatedApi';
import Pagination from '@/components/admin/Pagination';
import SortTh from '@/components/admin/SortTh';
import { exportCsv } from '@/lib/exportCsv';

const STATUS_STYLE: Record<string, string> = {
  PENDING:   'bg-[#f3b85a]/20 text-[#f3b85a] border-[#f3b85a]/30',
  CONFIRMED: 'bg-[#fe7f32]/20 text-[#fe7f32] border-[#fe7f32]/30',
  COMPLETED: 'bg-[#fe7f32]/20 text-[#fe7f32] border-[#fe7f32]/30',
  CANCELLED: 'bg-[#f87171]/20 text-[#f87171] border-[#f87171]/30',
};
const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const FILTERS  = ['ALL', ...STATUSES];
const LIMIT    = 15;

export default function AdminReservations() {
  const { toasts, toast, remove } = useToast();
  const [filter,      setFilter]      = useState('ALL');
  const [search,      setSearch]      = useState('');
  const [updating,    setUpdating]    = useState<string | null>(null);
  const [detail,      setDetail]      = useState<any>(null);
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [bulkStatus,  setBulkStatus]  = useState('CONFIRMED');
  const [bulkUpdating,setBulkUpdating]= useState(false);
  const [contractLoading, setContractLoading] = useState(false);

  const extraParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (search)            p.search = search;
    if (filter !== 'ALL')  p.status = filter;
    return p;
  }, [search, filter]);

  const { data: reservations, total, totalPages, page, sortBy, sortDir, loading, goToPage, toggleSort, refresh } =
    usePaginatedApi<any>({ url: '/admin/reservations', limit: LIMIT, initialSort: 'createdAt', extraParams });

  const allSelected = reservations.length > 0 && reservations.every(r => selected.has(r.id));
  const toggleAll = () => {
    if (allSelected) setSelected(s => { const n = new Set(s); reservations.forEach(r => n.delete(r.id)); return n; });
    else             setSelected(s => { const n = new Set(s); reservations.forEach(r => n.add(r.id));    return n; });
  };
  const toggleOne = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await apiClient.patch(`/admin/reservations/${id}/status`, { status });
      toast('Status updated', 'success'); refresh();
      if (detail?.id === id) setDetail((d: any) => ({ ...d, status }));
    } catch { toast('Failed to update status', 'error'); }
    finally { setUpdating(null); }
  };

  const forceDownload = async (reservationId: string) => {
    const token = localStorage.getItem('token');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
    const res = await fetch(`${baseUrl}/payment/contract/${reservationId}/admin/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-${reservationId.slice(-8).toUpperCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadOrGenerateContract = async (reservationId: string) => {
    setContractLoading(true);
    try {
      await forceDownload(reservationId);
    } catch (e: any) {
      toast(e?.message ?? 'Failed to get contract', 'error');
    } finally { setContractLoading(false); }
  };

  const bulkUpdateStatus = async () => {
    setBulkUpdating(true);
    let ok = 0;
    for (const id of selected) {
      try { await apiClient.patch(`/admin/reservations/${id}/status`, { status: bulkStatus }); ok++; } catch {}
    }
    toast(`Updated ${ok} reservation${ok !== 1 ? 's' : ''} to ${bulkStatus}`, 'success');
    setSelected(new Set()); setBulkUpdating(false); refresh();
  };

  const handleExport = () => {
    const rows = reservations.map(r => ({
      ID:        r.id,
      Client:    `${r.client?.firstName ?? ''} ${r.client?.lastName ?? ''}`.trim(),
      Email:     r.client?.email ?? '',
      Vehicle:   `${r.vehicle?.brand ?? ''} ${r.vehicle?.model ?? ''}`.trim(),
      Plate:     r.vehicle?.registration ?? '',
      Service:   r.serviceType,
      StartDate: r.startDate,
      EndDate:   r.endDate,
      Price:     Number(r.totalPrice ?? 0).toFixed(2),
      Status:    r.status,
    }));
    exportCsv(`reservations-${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      <section className="glass-panel scan-lines fade-rise mb-4 rounded-2xl p-4 sm:p-5 flex items-start justify-between">
        <div>
          <p className="section-label text-[10px] uppercase tracking-[0.24em]">Admin Control Center</p>
          <h1 className="page-title mt-1 text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl">Reservations</h1>
          <p className="subtitle mt-1 text-sm">Monitor and manage all bookings.</p>
        </div>
        <div className="glass-panel rounded-2xl px-4 py-2 text-right">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Showing</p>
          <p className="text-lg font-black text-[#fe7f32]">{total} total</p>
        </div>
      </section>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition
              ${filter === f ? 'border-[#fe7f32]/50 bg-[#fe7f32]/15 text-[#fe7f32]' : 'border-[#3a3a3a] text-[#aaaaaa] hover:text-[#eeeeee]'}`}>
            {f}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search client or vehicle..."
          className="ml-auto rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-1.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32]" />
        <button onClick={handleExport}
          className="rounded-xl border border-[#3a3a3a] px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition hover:border-[#fe7f32]/40 hover:text-[#fe7f32]"
          style={{ color: 'var(--text-soft)' }}>
          ↓ CSV
        </button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-[#fe7f32]/30 bg-[#fe7f32]/8 px-4 py-2.5">
          <span className="text-xs font-bold text-[#fe7f32]">{selected.size} selected</span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
            className="rounded-lg border border-[#3a3a3a] bg-[#1c1c1c] px-2 py-1 text-[10px] uppercase text-[#eeeeee] outline-none">
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={bulkUpdateStatus} disabled={bulkUpdating}
            className="rounded-lg border border-[#fe7f32]/40 bg-[#fe7f32]/10 px-3 py-1 text-[10px] font-bold text-[#fe7f32] hover:bg-[#fe7f32]/20 disabled:opacity-50">
            {bulkUpdating ? 'Updating...' : 'Apply to Selected'}
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>Clear</button>
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
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Client</th>
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.12em] hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>Vehicle</th>
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.12em] hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Type</th>
                  <SortTh col="startDate"   label="Dates"     sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} className="hidden lg:table-cell" />
                  <SortTh col="totalPrice"  label="Price"     sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell" />
                  <SortTh col="status"      label="Status"    sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <th className="px-4 py-3 text-right text-[9px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#888888]">No reservations found</td></tr>
                ) : reservations.map((r: any) => (
                  <tr key={r.id} className="border-b transition cursor-pointer" style={{ borderColor: 'var(--line-soft)', background: selected.has(r.id) ? 'rgba(254,127,50,0.05)' : undefined }}
                    onClick={() => setDetail(r)}>
                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggleOne(r.id); }}>
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} className="accent-[#fe7f32]" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: 'var(--text-main)' }}>{r.client?.firstName} {r.client?.lastName}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{r.client?.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p style={{ color: 'var(--text-soft)' }}>{r.vehicle?.brand} {r.vehicle?.model}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{r.vehicle?.registration}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold
                        ${r.serviceType === 'WITH_DRIVER' ? 'border-[#ff9f5a]/30 bg-[#ff9f5a]/10 text-[#ff9f5a]' : 'border-[#3a3a3a] text-[#aaaaaa]'}`}>
                        {r.serviceType === 'WITH_DRIVER' ? '🧑‍✈️ Driver' : '🚗 Car Only'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p style={{ color: 'var(--text-soft)' }}>{new Date(r.startDate).toLocaleDateString()}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>→ {new Date(r.endDate).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#fe7f32] hidden md:table-cell">${Number(r.totalPrice ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[r.status] ?? ''}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <select value={r.status} disabled={updating === r.id} onChange={e => updateStatus(r.id, e.target.value)}
                        className="rounded-lg border border-[#3a3a3a] bg-[#1c1c1c] px-2 py-1 text-[10px] uppercase text-[#eeeeee] outline-none disabled:opacity-50">
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPage={goToPage} />
        </>
      )}

      {/* Reservation Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest page-title">Reservation Details</h2>
              <button onClick={() => setDetail(null)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div className="space-y-3">
              {/* ID */}
              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Reservation ID</p>
                <p className="font-mono text-xs" style={{ color: 'var(--text-main)' }}>#{detail.id?.slice(-8).toUpperCase()}</p>
              </div>

              {/* Client */}
              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Client</p>
                <p className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>{detail.client?.firstName} {detail.client?.lastName}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{detail.client?.email}</p>
                {detail.client?.phone && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{detail.client?.phone}</p>}
              </div>

              {/* Vehicle */}
              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Vehicle</p>
                <p className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>{detail.vehicle?.brand} {detail.vehicle?.model}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{detail.vehicle?.year} · {detail.vehicle?.registration}</p>
              </div>

              {/* Dates & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                  <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Start Date</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>{new Date(detail.startDate).toLocaleDateString()}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                  <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>End Date</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>{new Date(detail.endDate).toLocaleDateString()}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                  <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Service</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>{detail.serviceType === 'WITH_DRIVER' ? '🧑‍✈️ With Driver' : '🚗 Car Only'}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                  <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Total Price</p>
                  <p className="text-xs font-black text-[#fe7f32]">${Number(detail.totalPrice ?? 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Driver */}
              {detail.driver && (
                <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                  <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Assigned Driver</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                    {detail.driver?.user?.firstName} {detail.driver?.user?.lastName}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>License: {detail.driver?.licenseNumber}</p>
                </div>
              )}

              {/* Status change */}
              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Status</p>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[detail.status] ?? ''}`}>{detail.status}</span>
                  <select value={detail.status} disabled={updating === detail.id}
                    onChange={e => updateStatus(detail.id, e.target.value)}
                    className="rounded-lg border border-[#3a3a3a] bg-[#1c1c1c] px-2 py-1 text-[10px] uppercase text-[#eeeeee] outline-none">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {['CONFIRMED', 'COMPLETED'].includes(detail.status) && (
                <button onClick={() => downloadOrGenerateContract(detail.id)} disabled={contractLoading}
                  className="w-full rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/10 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fe7f32] hover:bg-[#fe7f32]/20 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {contractLoading ? (
                    <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#fe7f32] border-t-transparent" /> Generating...</>
                  ) : '📄 Download Contract PDF'}
                </button>
              )}
              <button onClick={() => setDetail(null)}
                className="w-full rounded-xl border border-[#3a3a3a] py-2.5 text-xs font-bold uppercase tracking-wider transition"
                style={{ color: 'var(--text-soft)' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
