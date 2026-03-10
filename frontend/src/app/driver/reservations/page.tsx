'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';

const STATUS_STYLE: Record<string, string> = {
  PENDING:   'bg-[#f3b85a]/20 text-[#f3b85a] border-[#f3b85a]/30',
  CONFIRMED: 'bg-[#2ec5f5]/20 text-[#2ec5f5] border-[#2ec5f5]/30',
  COMPLETED: 'bg-[#42d99a]/20 text-[#42d99a] border-[#42d99a]/30',
  CANCELLED: 'bg-[#f87171]/20 text-[#f87171] border-[#f87171]/30',
};

const FILTERS = ['ALL', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'];

export default function DriverReservations() {
  const { toasts, toast, remove } = useToast();

  const [reservations, setReservations] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('ALL');
  const [search,       setSearch]       = useState('');
  const [completing,   setCompleting]   = useState<string | null>(null);

  useEffect(() => { fetchReservations(); }, []);

  const fetchReservations = async () => {
    try {
      const res = await apiClient.get('/driver/reservations');
      setReservations(res.data ?? []);
    } catch { toast('Failed to load reservations', 'error'); }
    finally { setLoading(false); }
  };

  const completeReservation = async (id: string) => {
    setCompleting(id);
    try {
      await apiClient.patch(`/driver/reservations/${id}/complete`);
      setReservations(r => r.map(x => x.id === id ? { ...x, status: 'COMPLETED' } : x));
      toast('Trip marked as completed', 'success');
    } catch (e: any) {
      toast(e?.response?.data?.message ?? 'Failed to complete trip', 'error');
    } finally { setCompleting(null); }
  };

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'ALL' ? reservations.length : reservations.filter(r => r.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  const sorted = [...reservations].sort((a, b) => {
    const order: Record<string, number> = { CONFIRMED: 0, PENDING: 1, COMPLETED: 2, CANCELLED: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  const visible = sorted.filter(r => {
    const matchFilter = filter === 'ALL' || r.status === filter;
    const matchSearch = !search ||
      `${r.client?.firstName} ${r.client?.lastName} ${r.vehicle?.brand} ${r.vehicle?.model}`
        .toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const earnings = reservations
    .filter(r => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + Number(r.totalPrice ?? 0), 0);

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      {/* Header */}
      <section className="glass-panel scan-lines fade-rise mb-4 rounded-2xl p-4 sm:p-5 flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#79afc5]">Driver Console</p>
          <h1 className="mt-1 text-2xl font-black uppercase leading-none tracking-tight text-[#e8fbff] sm:text-3xl">Reservations</h1>
          <p className="mt-1 text-sm text-[#9cc1d1]">All your assigned missions.</p>
        </div>
        <div className="glass-panel rounded-2xl px-4 py-2 text-right">
          <p className="text-[10px] uppercase tracking-widest text-[#4a8fa8]">Total Earned</p>
          <p className="text-lg font-black text-[#42d99a]">${earnings.toFixed(2)}</p>
        </div>
      </section>

      {/* Filter tabs + search */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition
              ${filter === f
                ? 'border-[#2ec5f5]/50 bg-[#2ec5f5]/15 text-[#2ec5f5]'
                : 'border-[#1e5670] text-[#7ea8bc] hover:text-[#c8f2ff]'}`}>
            {f} <span className="ml-1 opacity-70">{counts[f]}</span>
          </button>
        ))}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search client or vehicle..."
          className="ml-auto rounded-xl border border-[#1e5670] bg-[#051a28] px-3 py-1.5 text-xs text-[#c8f2ff] placeholder-[#4a8fa8] outline-none focus:border-[#2ec5f5]"
        />
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
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Vehicle</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Dates</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#4a8fa8]">No reservations found</td></tr>
              ) : visible.map((r: any) => (
                <tr key={r.id} className="border-b border-[#0d2e42] hover:bg-[#0a2233]/60 transition">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#ddf8ff]">{r.client?.firstName} {r.client?.lastName}</p>
                    <p className="text-[10px] text-[#7ea8bc]">{r.client?.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-[#c8f2ff]">{r.vehicle?.brand} {r.vehicle?.model}</p>
                    <p className="text-[10px] text-[#7ea8bc]">{r.vehicle?.registration}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-[#c8f2ff]">{new Date(r.startDate).toLocaleDateString()}</p>
                    <p className="text-[10px] text-[#7ea8bc]">→ {new Date(r.endDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#c8f2ff] hidden md:table-cell">
                    ${Number(r.totalPrice ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[r.status] ?? ''}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'CONFIRMED' ? (
                      <button
                        onClick={() => completeReservation(r.id)}
                        disabled={completing === r.id}
                        className="rounded-lg border border-[#42d99a]/40 bg-[#42d99a]/10 px-2 py-1 text-[10px] font-bold text-[#42d99a] hover:bg-[#42d99a]/20 transition disabled:opacity-50"
                      >
                        {completing === r.id ? '...' : 'Complete'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#4a8fa8]">—</span>
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
