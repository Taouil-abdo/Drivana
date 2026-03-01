'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import apiClient from '@/lib/api';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router   = useRouter();

  const [mounted,      setMounted]      = useState(false);
  const [sidebar,      setSidebar]      = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [stats,        setStats]        = useState<any>(null);
  const [users,        setUsers]        = useState<any[]>([]);
  const [drivers,      setDrivers]      = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [revenue,      setRevenue]      = useState<any[]>([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user)                 { router.push('/login');     return; }
    if (user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    fetchAll();
  }, [mounted, user]);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2ec5f5] border-t-transparent" />
    </div>
  );

  if (!user || user.role !== 'ADMIN') return null;

  const kpis = [
    { label: 'Total Users',    value: stats?.totalUsers         ?? 0, color: 'from-[#2ec5f5]/20' },
    { label: 'Active Drivers', value: stats?.totalDrivers       ?? 0, color: 'from-[#49e2d2]/20' },
    { label: 'Vehicles',       value: stats?.totalVehicles      ?? 0, color: 'from-[#8f7cff]/20' },
    { label: 'Reservations',   value: stats?.totalReservations  ?? 0, color: 'from-[#f3b85a]/20' },
    { label: 'Active Bookings',value: stats?.activeReservations ?? 0, color: 'from-[#f87171]/20' },
    { label: 'Revenue',        value: `$${stats?.totalRevenue   ?? 0}`, color: 'from-[#42d99a]/20' },
  ];

  // normalise chart heights to percentages relative to max revenue
  const maxRev = Math.max(...revenue.map(r => r.revenue), 1);
  const chartBars = revenue.length > 0
    ? revenue.map(r => ({ label: r.month.slice(5), pct: Math.round((r.revenue / maxRev) * 100), revenue: r.revenue, count: r.count }))
    : [];

  return (
    <div className="flex min-h-screen">
      <AdminSidebar isOpen={sidebar} onClose={() => setSidebar(false)} />

      <div className="flex-1 overflow-x-hidden px-3 py-4 sm:px-5">

        {/* Mobile topbar */}
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#1f5972] bg-[#051a28]/80 p-3 xl:hidden">
          <button onClick={() => setSidebar(true)} className="glass-panel rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#c8f2ff]">
            Menu
          </button>
          <p className="text-sm font-black uppercase tracking-widest text-[#e8fbff]">Admin</p>
          <span className="text-xs text-[#4a8fa8]">Panel</span>
        </div>

        {/* Header */}
        <section className="glass-panel scan-lines fade-rise mb-4 rounded-2xl p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#79afc5]">Admin Control Center</p>
          <h1 className="mt-1 text-2xl font-black uppercase leading-none tracking-tight text-[#e8fbff] sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-[#9cc1d1]">Platform overview — users, fleet, drivers, reservations.</p>
        </section>

        {loading ? (
          <div className="glass-panel rounded-2xl p-10 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#2ec5f5] border-t-transparent" />
            <p className="mt-3 text-sm text-[#7eb3c9]">Loading data...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {kpis.map((k, i) => (
                <article key={k.label} className={`glass-panel slide-in rounded-2xl bg-gradient-to-br ${k.color} to-[#0a2c3f]/20 p-4`} style={{ animationDelay: `${i * 50}ms` }}>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#7eaec4]">{k.label}</p>
                  <p className="mt-2 text-2xl font-black text-[#e4f9ff]">{k.value}</p>
                </article>
              ))}
            </div>

            {/* Revenue Chart + Pending Drivers */}
            <div className="mb-4 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
              <article className="glass-panel scan-lines rounded-2xl p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#dff8ff]">Monthly Revenue</p>
                  <p className="text-[10px] text-[#4a8fa8]">Completed reservations only</p>
                </div>

                {chartBars.length === 0 ? (
                  <div className="flex h-32 items-center justify-center">
                    <p className="text-xs text-[#4a8fa8]">No completed reservations yet</p>
                  </div>
                ) : (
                  <div className="flex h-36 items-end gap-2">
                    {chartBars.map((b, i) => (
                      <div key={i} className="group relative flex flex-1 flex-col items-center gap-1">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
                          <div className="rounded-lg border border-[#1e5670] bg-[#051a28] px-2 py-1 text-center">
                            <p className="text-[10px] font-bold text-[#2ec5f5]">${b.revenue.toFixed(0)}</p>
                            <p className="text-[9px] text-[#4a8fa8]">{b.count} bookings</p>
                          </div>
                          <div className="h-1.5 w-px bg-[#1e5670]" />
                        </div>
                        <div className="relative flex h-full w-full items-end overflow-hidden rounded-md bg-[#0b2a3e]">
                          <div
                            className="w-full rounded-md bg-gradient-to-t from-[#2ec5f5] to-[#56e0ff] transition-all duration-500"
                            style={{ height: `${b.pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-[#7ea8bc]">{b.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="glass-panel scan-lines rounded-2xl p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#dff8ff]">
                  Pending Drivers <span className="ml-1 rounded-full bg-[#f3b85a]/20 px-2 py-0.5 text-[#f3b85a]">{drivers.length}</span>
                </p>
                <div className="space-y-2">
                  {drivers.length === 0 ? (
                    <p className="text-xs text-[#4a8fa8]">No pending applications</p>
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
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#dff8ff]">Recent Users</p>
                <div className="space-y-2">
                  {users.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between rounded-xl border border-[#1e5670] bg-[#082334]/70 px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-[#ddf8ff]">{u.firstName} {u.lastName}</p>
                        <p className="text-[10px] text-[#7ea8bc]">{u.email}</p>
                      </div>
                      <span className="rounded-full border border-[#2e8fb4]/40 px-2 py-0.5 text-[10px] uppercase text-[#7eb3c9]">{u.role}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="glass-panel scan-lines rounded-2xl p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#dff8ff]">Recent Reservations</p>
                <div className="space-y-2">
                  {reservations.length === 0 ? (
                    <p className="text-xs text-[#4a8fa8]">No reservations yet</p>
                  ) : reservations.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between rounded-xl border border-[#1e5670] bg-[#082334]/70 px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-[#ddf8ff]">
                          {r.serviceType === 'WITH_DRIVER' ? '🧑‍✈️ With Driver' : '🚗 Car Only'}
                        </p>
                        <p className="text-[10px] text-[#7ea8bc]">{new Date(r.startDate).toLocaleDateString()}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-semibold
                        ${r.status === 'CONFIRMED' ? 'bg-[#42d99a]/20 text-[#42d99a]' :
                          r.status === 'PENDING'   ? 'bg-[#f3b85a]/20 text-[#f3b85a]' :
                          r.status === 'CANCELLED' ? 'bg-[#f87171]/20 text-[#f87171]' :
                          'bg-[#2ec5f5]/20 text-[#2ec5f5]'}`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
