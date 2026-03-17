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

export default function DriverDashboard() {
  const { toasts, toast, remove } = useToast();

  const [loading,      setLoading]      = useState(true);
  const [profile,      setProfile]      = useState<any>(null);
  const [stats,        setStats]        = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [toggling,     setToggling]     = useState(false);
  const [completing,   setCompleting]   = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [p, s, r] = await Promise.all([
        apiClient.get('/driver/me'),
        apiClient.get('/driver/stats'),
        apiClient.get('/driver/reservations'),
      ]);
      setProfile(p.data);
      setStats(s.data);
      setReservations(r.data ?? []);
    } catch (e: any) {
      toast(e?.response?.data?.message ?? 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
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

  const completeReservation = async (id: string) => {
    setCompleting(id);
    try {
      await apiClient.patch(`/driver/reservations/${id}/complete`);
      setReservations(r => r.map(x => x.id === id ? { ...x, status: 'COMPLETED' } : x));
      setStats((s: any) => s ? { ...s, completed: s.completed + 1, confirmed: s.confirmed - 1 } : s);
      toast('Trip marked as completed', 'success');
    } catch (e: any) { toast(e?.response?.data?.message ?? 'Failed to complete trip', 'error'); }
    finally { setCompleting(null); }
  };

  // sort: CONFIRMED first, then PENDING, then rest
  const sorted = [...reservations].sort((a, b) => {
    const order: Record<string, number> = { CONFIRMED: 0, PENDING: 1, COMPLETED: 2, CANCELLED: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  const nextTrip = sorted.find(r => r.status === 'CONFIRMED' || r.status === 'PENDING');

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      {/* Header */}
      <section className="glass-panel scan-lines fade-rise mb-4 rounded-2xl p-4 sm:p-5 flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#79afc5]">Driver Console</p>
          <h1 className="mt-1 text-2xl font-black uppercase leading-none tracking-tight text-[#e8fbff] sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-[#9cc1d1]">Track your missions, earnings and availability.</p>
        </div>
        {!loading && (
          <button
            onClick={toggleAvailability}
            disabled={toggling}
            className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-widest transition disabled:opacity-50
              ${profile?.isAvailable
                ? 'border-[#42d99a]/40 bg-[#42d99a]/10 text-[#42d99a] hover:bg-[#42d99a]/20'
                : 'border-[#f87171]/40 bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171]/20'}`}
          >
            {toggling ? '...' : profile?.isAvailable ? '● Online' : '○ Offline'}
          </button>
        )}
      </section>

      {loading ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#2ec5f5] border-t-transparent" />
          <p className="mt-3 text-sm text-[#7eb3c9]">Loading your dashboard…</p>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total Missions', value: stats?.total     ?? 0, color: 'border-[#2ec5f5]/30 bg-[#071d29]' },
              { label: 'Completed',      value: stats?.completed ?? 0, color: 'border-[#42d99a]/30 bg-[#071f23]' },
              { label: 'Confirmed',      value: stats?.confirmed ?? 0, color: 'border-[#f3b85a]/30 bg-[#211d07]' },
              { label: 'Earnings',       value: `$${Number(stats?.earnings ?? 0).toFixed(2)}`, color: 'border-[#a78bfa]/30 bg-[#201a33]' },
            ].map(k => (
              <article key={k.label} className={`glass-panel slide-in rounded-2xl border p-4 ${k.color}`}>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#7eaec4]">{k.label}</p>
                <p className="mt-2 text-2xl font-black text-[#e4f9ff]">{k.value}</p>
              </article>
            ))}
          </div>

          {/* Profile + Next Trip */}
          <div className="mb-4 grid gap-4 lg:grid-cols-2">

            {/* Profile card */}
            <article className="glass-panel rounded-2xl p-4 sm:p-5">
              <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-[#7eaec4]">My Profile</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#2ec5f5]/50 bg-[#0b2433] text-sm font-bold text-[#c8f2ff]">
                  {profile?.user?.firstName?.[0]}{profile?.user?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-[#e4f9ff]">{profile?.user?.firstName} {profile?.user?.lastName}</p>
                  <p className="text-[11px] text-[#7ea8bc]">{profile?.user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-[#1e5670] bg-[#051a28]/80 p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-[#7eaec4]">License</p>
                  <p className="mt-1 text-xs font-bold text-[#e4f9ff]">{profile?.licenseNumber}</p>
                </div>
                <div className="rounded-xl border border-[#1e5670] bg-[#051a28]/80 p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-[#7eaec4]">Experience</p>
                  <p className="mt-1 text-xs font-bold text-[#e4f9ff]">{profile?.experienceYears} yrs</p>
                </div>
                <div className="rounded-xl border border-[#1e5670] bg-[#051a28]/80 p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-[#7eaec4]">Rating</p>
                  <p className="mt-1 text-xs font-bold text-[#e4f9ff]">{Number(profile?.rating ?? 0).toFixed(1)} / 5</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-xl border border-[#1e5670] bg-[#051a28]/80 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-[#7eaec4]">Account Status</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[profile?.status] ?? 'text-[#c8f2ff]'}`}>
                  {profile?.status}
                </span>
              </div>
            </article>

            {/* Next trip */}
            <article className="glass-panel rounded-2xl p-4 sm:p-5">
              <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-[#7eaec4]">Next Mission</p>
              {!nextTrip ? (
                <div className="flex h-full min-h-[120px] items-center justify-center">
                  <p className="text-sm text-[#4a8fa8]">No upcoming missions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-[#ddf8ff]">{nextTrip.client?.firstName} {nextTrip.client?.lastName}</p>
                      <p className="text-[11px] text-[#7ea8bc]">{nextTrip.client?.email}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[nextTrip.status] ?? ''}`}>
                      {nextTrip.status}
                    </span>
                  </div>
                  <div className="rounded-xl border border-[#1e5670] bg-[#051a28]/80 px-3 py-2.5 space-y-1">
                    <p className="text-xs text-[#c8f2ff]">🚗 {nextTrip.vehicle?.brand} {nextTrip.vehicle?.model} — {nextTrip.vehicle?.registration}</p>
                    <p className="text-xs text-[#c8f2ff]">📅 {new Date(nextTrip.startDate).toLocaleDateString()} → {new Date(nextTrip.endDate).toLocaleDateString()}</p>
                    <p className="text-xs text-[#c8f2ff]">💰 ${Number(nextTrip.totalPrice ?? 0).toFixed(2)}</p>
                  </div>
                  {nextTrip.status === 'CONFIRMED' && (
                    <button
                      onClick={() => completeReservation(nextTrip.id)}
                      disabled={completing === nextTrip.id}
                      className="w-full rounded-xl border border-[#42d99a]/40 bg-[#42d99a]/10 py-2.5 text-xs font-bold uppercase tracking-widest text-[#42d99a] hover:bg-[#42d99a]/20 transition disabled:opacity-50"
                    >
                      {completing === nextTrip.id ? 'Completing...' : '✓ Mark as Completed'}
                    </button>
                  )}
                </div>
              )}
            </article>
          </div>

          {/* All missions table */}
          <section className="glass-panel scan-lines rounded-2xl p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#dff8ff]">All Missions</p>
              <p className="text-[10px] text-[#4a8fa8]">{reservations.length} total</p>
            </div>

            {sorted.length === 0 ? (
              <p className="text-xs text-[#4a8fa8]">No missions assigned yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#1e5670] text-[#4a8fa8] uppercase tracking-[0.12em]">
                      <th className="px-3 py-3 text-left">Client</th>
                      <th className="px-3 py-3 text-left hidden sm:table-cell">Vehicle</th>
                      <th className="px-3 py-3 text-left hidden md:table-cell">Dates</th>
                      <th className="px-3 py-3 text-left hidden md:table-cell">Price</th>
                      <th className="px-3 py-3 text-left">Status</th>
                      <th className="px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r: any) => (
                      <tr key={r.id} className="border-b border-[#0d2e42] hover:bg-[#0a2233]/60 transition">
                        <td className="px-3 py-3">
                          <p className="font-semibold text-[#ddf8ff]">{r.client?.firstName} {r.client?.lastName}</p>
                          <p className="text-[10px] text-[#7ea8bc]">{r.client?.email}</p>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <p className="text-[#c8f2ff]">{r.vehicle?.brand} {r.vehicle?.model}</p>
                          <p className="text-[10px] text-[#7ea8bc]">{r.vehicle?.registration}</p>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <p className="text-[#c8f2ff]">{new Date(r.startDate).toLocaleDateString()}</p>
                          <p className="text-[10px] text-[#7ea8bc]">→ {new Date(r.endDate).toLocaleDateString()}</p>
                        </td>
                        <td className="px-3 py-3 font-semibold text-[#c8f2ff] hidden md:table-cell">
                          ${Number(r.totalPrice ?? 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[r.status] ?? ''}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
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
          </section>
        </>
      )}
    </>
  );
}
