'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';

const STATUS_STYLE: Record<string, string> = {
  PENDING:   'bg-[#f3b85a]/20 text-[#f3b85a] border-[#f3b85a]/30',
  CONFIRMED: 'bg-[#fe7f32]/20 text-[#fe7f32] border-[#fe7f32]/30',
  COMPLETED: 'bg-[#fe7f32]/20 text-[#fe7f32] border-[#fe7f32]/30',
  CANCELLED: 'bg-[#f87171]/20 text-[#f87171] border-[#f87171]/30',
};
const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const FILTERS  = ['ALL', ...STATUSES];

export default function AdminReservations() {
  const { toasts, toast, remove } = useToast();

  const [reservations, setReservations] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('ALL');
  const [search,       setSearch]       = useState('');
  const [updating,     setUpdating]     = useState<string | null>(null);

  useEffect(() => { fetchReservations(); }, []);

  const fetchReservations = async () => {
    try {
      const res = await apiClient.get('/admin/reservations');
      setReservations(res.data ?? []);
    } catch { toast('Failed to load reservations', 'error'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await apiClient.patch(`/admin/reservations/${id}/status`, { status });
      setReservations(r => r.map(x => x.id === id ? { ...x, status } : x));
      toast('Status updated', 'success');
    } catch { toast('Failed to update status', 'error'); }
    finally { setUpdating(null); }
  };

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'ALL' ? reservations.length : reservations.filter(r => r.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  const visible = reservations.filter(r => {
    const matchFilter = filter === 'ALL' || r.status === filter;
    const matchSearch = !search || `${r.client?.firstName} ${r.client?.lastName} ${r.vehicle?.brand} ${r.vehicle?.model}`
      .toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalRevenue = reservations
    .filter(r => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + Number(r.totalPrice ?? 0), 0);

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
          <p className="text-[10px] uppercase tracking-widest text-[#888888]">Total Revenue</p>
          <p className="text-lg font-black text-[#fe7f32]">${totalRevenue.toFixed(2)}</p>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition
              ${filter === f ? 'border-[#fe7f32]/50 bg-[#fe7f32]/15 text-[#fe7f32]' : 'border-[#3a3a3a] text-[#aaaaaa] hover:text-[#eeeeee]'}`}>
            {f} <span className="ml-1 opacity-70">{counts[f]}</span>
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search client or vehicle..."
          className="ml-auto rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-1.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32]" />
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#fe7f32] border-t-transparent" />
        </div>
      ) : (
        <div className="glass-panel scan-lines rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#3a3a3a] text-[#888888] uppercase tracking-[0.12em]">
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Vehicle</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Type</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Dates</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-[#888888]">No reservations found</td></tr>
              ) : visible.map((r: any) => (
                <tr key={r.id} className="border-b border-[#0d2e42] hover:bg-[#222222]/60 transition">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#ddf8ff]">{r.client?.firstName} {r.client?.lastName}</p>
                    <p className="text-[10px] text-[#aaaaaa]">{r.client?.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-[#eeeeee]">{r.vehicle?.brand} {r.vehicle?.model}</p>
                    <p className="text-[10px] text-[#aaaaaa]">{r.vehicle?.registration}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold
                      ${r.serviceType === 'WITH_DRIVER' ? 'border-[#ff9f5a]/30 bg-[#ff9f5a]/10 text-[#ff9f5a]' : 'border-[#3a3a3a] text-[#aaaaaa]'}`}>
                      {r.serviceType === 'WITH_DRIVER' ? '🧑✈️ Driver' : '🚗 Car Only'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-[#eeeeee]">{new Date(r.startDate).toLocaleDateString()}</p>
                    <p className="text-[10px] text-[#aaaaaa]">→ {new Date(r.endDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#eeeeee] hidden md:table-cell">${Number(r.totalPrice ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[r.status] ?? ''}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
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
      )}
    </>
  );
}
