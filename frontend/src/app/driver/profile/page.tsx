'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';

const STATUS_STYLE: Record<string, string> = {
  APPROVED:  'bg-[#fe7f32]/20 text-[#fe7f32] border-[#fe7f32]/30',
  PENDING:   'bg-[#f3b85a]/20 text-[#f3b85a] border-[#f3b85a]/30',
  REJECTED:  'bg-[#f87171]/20 text-[#f87171] border-[#f87171]/30',
  SUSPENDED: 'bg-[#a78bfa]/20 text-[#a78bfa] border-[#a78bfa]/30',
};

type Tab = 'profile' | 'earnings';

export default function DriverProfile() {
  const { toasts, toast, remove } = useToast();

  const [tab,       setTab]       = useState<Tab>('profile');
  const [profile,   setProfile]   = useState<any>(null);
  const [stats,     setStats]     = useState<any>(null);
  const [earnings,  setEarnings]  = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [toggling,  setToggling]  = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [p, s, e] = await Promise.all([
        apiClient.get('/driver/me'),
        apiClient.get('/driver/stats'),
        apiClient.get('/driver/earnings'),
      ]);
      setProfile(p.data);
      setStats(s.data);
      setEarnings(e.data);
    } catch { toast('Failed to load profile', 'error'); }
    finally { setLoading(false); }
  };

  const toggleAvailability = async () => {
    setToggling(true);
    try {
      const res = await apiClient.patch('/driver/availability');
      setProfile((p: any) => ({ ...p, isAvailable: res.data.isAvailable }));
      toast(`You are now ${res.data.isAvailable ? 'Online' : 'Offline'}`, 'success');
    } catch { toast('Failed to update availability', 'error'); }
    finally { setToggling(false); }
  };

  const stars = (rating: number) => '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

  const maxMonth = Math.max(...(earnings?.monthly ?? []).map((m: any) => m.amount), 1);

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      <section className="glass-panel scan-lines fade-rise mb-4 rounded-2xl p-4 sm:p-5 flex items-start justify-between">
        <div>
          <p className="section-label text-[10px] uppercase tracking-[0.24em]">Driver Console</p>
          <h1 className="page-title mt-1 text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl">My Profile</h1>
          <p className="subtitle mt-1 text-sm">Your driver information and performance overview.</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {(['profile', 'earnings'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition
              ${tab === t ? 'border-[#fe7f32]/50 bg-[#fe7f32]/15 text-[#fe7f32]' : 'border-[#3a3a3a] text-[#aaaaaa] hover:text-[#eeeeee]'}`}>
            {t === 'profile' ? '👤 Profile' : '💰 Earnings'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#fe7f32] border-t-transparent" />
        </div>
      ) : tab === 'profile' ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          {/* Identity card */}
          <article className="glass-panel rounded-2xl p-5">
            <p className="mb-4 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>Identity</p>
            <div className="flex items-center gap-4 mb-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#fe7f32]/50 bg-[#0b2433] text-xl font-black text-[#eeeeee]">
                {profile?.user?.firstName?.[0]}{profile?.user?.lastName?.[0]}
              </div>
              <div>
                <p className="text-lg font-black" style={{ color: 'var(--text-main)' }}>{profile?.user?.firstName} {profile?.user?.lastName}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{profile?.user?.email}</p>
                {profile?.user?.phone && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{profile?.user?.phone}</p>}
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'License Number', value: profile?.licenseNumber },
                { label: 'Experience',     value: `${profile?.experienceYears} years` },
                { label: 'Member Since',   value: new Date(profile?.createdAt).toLocaleDateString() },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between rounded-xl border px-3 py-2.5"
                  style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{row.label}</p>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>{row.value}</p>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl border px-3 py-2.5"
                style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Account Status</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[profile?.status] ?? ''}`}>
                  {profile?.status}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border px-3 py-2.5"
                style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Availability</p>
                <button onClick={toggleAvailability} disabled={toggling || profile?.status !== 'APPROVED'}
                  className={`rounded-lg border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-40
                    ${profile?.isAvailable ? 'border-[#fe7f32]/40 bg-[#fe7f32]/10 text-[#fe7f32]' : 'border-[#f87171]/40 bg-[#f87171]/10 text-[#f87171]'}`}>
                  {toggling ? '...' : profile?.isAvailable ? '● Online' : '○ Offline'}
                </button>
              </div>
            </div>
            {profile?.status !== 'APPROVED' && (
              <p className="mt-3 text-[11px] text-[#f3b85a]">⚠ Your account is {profile?.status?.toLowerCase()}. Contact admin.</p>
            )}
          </article>

          {/* Performance */}
          <div className="flex flex-col gap-4">
            <article className="glass-panel rounded-2xl p-5">
              <p className="mb-3 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>Rating</p>
              <div className="flex items-end gap-3">
                <p className="text-5xl font-black" style={{ color: 'var(--text-main)' }}>{Number(profile?.rating ?? 0).toFixed(1)}</p>
                <div className="pb-1">
                  <p className="text-lg tracking-widest text-[#f3b85a]">{stars(Number(profile?.rating ?? 0))}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>out of 5.0</p>
                </div>
              </div>
            </article>
            <article className="glass-panel rounded-2xl p-5">
              <p className="mb-3 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>Performance</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total',     value: stats?.total     ?? 0 },
                  { label: 'Completed', value: stats?.completed ?? 0 },
                  { label: 'Confirmed', value: stats?.confirmed ?? 0 },
                  { label: 'Pending',   value: stats?.pending   ?? 0 },
                ].map(k => (
                  <div key={k.label} className="rounded-xl border p-3" style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{k.label}</p>
                    <p className="mt-1 text-2xl font-black" style={{ color: 'var(--text-main)' }}>{k.value}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="glass-panel rounded-2xl p-5">
              <p className="mb-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>Total Earnings</p>
              <p className="text-3xl font-black text-[#fe7f32]">${Number(stats?.earnings ?? 0).toFixed(2)}</p>
              <p className="mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>From completed trips only</p>
            </article>
          </div>
        </div>
      ) : (
        /* ── Earnings Tab ── */
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <article className="glass-panel rounded-2xl p-4 border border-[#fe7f32]/20">
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total Earned</p>
              <p className="mt-1 text-2xl font-black text-[#fe7f32]">${Number(earnings?.total ?? 0).toFixed(2)}</p>
            </article>
            <article className="glass-panel rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Completed Trips</p>
              <p className="mt-1 text-2xl font-black" style={{ color: 'var(--text-main)' }}>{earnings?.trips?.length ?? 0}</p>
            </article>
            <article className="glass-panel rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Avg per Trip</p>
              <p className="mt-1 text-2xl font-black" style={{ color: 'var(--text-main)' }}>
                ${earnings?.trips?.length ? (Number(earnings.total) / earnings.trips.length).toFixed(2) : '0.00'}
              </p>
            </article>
          </div>

          {/* Monthly chart */}
          {earnings?.monthly?.length > 0 && (
            <article className="glass-panel rounded-2xl p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--text-main)' }}>Monthly Earnings</p>
              <div className="flex items-end gap-2" style={{ height: '120px' }}>
                {earnings.monthly.map((m: any, i: number) => (
                  <div key={i} className="group relative flex flex-1 flex-col items-center gap-1 h-full">
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                      <div className="rounded-lg border border-[#3a3a3a] bg-[#1c1c1c] px-2 py-1 whitespace-nowrap">
                        <p className="text-[10px] font-bold text-[#fe7f32]">${Number(m.amount).toFixed(2)}</p>
                      </div>
                      <div className="h-1.5 w-px bg-[#3a3a3a]" />
                    </div>
                    <div className="relative flex w-full flex-1 items-end overflow-hidden rounded-t-md" style={{ background: 'var(--bg-soft)' }}>
                      <div className="w-full rounded-t-md bg-gradient-to-t from-[#fe7f32] to-[#ff9f5a] transition-all duration-700"
                        style={{ height: `${Math.max(Math.round((m.amount / maxMonth) * 100), 4)}%` }} />
                    </div>
                    <p className="text-[9px] font-semibold pb-1" style={{ color: 'var(--text-muted)' }}>{m.month.slice(5)}</p>
                  </div>
                ))}
              </div>
            </article>
          )}

          {/* Per-trip breakdown */}
          <article className="glass-panel rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--line-soft)' }}>
              <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--text-main)' }}>Trip Breakdown</p>
            </div>
            {!earnings?.trips?.length ? (
              <p className="px-4 py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No completed trips yet.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--line-soft)' }}>
                    {['Date', 'Client', 'Vehicle', 'Earned'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[9px] uppercase tracking-[0.12em]"
                        style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {earnings.trips.map((r: any) => (
                    <tr key={r.id} className="border-b transition" style={{ borderColor: 'var(--line-soft)' }}>
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-muted)' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-main)' }}>
                        {r.client?.firstName} {r.client?.lastName}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-soft)' }}>
                        {r.vehicle?.brand} {r.vehicle?.model}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-[#fe7f32]">
                        ${Number(r.totalPrice ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </article>
        </div>
      )}
    </>
  );
}
