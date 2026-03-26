'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';
import Pagination from '@/components/admin/Pagination';

const STATUS_STYLE: Record<string, string> = {
  PENDING:   'bg-[#f3b85a]/20 text-[#f3b85a] border-[#f3b85a]/30',
  CONFIRMED: 'bg-[#fe7f32]/20 text-[#fe7f32] border-[#fe7f32]/30',
  COMPLETED: 'bg-[#fe7f32]/20 text-[#fe7f32] border-[#fe7f32]/30',
  CANCELLED: 'bg-[#f87171]/20 text-[#f87171] border-[#f87171]/30',
};

const FILTERS = ['ALL', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'];
const LIMIT = 10;

export default function DriverReservations() {
  const { toasts, toast, remove } = useToast();

  const [reservations, setReservations] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('ALL');
  const [search,       setSearch]       = useState('');
  const [completing,   setCompleting]   = useState<string | null>(null);
  const [actioning,    setActioning]    = useState<string | null>(null);
  const [page,         setPage]         = useState(1);

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

  const acceptReservation = async (id: string) => {
    setActioning(id);
    try {
      await apiClient.patch(`/driver/reservations/${id}/accept`);
      setReservations(r => r.map(x => x.id === id ? { ...x, status: 'CONFIRMED' } : x));
      toast('Reservation accepted', 'success');
    } catch (e: any) {
      toast(e?.response?.data?.message ?? 'Failed to accept', 'error');
    } finally { setActioning(null); }
  };

  const rejectReservation = async (id: string) => {
    setActioning(id);
    try {
      await apiClient.patch(`/driver/reservations/${id}/reject`);
      setReservations(r => r.map(x => x.id === id ? { ...x, status: 'CANCELLED' } : x));
      toast('Reservation rejected', 'success');
    } catch (e: any) {
      toast(e?.response?.data?.message ?? 'Failed to reject', 'error');
    } finally { setActioning(null); }
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

  const totalPages = Math.ceil(visible.length / LIMIT);
  const paginated  = visible.slice((page - 1) * LIMIT, page * LIMIT);

  const earnings = reservations
    .filter(r => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + Number(r.totalPrice ?? 0), 0);

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      {/* Header */}
      <section className="glass-panel scan-lines fade-rise mb-4 rounded-2xl p-4 sm:p-5 flex items-start justify-between">
        <div>
          <p className="section-label text-[10px] uppercase tracking-[0.24em]">Driver Console</p>
          <h1 className="page-title mt-1 text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl">Reservations</h1>
          <p className="subtitle mt-1 text-sm">All your assigned missions.</p>
        </div>
        <div className="glass-panel rounded-2xl px-4 py-2 text-right">
          <p className="text-[10px] uppercase tracking-widest text-[#888888]">Total Earned</p>
          <p className="text-lg font-black text-[#fe7f32]">${earnings.toFixed(2)}</p>
        </div>
      </section>

      {/* Filter tabs + search */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition
              ${filter === f
                ? 'border-[#fe7f32]/50 bg-[#fe7f32]/15 text-[#fe7f32]'
                : 'border-[#3a3a3a] text-[#aaaaaa] hover:text-[#eeeeee]'}`}>
            {f} <span className="ml-1 opacity-70">{counts[f]}</span>
          </button>
        ))}
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search client or vehicle..."
          className="ml-auto rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-1.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32]"
        />
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
                <th className="px-4 py-3 text-left hidden md:table-cell">Dates</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#888888]">No reservations found</td></tr>
              ) : paginated.map((r: any) => (
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
                    <p className="text-[#eeeeee]">{new Date(r.startDate).toLocaleDateString()}</p>
                    <p className="text-[10px] text-[#aaaaaa]">→ {new Date(r.endDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#eeeeee] hidden md:table-cell">
                    ${Number(r.totalPrice ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[r.status] ?? ''}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'PENDING' ? (
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => acceptReservation(r.id)}
                          disabled={actioning === r.id}
                          className="rounded-lg border border-[#4ade80]/40 bg-[#4ade80]/10 px-2 py-1 text-[10px] font-bold text-[#4ade80] hover:bg-[#4ade80]/20 transition disabled:opacity-50"
                        >
                          {actioning === r.id ? '...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => rejectReservation(r.id)}
                          disabled={actioning === r.id}
                          className="rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 px-2 py-1 text-[10px] font-bold text-[#f87171] hover:bg-[#f87171]/20 transition disabled:opacity-50"
                        >
                          {actioning === r.id ? '...' : 'Reject'}
                        </button>
                      </div>
                    ) : r.status === 'CONFIRMED' ? (
                      <button
                        onClick={() => completeReservation(r.id)}
                        disabled={completing === r.id}
                        className="rounded-lg border border-[#fe7f32]/40 bg-[#fe7f32]/10 px-2 py-1 text-[10px] font-bold text-[#fe7f32] hover:bg-[#fe7f32]/20 transition disabled:opacity-50"
                      >
                        {completing === r.id ? '...' : 'Complete'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#888888]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} total={visible.length} limit={LIMIT} onPage={setPage} />
    </>
  );
}
