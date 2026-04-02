'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

const FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const LIMIT = 6;

export default function ClientReservations() {
  const router = useRouter();
  const { toasts, toast, remove } = useToast();

  const [reservations,    setReservations]    = useState<any[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [filter,          setFilter]          = useState('ALL');
  const [confirm,         setConfirm]         = useState<string | null>(null);
  const [cancelling,      setCancelling]      = useState<string | null>(null);
  const [deleting,        setDeleting]        = useState<string | null>(null);
  const [detail,          setDetail]          = useState<any>(null);
  const [showRating,      setShowRating]      = useState(false);
  const [rating,          setRating]          = useState(0);
  const [ratingComment,   setRatingComment]   = useState('');
  const [submittingRating,setSubmittingRating]= useState(false);
  const [contractLoading, setContractLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await apiClient.get('/client/reservations');
      setReservations(res.data ?? []);
    } catch { toast('Failed to load reservations', 'error'); }
    finally { setLoading(false); }
  };

  const deleteReservation = async (id: string) => {
    setDeleting(id);
    try {
      await apiClient.delete(`/client/reservations/${id}`);
      setReservations(r => r.filter(x => x.id !== id));
      setDetail(null);
      toast('Reservation deleted', 'success');
    } catch (e: any) {
      toast(e?.response?.data?.message ?? 'Failed to delete', 'error');
    } finally { setDeleting(null); }
  };

  const cancelReservation = async (id: string) => {
    setCancelling(id);
    try {
      await apiClient.patch(`/client/reservations/${id}/cancel`);
      setReservations(r => r.map(x => x.id === id ? { ...x, status: 'CANCELLED' } : x));
      if (detail?.id === id) setDetail((d: any) => ({ ...d, status: 'CANCELLED' }));
      toast('Reservation cancelled', 'success');
    } catch (e: any) {
      toast(e?.response?.data?.message ?? 'Failed to cancel', 'error');
    } finally { setCancelling(null); setConfirm(null); }
  };

  const downloadContract = async (reservationId: string) => {
    setContractLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
      const res = await fetch(`${baseUrl}/payment/contract/${reservationId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { toast('Contract not available yet', 'error'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${reservationId.slice(-8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast('Failed to download contract', 'error');
    } finally { setContractLoading(false); }
  };

  const submitRating = async () => {
    if (!rating || !detail?.driver?.id) return;
    setSubmittingRating(true);
    try {
      await apiClient.post(`/driver/drivers/${detail.driver.id}/rate`, {
        rating,
        comment: ratingComment || undefined,
      });
      toast('Rating submitted — thank you!', 'success');
      setShowRating(false);
      setRating(0);
      setRatingComment('');
    } catch (e: any) {
      toast(e?.response?.data?.message ?? 'Failed to submit rating', 'error');
    } finally { setSubmittingRating(false); }
  };

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'ALL' ? reservations.length : reservations.filter(r => r.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  const visible = reservations.filter(r => filter === 'ALL' || r.status === filter);
  const totalPages = Math.ceil(visible.length / LIMIT);
  const paginated  = visible.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      <section className="glass-panel scan-lines fade-rise mb-5 rounded-2xl p-5">
        <p className="section-label text-[10px] uppercase tracking-[0.24em]">My Account</p>
        <h1 className="page-title mt-1 text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl">My Reservations</h1>
        <p className="subtitle mt-1 text-sm">Track and manage all your bookings.</p>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition
              ${filter === f ? 'border-[#fe7f32]/50 bg-[#fe7f32]/15 text-[#fe7f32]' : 'border-[#3a3a3a] text-[#aaaaaa] hover:text-[#eeeeee]'}`}>
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
        <>
          <div className="space-y-3">
            {paginated.map((r: any) => (
            <article key={r.id}
              className="glass-panel rounded-2xl p-4 sm:p-5 cursor-pointer hover:border-[#fe7f32]/30 transition"
              onClick={() => { setDetail(r); setShowRating(false); setRating(0); setRatingComment(''); }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {r.vehicle?.imageUrl ? (
                    <img src={r.vehicle.imageUrl} alt={r.vehicle.brand}
                      className="h-12 w-16 rounded-xl object-cover border border-[#3a3a3a]" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] text-xl">🚗</div>
                  )}
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text-main)' }}>{r.vehicle?.brand} {r.vehicle?.model}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{r.vehicle?.registration} · {r.vehicle?.year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[r.status] ?? ''}`}>
                    {r.status}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>View →</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: 'Start',   value: new Date(r.startDate).toLocaleDateString() },
                  { label: 'End',     value: new Date(r.endDate).toLocaleDateString() },
                  { label: 'Service', value: r.serviceType === 'WITH_DRIVER' ? '🧑‍✈️ Driver' : '🚗 Self' },
                  { label: 'Total',   value: `$${Number(r.totalPrice ?? 0).toFixed(2)}`, accent: true },
                ].map(d => (
                  <div key={d.label} className="rounded-xl border px-3 py-2"
                    style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{d.label}</p>
                    <p className={`text-xs font-semibold ${(d as any).accent ? 'text-[#fe7f32]' : ''}`}
                      style={(d as any).accent ? {} : { color: 'var(--text-main)' }}>{d.value}</p>
                  </div>
                ))}
              </div>
            </article>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} total={visible.length} limit={LIMIT} onPage={setPage} />
        </>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest page-title">Booking Details</h2>
              <button onClick={() => { setDetail(null); setShowRating(false); setConfirm(null); }}
                style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>

            {detail.vehicle?.imageUrl && (
              <img src={detail.vehicle.imageUrl} alt={detail.vehicle.brand}
                className="mb-4 h-36 w-full rounded-xl object-cover border" style={{ borderColor: 'var(--line-soft)' }} />
            )}

            <div className="space-y-2 mb-4">
              {[
                { label: 'Booking ID',  value: `#${detail.id?.slice(-8).toUpperCase()}` },
                { label: 'Vehicle',     value: `${detail.vehicle?.brand} ${detail.vehicle?.model} (${detail.vehicle?.registration})` },
                { label: 'Start Date',  value: new Date(detail.startDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) },
                { label: 'End Date',    value: new Date(detail.endDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) },
                { label: 'Service',     value: detail.serviceType === 'WITH_DRIVER' ? '🧑‍✈️ With Driver' : '🚗 Self-Drive' },
                { label: 'Total Price', value: `$${Number(detail.totalPrice ?? 0).toFixed(2)}`, accent: true },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between rounded-xl border px-3 py-2.5"
                  style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{row.label}</p>
                  <p className={`text-xs font-semibold ${(row as any).accent ? 'text-[#fe7f32]' : ''}`}
                    style={(row as any).accent ? {} : { color: 'var(--text-main)' }}>{row.value}</p>
                </div>
              ))}

              <div className="flex items-center justify-between rounded-xl border px-3 py-2.5"
                style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Status</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[detail.status] ?? ''}`}>
                  {detail.status}
                </span>
              </div>

              {detail.driver && (
                <div className="rounded-xl border px-3 py-3" style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Assigned Driver</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#fe7f32]/30 bg-[#fe7f32]/10 text-xs font-black text-[#fe7f32]">
                      {detail.driver?.user?.firstName?.[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                        {detail.driver?.user?.firstName} {detail.driver?.user?.lastName}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        ★ {Number(detail.driver?.rating ?? 0).toFixed(1)} · {detail.driver?.experienceYears} yrs exp
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {['PENDING', 'CONFIRMED', 'COMPLETED'].includes(detail.status) && (
                <button onClick={() => downloadContract(detail.id)} disabled={contractLoading}
                  className="w-full rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/10 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fe7f32] hover:bg-[#fe7f32]/20 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {contractLoading ? (
                    <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#fe7f32] border-t-transparent" /> Loading...</>
                  ) : '📄 Download Contract PDF'}
                </button>
              )}

              {['PENDING', 'CONFIRMED'].includes(detail.status) && (
                confirm === detail.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => cancelReservation(detail.id)} disabled={cancelling === detail.id}
                      className="flex-1 rounded-xl bg-[#f87171]/20 py-2.5 text-xs font-bold text-[#f87171] hover:bg-[#f87171]/30 disabled:opacity-50">
                      {cancelling === detail.id ? 'Cancelling...' : 'Confirm Cancel'}
                    </button>
                    <button onClick={() => setConfirm(null)}
                      className="flex-1 rounded-xl border py-2.5 text-xs font-bold"
                      style={{ borderColor: 'var(--line-soft)', color: 'var(--text-soft)' }}>
                      Keep Booking
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirm(detail.id)}
                    className="w-full rounded-xl border border-[#7c3d45] bg-[#1a080c] py-2.5 text-xs font-bold text-[#ffc8cf] hover:bg-[#2a0e14] transition">
                    Cancel Booking
                  </button>
                )
              )}

              {detail.status === 'CANCELLED' && (
                <button onClick={() => deleteReservation(detail.id)} disabled={deleting === detail.id}
                  className="w-full rounded-xl border border-[#f87171]/40 bg-[#f87171]/10 py-2.5 text-xs font-bold uppercase tracking-widest text-[#f87171] hover:bg-[#f87171]/20 transition disabled:opacity-50">
                  {deleting === detail.id ? 'Deleting...' : '🗑 Delete Reservation'}
                </button>
              )}

              {['CANCELLED', 'COMPLETED'].includes(detail.status) && detail.vehicle && (
                <button onClick={() => { setDetail(null); router.push(`/client/booking/${detail.vehicle.id}`); }}
                  className="w-full rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/10 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fe7f32] hover:bg-[#fe7f32]/20 transition">
                  🔄 Rebook This Vehicle
                </button>
              )}

              {detail.status === 'COMPLETED' && detail.driver && !showRating && (
                <button onClick={() => setShowRating(true)}
                  className="w-full rounded-xl border border-[#f3b85a]/40 bg-[#f3b85a]/10 py-2.5 text-xs font-bold uppercase tracking-widest text-[#f3b85a] hover:bg-[#f3b85a]/20 transition">
                  ★ Rate Your Driver
                </button>
              )}

              {showRating && (
                <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-main)' }}>Rate Your Driver</p>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setRating(s)}
                        className={`text-3xl transition hover:scale-110 ${s <= rating ? 'text-[#f3b85a]' : 'text-[#3a3a3a]'}`}>
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)}
                    placeholder="Optional comment..." rows={2}
                    className="w-full rounded-xl border px-3 py-2 text-xs outline-none resize-none"
                    style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-soft)', color: 'var(--text-main)' }} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowRating(false)}
                      className="flex-1 rounded-xl border py-2 text-xs"
                      style={{ borderColor: 'var(--line-soft)', color: 'var(--text-soft)' }}>Cancel</button>
                    <button onClick={submitRating} disabled={!rating || submittingRating}
                      className="flex-1 rounded-xl bg-[#f3b85a] py-2 text-xs font-bold text-black disabled:opacity-40">
                      {submittingRating ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  </div>
                </div>
              )}

              <button onClick={() => { setDetail(null); setShowRating(false); setConfirm(null); }}
                className="w-full rounded-xl border py-2.5 text-xs font-bold uppercase tracking-wider transition"
                style={{ borderColor: 'var(--line-soft)', color: 'var(--text-soft)' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
