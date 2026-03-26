'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';

export default function AdminDashboard() {
  const { toasts, toast, remove } = useToast();

  const [loading,      setLoading]      = useState(true);
  const [stats,        setStats]        = useState<any>(null);
  const [users,        setUsers]        = useState<any[]>([]);
  const [drivers,      setDrivers]      = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [revenue,      setRevenue]      = useState<any[]>([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [s, u, d, r, rev] = await Promise.all([
        apiClient.get('/admin/statistics'),
        apiClient.get('/admin/users'),
        apiClient.get('/admin/drivers/pending'),
        apiClient.get('/admin/reservations'),
        apiClient.get('/admin/revenue/monthly'),
      ]);
      setStats(s.data);
      setUsers((u.data ?? []).slice(0, 5));
      setDrivers(d.data ?? []);
      setReservations((r.data ?? []).slice(0, 5));
      setRevenue(rev.data ?? []);
    } catch {
      toast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const kpis = [
    { label: 'Total Users',    value: stats?.totalUsers         ?? 0, color: 'from-[#fe7f32]/20' },
    { label: 'Active Drivers', value: stats?.totalDrivers       ?? 0, color: 'from-[#ff9f5a]/20' },
    { label: 'Vehicles',       value: stats?.totalVehicles      ?? 0, color: 'from-[#8f7cff]/20' },
    { label: 'Reservations',   value: stats?.totalReservations  ?? 0, color: 'from-[#f3b85a]/20' },
    { label: 'Active Bookings',value: stats?.activeReservations ?? 0, color: 'from-[#f87171]/20' },
    { label: 'Revenue',        value: `$${stats?.totalRevenue   ?? 0}`, color: 'from-[#fe7f32]/20' },
  ];

  const maxRev   = Math.max(...revenue.map(r => r.revenue), 1);
  const chartBars = revenue.map(r => ({
    label:   r.month.slice(5),
    pct:     Math.round((r.revenue / maxRev) * 100),
    revenue: r.revenue,
    count:   r.count,
  }));

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      {/* Header */}
      <section className="glass-panel scan-lines fade-rise mb-4 rounded-2xl p-4 sm:p-5">
        <p className="section-label text-[10px] uppercase tracking-[0.24em]">Admin Control Center</p>
        <h1 className="page-title mt-1 text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="subtitle mt-1 text-sm">Platform overview — users, fleet, drivers, reservations.</p>
      </section>

      {loading ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#fe7f32] border-t-transparent" />
          <p className="mt-3 text-sm text-[#aaaaaa]">Loading data...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {kpis.map((k, i) => (
              <article key={k.label} className={`glass-panel slide-in rounded-2xl bg-gradient-to-br ${k.color} to-[#0a2c3f]/20 p-4`} style={{ animationDelay: `${i * 50}ms` }}>
                <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>{k.label}</p>
                <p className="mt-2 text-2xl font-black" style={{ color: 'var(--text-main)' }}>{k.value}</p>
              </article>
            ))}
          </div>

          {/* Revenue Chart + Pending Drivers */}
          <div className="mb-4 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
            <article className="glass-panel scan-lines rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#eeeeee]">Monthly Revenue</p>
                <p className="text-[10px] text-[#888888]">Completed reservations only</p>
              </div>
              {chartBars.length === 0 ? (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-xs text-[#888888]">No completed reservations yet</p>
                </div>
              ) : (
                <div className="flex h-36 items-end gap-2">
                  {chartBars.map((b, i) => (
                    <div key={i} className="group relative flex flex-1 flex-col items-center gap-1">
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
                        <div className="rounded-lg border border-[#3a3a3a] bg-[#1c1c1c] px-2 py-1 text-center">
                          <p className="text-[10px] font-bold text-[#fe7f32]">${b.revenue.toFixed(0)}</p>
                          <p className="text-[9px] text-[#888888]">{b.count} bookings</p>
                        </div>
                        <div className="h-1.5 w-px bg-[#3a3a3a]" />
                      </div>
                      <div className="relative flex h-full w-full items-end overflow-hidden rounded-md bg-[#0b2a3e]">
                        <div className="w-full rounded-md bg-gradient-to-t from-[#fe7f32] to-[#56e0ff] transition-all duration-500" style={{ height: `${b.pct}%` }} />
                      </div>
                      <p className="text-[10px] text-[#aaaaaa]">{b.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="glass-panel scan-lines rounded-2xl p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#eeeeee]">
                Pending Drivers <span className="ml-1 rounded-full bg-[#f3b85a]/20 px-2 py-0.5 text-[#f3b85a]">{drivers.length}</span>
              </p>
              <div className="space-y-2">
                {drivers.length === 0 ? (
                  <p className="text-xs text-[#888888]">No pending applications</p>
                ) : drivers.slice(0, 4).map((d: any) => (
                  <div key={d.id} className="rounded-xl border border-[#7f3742] bg-[#1a080c]/80 p-2.5">
                    <p className="text-xs font-semibold text-[#ffc8cf]">{d.user?.firstName} {d.user?.lastName}</p>
                    <p className="text-[10px] text-[#ff9cab]">Awaiting review</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          {/* Recent Users + Recent Reservations */}
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="glass-panel scan-lines rounded-2xl p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#eeeeee]">Recent Users</p>
              <div className="space-y-2">
                {users.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between rounded-xl border border-[#3a3a3a] bg-[#082334]/70 px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-[#ddf8ff]">{u.firstName} {u.lastName}</p>
                      <p className="text-[10px] text-[#aaaaaa]">{u.email}</p>
                    </div>
                    <span className="rounded-full border border-[#2e8fb4]/40 px-2 py-0.5 text-[10px] uppercase text-[#aaaaaa]">{u.role}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="glass-panel scan-lines rounded-2xl p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#eeeeee]">Recent Reservations</p>
              <div className="space-y-2">
                {reservations.length === 0 ? (
                  <p className="text-xs text-[#888888]">No reservations yet</p>
                ) : reservations.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border border-[#3a3a3a] bg-[#082334]/70 px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-[#ddf8ff]">
                        {r.serviceType === 'WITH_DRIVER' ? '🧑✈️ With Driver' : '🚗 Car Only'}
                      </p>
                      <p className="text-[10px] text-[#aaaaaa]">{new Date(r.startDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-semibold
                      ${r.status === 'CONFIRMED' ? 'bg-[#fe7f32]/20 text-[#fe7f32]' :
                        r.status === 'PENDING'   ? 'bg-[#f3b85a]/20 text-[#f3b85a]' :
                        r.status === 'CANCELLED' ? 'bg-[#f87171]/20 text-[#f87171]' :
                        'bg-[#fe7f32]/20 text-[#fe7f32]'}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </>
      )}
    </>
  );
}
