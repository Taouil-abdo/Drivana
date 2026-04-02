'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';

const STATUS_COLOR: Record<string, string> = {
  PENDING:   'text-[#f3b85a]',
  CONFIRMED: 'text-[#fe7f32]',
  COMPLETED: 'text-[#fe7f32]',
  CANCELLED: 'text-[#f87171]',
};
const STATUS_DOT: Record<string, string> = {
  PENDING:   'bg-[#f3b85a]',
  CONFIRMED: 'bg-[#fe7f32]',
  COMPLETED: 'bg-[#fe7f32]',
  CANCELLED: 'bg-[#f87171]',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildWeeklyChart(reservations: any[]) {
  const buckets: Record<string, number> = {};
  DAY_LABELS.forEach(d => (buckets[d] = 0));
  const now = Date.now();
  reservations.forEach(r => {
    const start = new Date(r.startDate).getTime();
    const diffDays = Math.floor((now - start) / 86400000);
    if (diffDays >= 0 && diffDays < 7) {
      const label = DAY_LABELS[new Date(r.startDate).getDay()];
      buckets[label] += Number(r.totalPrice ?? 0);
    }
  });
  const values = DAY_LABELS.map(d => buckets[d]);
  const max = Math.max(...values, 1);
  return DAY_LABELS.map((label, i) => ({
    label,
    value: values[i],
    pct: Math.round((values[i] / max) * 100),
  }));
}

export default function ClientDashboard() {
  const { user } = useAuthStore();
  const { toasts, toast, remove } = useToast();

  const [stats, setStats] = useState<{ total: number; active: number; completed: number; spent: number } | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [showBecomeDriver, setShowBecomeDriver] = useState(false);
  const [driverForm, setDriverForm] = useState({ licenseNumber: '', experienceYears: '', photo: '' });
  const [submittingDriver, setSubmittingDriver] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [s, r] = await Promise.all([
          apiClient.get('/client/stats'),
          apiClient.get('/client/reservations'),
        ]);
        setStats(s.data);
        setReservations(r.data ?? []);
      } catch {
        toast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submitDriverApplication = async () => {
    if (!driverForm.licenseNumber || !driverForm.experienceYears) {
      toast('License number and experience are required', 'error'); return;
    }
    setSubmittingDriver(true);
    try {
      await apiClient.post('/auth/become-driver', {
        licenseNumber: driverForm.licenseNumber,
        experienceYears: Number(driverForm.experienceYears),
        photo: driverForm.photo || undefined,
      });
      toast('Application submitted! Awaiting admin approval.', 'success');
      setShowBecomeDriver(false);
      setDriverForm({ licenseNumber: '', experienceYears: '', photo: '' });
    } catch (e: any) {
      toast(e?.response?.data?.message ?? 'Failed to submit application', 'error');
    } finally { setSubmittingDriver(false); }
  };

  const cancelled  = reservations.filter(r => r.status === 'CANCELLED').length;
  const withDriver = reservations.filter(r => r.serviceType === 'WITH_DRIVER').length;
  const weeklyChart = buildWeeklyChart(reservations);
  const weeklyTotal = weeklyChart.reduce((s, b) => s + b.value, 0);
  const recentRows  = reservations.slice(0, 8);

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(now.getHours())} : ${pad(now.getMinutes())} : ${pad(now.getSeconds())}`;
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const kpis = [
    { label: 'Total Spent',     value: `$${Number(stats?.spent     ?? 0).toFixed(2)}`, icon: '💰', bg: 'border-[#fe7f32]/30 bg-[#fe7f32]/10',  iconBg: 'bg-[#fe7f32]/20 text-[#fe7f32]'  },
    { label: 'Total Bookings',  value: stats?.total     ?? 0,                          icon: '📋', bg: 'border-[#f3b85a]/30 bg-[#f3b85a]/10',  iconBg: 'bg-[#f3b85a]/20 text-[#f3b85a]'  },
    { label: 'Completed Trips', value: stats?.completed ?? 0,                          icon: '✅', bg: 'border-[#fe7f32]/30 bg-[#fe7f32]/10',  iconBg: 'bg-[#fe7f32]/20 text-[#fe7f32]'  },
    { label: 'Active Bookings', value: stats?.active    ?? 0,                          icon: '🚗', bg: 'border-[#a78bfa]/30 bg-[#a78bfa]/10',  iconBg: 'bg-[#a78bfa]/20 text-[#a78bfa]'  },
    { label: 'Cancelled',       value: cancelled,                                      icon: '❌', bg: 'border-[#f87171]/30 bg-[#f87171]/10',  iconBg: 'bg-[#f87171]/20 text-[#f87171]'  },
    { label: 'With Driver',     value: withDriver,                                     icon: '🧑‍✈️', bg: 'border-[#ff9f5a]/30 bg-[#ff9f5a]/10', iconBg: 'bg-[#ff9f5a]/20 text-[#ff9f5a]'  },
  ];

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      <div className="glass-panel fade-rise mb-4 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-label text-[10px] uppercase tracking-[0.22em]">Client Portal</p>
          <h1 className="text-xl font-black uppercase tracking-tight page-title">Dashboard</h1>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-[#888888]">{dateStr}</p>
          <p className="text-2xl font-black tracking-[0.15em] text-[#fe7f32] tabular-nums">{timeStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/client/vehicles"
            className="rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#fe7f32] hover:bg-[#fe7f32]/20 transition">
            + New Booking
          </Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3a3a3a] bg-[#222222] text-sm font-black text-[#eeeeee]">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-16 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#fe7f32] border-t-transparent" />
          <p className="mt-3 text-sm text-[#aaaaaa]">Loading data...</p>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {kpis.map((k, i) => (
              <article key={k.label}
                className={`slide-in rounded-2xl border p-4 flex items-center justify-between ${k.bg}`}
                style={{ animationDelay: `${i * 50}ms` }}>
                <div>
                  <p className="text-2xl font-black text-[#f0f0f0]">{k.value}</p>
                  <p className="mt-0.5 text-[11px] text-[#888888]">{k.label}</p>
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${k.iconBg}`}>
                  {k.icon}
                </div>
              </article>
            ))}
          </div>

          <div className="mb-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <article className="glass-panel scan-lines rounded-2xl p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-2xl font-black text-[#f0f0f0]">${weeklyTotal.toFixed(2)}</p>
                  <p className="text-[11px] text-[#888888]">This Week</p>
                </div>
                <span className="rounded-xl border border-[#fe7f32]/30 bg-[#fe7f32]/10 px-3 py-1.5 text-[11px] font-bold text-[#fe7f32]">
                  Last 7 Days
                </span>
              </div>
              <div className="flex items-end gap-2 border-b border-[#3a3a3a] pb-0" style={{ height: '120px' }}>
                {weeklyChart.map((b, i) => (
                  <div key={i} className="group relative flex flex-1 flex-col items-center gap-1 h-full">
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                      <div className="rounded-lg border border-[#3a3a3a] bg-[#1c1c1c] px-2 py-1 text-center whitespace-nowrap">
                        <p className="text-[10px] font-bold text-[#fe7f32]">${b.value.toFixed(2)}</p>
                      </div>
                      <div className="h-1.5 w-px bg-[#3a3a3a]" />
                    </div>
                    <div className="relative flex w-full flex-1 items-end overflow-hidden rounded-t-md bg-[#2a2a2a]">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-[#fe7f32] to-[#ff9f5a] transition-all duration-700"
                        style={{ height: `${Math.max(b.pct, 4)}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-semibold text-[#aaaaaa] pb-1">{b.label}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="glass-panel scan-lines rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#eeeeee]">Recent Requests</p>
                <Link href="/client/reservations" className="text-[10px] text-[#fe7f32] hover:underline">View all →</Link>
              </div>
              {recentRows.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-[#888888]">No bookings yet.</p>
                  <Link href="/client/vehicles" className="mt-1 inline-block text-xs text-[#fe7f32] hover:underline">Browse vehicles →</Link>
                </div>
              ) : (
                <>
                  <div className="mb-1 grid grid-cols-[1fr_auto_auto] gap-2 px-1 text-[9px] uppercase tracking-widest text-[#888888]">
                    <span>Vehicle</span><span>Price</span><span>Status</span>
                  </div>
                  <div className="space-y-1">
                    {recentRows.map((r: any) => (
                      <div key={r.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-xl border border-[#3a3a3a] bg-[#1e1e1e]/70 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-semibold text-[#eeeeee]">
                            {r.vehicle?.brand} {r.vehicle?.model}
                          </p>
                          <p className="text-[9px] text-[#888888]">{new Date(r.startDate).toLocaleDateString()}</p>
                        </div>
                        <p className="text-[11px] font-bold text-[#eeeeee] whitespace-nowrap">
                          ${Number(r.totalPrice ?? 0).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[r.status] ?? 'bg-[#888888]'}`} />
                          <span className={`text-[9px] font-bold uppercase ${STATUS_COLOR[r.status] ?? 'text-[#888888]'}`}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </article>
          </div>

          {/* Become a Driver banner */}
          <article className="mb-4 overflow-hidden rounded-2xl border border-[#fe7f32]/20"
            style={{
              background: 'linear-gradient(135deg, rgba(254,127,50,0.08) 0%, rgba(30,30,30,0.6) 100%)',
            }}>
            <div className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fe7f32]/15 text-2xl border border-[#fe7f32]/20">
                  🧑‍✈️
                </div>
                <div>
                  <p className="font-black text-[#eeeeee]">Want to earn as a driver?</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Join our driver network — set your schedule, accept rides, earn money.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBecomeDriver(true)}
                className="rounded-xl border border-[#fe7f32]/50 bg-[#fe7f32]/15 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fe7f32] hover:bg-[#fe7f32]/25 transition whitespace-nowrap">
                Apply to Drive →
              </button>
            </div>
          </article>

          <article className="glass-panel scan-lines rounded-2xl p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#eeeeee]">All Trips</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Completed', dot: 'bg-[#fe7f32]' },
                  { label: 'Confirmed', dot: 'bg-[#fe7f32]' },
                  { label: 'Pending',   dot: 'bg-[#f3b85a]' },
                  { label: 'Cancelled', dot: 'bg-[#f87171]' },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5 text-[10px] text-[#aaaaaa]">
                    <span className={`h-2 w-2 rounded-sm ${l.dot}`} />{l.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#3a3a3a] text-[9px] uppercase tracking-[0.12em] text-[#888888]">
                    <th className="pb-2 text-left font-semibold">ID</th>
                    <th className="pb-2 text-left font-semibold">Vehicle</th>
                    <th className="pb-2 text-left font-semibold hidden sm:table-cell">Start</th>
                    <th className="pb-2 text-left font-semibold hidden sm:table-cell">End</th>
                    <th className="pb-2 text-left font-semibold hidden md:table-cell">Service</th>
                    <th className="pb-2 text-left font-semibold hidden md:table-cell">Driver</th>
                    <th className="pb-2 text-left font-semibold">Price</th>
                    <th className="pb-2 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-[#888888]">
                        No trips yet.{' '}
                        <Link href="/client/vehicles" className="text-[#fe7f32] hover:underline">Book a vehicle →</Link>
                      </td>
                    </tr>
                  ) : reservations.map((r: any) => (
                    <tr key={r.id} className="border-b border-[#2a2a2a] hover:bg-[#222222]/60 transition">
                      <td className="py-2.5 pr-2 font-mono text-[10px] text-[#888888]">#{r.id?.slice(-4).toUpperCase()}</td>
                      <td className="py-2.5 pr-3">
                        <p className="font-semibold text-[#eeeeee]">{r.vehicle?.brand} {r.vehicle?.model}</p>
                        <p className="text-[9px] text-[#888888]">{r.vehicle?.registration}</p>
                      </td>
                      <td className="py-2.5 pr-3 hidden sm:table-cell text-[#eeeeee]">{new Date(r.startDate).toLocaleDateString()}</td>
                      <td className="py-2.5 pr-3 hidden sm:table-cell text-[#eeeeee]">{new Date(r.endDate).toLocaleDateString()}</td>
                      <td className="py-2.5 pr-3 hidden md:table-cell text-[#eeeeee]">
                        {r.serviceType === 'WITH_DRIVER' ? '🧑‍✈️ With Driver' : '🚗 Car Only'}
                      </td>
                      <td className="py-2.5 pr-3 hidden md:table-cell text-[#eeeeee]">
                        {r.driver
                          ? `${r.driver?.user?.firstName ?? ''} ${r.driver?.user?.lastName ?? ''}`.trim()
                          : <span className="text-[#888888]">—</span>}
                      </td>
                      <td className="py-2.5 pr-3 font-bold text-[#eeeeee]">${Number(r.totalPrice ?? 0).toFixed(2)}</td>
                      <td className="py-2.5">
                        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${STATUS_COLOR[r.status] ?? 'text-[#888888]'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[r.status] ?? 'bg-[#888888]'}`} />
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </>
      )}

      {/* Become a Driver Modal */}
      {showBecomeDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest page-title">Become a Driver</h2>
                <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Your application will be reviewed by an admin.
                </p>
              </div>
              <button onClick={() => setShowBecomeDriver(false)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  License Number *
                </label>
                <input
                  value={driverForm.licenseNumber}
                  onChange={e => setDriverForm(f => ({ ...f, licenseNumber: e.target.value }))}
                  placeholder="e.g. DL-123456"
                  className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Years of Experience *
                </label>
                <input
                  type="number" min="0"
                  value={driverForm.experienceYears}
                  onChange={e => setDriverForm(f => ({ ...f, experienceYears: e.target.value }))}
                  placeholder="e.g. 3"
                  className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Profile Photo URL (optional)
                </label>
                <input
                  value={driverForm.photo}
                  onChange={e => setDriverForm(f => ({ ...f, photo: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32]"
                />
              </div>

              <div className="rounded-xl border border-[#f3b85a]/20 bg-[#f3b85a]/5 px-3 py-2.5">
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  ⚠ After submitting, an admin will review your application. You'll remain a client until approved.
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowBecomeDriver(false)}
                className="flex-1 rounded-xl border py-2.5 text-xs font-bold uppercase tracking-wider transition"
                style={{ borderColor: 'var(--line-soft)', color: 'var(--text-soft)' }}>
                Cancel
              </button>
              <button onClick={submitDriverApplication} disabled={submittingDriver}
                className="flex-1 rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/15 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fe7f32] hover:bg-[#fe7f32]/25 transition disabled:opacity-50">
                {submittingDriver ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
