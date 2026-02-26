'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import apiClient from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-[#42d99a]/20 text-[#42d99a] border-[#42d99a]/30',
  PENDING:  'bg-[#f3b85a]/20 text-[#f3b85a] border-[#f3b85a]/30',
  REJECTED: 'bg-[#f87171]/20 text-[#f87171] border-[#f87171]/30',
};

export default function AdminDrivers() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    fetchDrivers();
  }, [mounted, user]);

  const fetchDrivers = async () => {
    try {
      const res = await apiClient.get('/admin/drivers');
      setDrivers(res.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const approve = async (id: string) => {
    await apiClient.patch(`/admin/drivers/${id}/approve`);
    setDrivers(d => d.map(x => x.id === id ? { ...x, status: 'APPROVED' } : x));
  };

  const reject = async (id: string) => {
    await apiClient.patch(`/admin/drivers/${id}/reject`);
    setDrivers(d => d.map(x => x.id === id ? { ...x, status: 'REJECTED' } : x));
  };

  if (!mounted || !user || user.role !== 'ADMIN') return null;

  const filtered = drivers.filter(d => !filter || d.status === filter);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar isOpen={sidebar} onClose={() => setSidebar(false)} />

      <div className="flex-1 overflow-x-hidden px-3 py-4 sm:px-5">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#1f5972] bg-[#051a28]/80 p-3 xl:hidden">
          <button onClick={() => setSidebar(true)} className="glass-panel rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#c8f2ff]">Menu</button>
          <p className="text-sm font-black uppercase tracking-widest text-[#e8fbff]">Admin</p>
          <span className="text-xs text-[#4a8fa8]">Panel</span>
        </div>

        <section className="glass-panel scan-lines fade-rise mb-4 rounded-2xl p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#79afc5]">Admin Control Center</p>
          <h1 className="mt-1 text-2xl font-black uppercase leading-none tracking-tight text-[#e8fbff] sm:text-3xl">Drivers</h1>
          <p className="mt-1 text-sm text-[#9cc1d1]">Review and manage driver applications.</p>
        </section>

        {/* Stats row */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].slice(1).map(s => (
            <button
              key={s}
              onClick={() => setFilter(f => f === s ? '' : s)}
              className={`glass-panel rounded-2xl p-3 text-center transition ${filter === s ? 'border-[#2ec5f5]/60' : ''}`}
            >
              <p className="text-lg font-black text-[#e4f9ff]">{drivers.filter(d => d.status === s).length}</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#7eaec4]">{s}</p>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="glass-panel rounded-2xl p-10 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#2ec5f5] border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.length === 0 ? (
              <p className="col-span-3 py-8 text-center text-sm text-[#4a8fa8]">No drivers found</p>
            ) : filtered.map((d: any) => (
              <article key={d.id} className="glass-panel scan-lines slide-in rounded-2xl p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-bold text-[#ddf8ff]">{d.user?.firstName} {d.user?.lastName}</p>
                    <p className="text-[11px] text-[#7ea8bc]">{d.user?.email}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase font-semibold ${STATUS_COLORS[d.status] ?? ''}`}>
                    {d.status}
                  </span>
                </div>

                <div className="mb-3 space-y-1 text-xs text-[#9cc1d1]">
                  <p>License: <span className="text-[#c8f2ff]">{d.licenseNumber}</span></p>
                  <p>Experience: <span className="text-[#c8f2ff]">{d.experienceYears} yrs</span></p>
                  <p>Rating: <span className="text-[#c8f2ff]">{d.rating ?? 0}</span></p>
                  <p>Available: <span className={d.isAvailable ? 'text-[#42d99a]' : 'text-[#f87171]'}>{d.isAvailable ? 'Yes' : 'No'}</span></p>
                </div>

                {d.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button onClick={() => approve(d.id)} className="flex-1 rounded-xl border border-[#42d99a]/40 bg-[#42d99a]/10 py-2 text-[11px] font-bold uppercase tracking-wider text-[#42d99a] hover:bg-[#42d99a]/20 transition">
                      Approve
                    </button>
                    <button onClick={() => reject(d.id)} className="flex-1 rounded-xl border border-[#f87171]/40 bg-[#f87171]/10 py-2 text-[11px] font-bold uppercase tracking-wider text-[#f87171] hover:bg-[#f87171]/20 transition">
                      Reject
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
