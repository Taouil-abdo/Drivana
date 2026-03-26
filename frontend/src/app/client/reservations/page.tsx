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

const FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export default function ClientReservations() {
  const { toasts, toast, remove } = useToast();

  const [reservations, setReservations] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('ALL');
  const [confirm,      setConfirm]      = useState<string | null>(null);
  const [cancelling,   setCancelling]   = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/client/reservations');
        setReservations(res.data ?? []);
      } catch { toast('Failed to load reservations', 'error'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const cancelReservation = async (id: string) => {
    setCancelling(id);
    try {
      await apiClient.patch(`/client/reservations/${id}/cancel`);
      setReservations(r => r.map(x => x.id === id ? { ...x, status: 'CANCELLED' } : x));
      toast('Reservation cancelled', 'success');
    } catch (e: any) {
      toast(e?.response?.data?.message ?? 'Failed to cancel', 'error');
    } finally { setCancelling(null); setConfirm(null); }
  };

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'ALL' ? reservations.length : reservations.filter(r => r.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  const visible = reservations.filter(r => filter === 'ALL' || r.status === filter);

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      {/* Header */}
      <section className="glass-panel scan-lines fade-rise mb-5 rounded-2xl p-5">
        <p className="section-label text-[10px] uppercase tracking-[0.24em]">My Account</p>
        <h1 className="page-title mt-1 text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl">My Reservations</h1>
        <p className="subtitle mt-1 text-sm">Track and manage all your bookings.</p>
      </section>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition
              ${filter === f
                ? 'border-[#fe7f32]/50 bg-[#fe7f32]/15 text-[#fe7f32]'
                : 'border-[#3a3a3a] text-[#aaaaaa] hover:text-[#eeeeee]'}`}>
            {f} <span className="ml-1 opacity-70">{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#fe7f32] border-t-transparent" />
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <p className="text-sm text-[#888888]">No reservations found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r: any) => (
            <article key={r.id} className="glass-panel rounded-2xl p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">

                {/* Vehicle info */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] text-xl">
                    🚗
                  </div>
                  <div>
                    <p className="font-bold text-[#f0f0f0]">{r.vehicle?.brand} {r.vehicle?.model}</p>
                    <p className="text-[11px] text-[#aaaaaa]">{r.vehicle?.registration} · {r.vehicle?.year}</p>
                  </div>
                </div>

                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[r.status] ?? ''}`}>
                  {r.status}
                </span>
              </div>

              {/* Details row */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl border border-[#3a3a3a] bg-[#1c1c1c]/80 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-[#888888]">Start</p>
                  <p className="text-xs font-semibold text-[#eeeeee]">{new Date(r.startDate).toLocaleDateString()}</p>
                </div>
                <div className="rounded-xl border border-[#3a3a3a] bg-[#1c1c1c]/80 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-[#888888]">End</p>
                  <p className="text-xs font-semibold text-[#eeeeee]">{new Date(r.endDate).toLocaleDateString()}</p>
                </div>
                <div className="rounded-xl border border-[#3a3a3a] bg-[#1c1c1c]/80 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-[#888888]">Service</p>
                  <p className="text-xs font-semibold text-[#eeeeee]">
                    {r.serviceType === 'WITH_DRIVER' ? '🧑✈️ Driver' : '🚗 Self'}
                  </p>
                </div>
                <div className="rounded-xl border border-[#3a3a3a] bg-[#1c1c1c]/80 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-[#888888]">Total</p>
                  <p className="text-xs font-bold text-[#fe7f32]">${Number(r.totalPrice ?? 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Driver info if assigned */}
              {r.driver && (
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#3a3a3a] bg-[#1c1c1c]/80 px-3 py-2">
                  <span className="text-sm">🧑✈️</span>
                  <p className="text-xs text-[#eeeeee]">
                    Driver: <span className="font-semibold">{r.driver?.user?.firstName} {r.driver?.user?.lastName}</span>
                  </p>
                </div>
              )}

              {/* Cancel action */}
              {['PENDING', 'CONFIRMED'].includes(r.status) && (
                <div className="mt-3 flex justify-end">
                  {confirm === r.id ? (
                    <span className="inline-flex gap-2">
                      <button
                        onClick={() => cancelReservation(r.id)}
                        disabled={cancelling === r.id}
                        className="rounded-lg bg-[#f87171]/20 px-3 py-1.5 text-[11px] font-bold text-[#f87171] hover:bg-[#f87171]/30 disabled:opacity-50"
                      >
                        {cancelling === r.id ? 'Cancelling...' : 'Confirm Cancel'}
                      </button>
                      <button onClick={() => setConfirm(null)}
                        className="rounded-lg bg-[#3a3a3a]/40 px-3 py-1.5 text-[11px] text-[#aaaaaa]">
                        Keep
                      </button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirm(r.id)}
                      className="rounded-lg border border-[#7c3d45] bg-[#1a080c] px-3 py-1.5 text-[11px] font-bold text-[#ffc8cf] hover:bg-[#2a0e14] transition">
                      Cancel Booking
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
