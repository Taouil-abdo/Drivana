'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';

const STATUS_STYLE: Record<string, string> = {
  APPROVED:  'bg-[#42d99a]/20 text-[#42d99a] border-[#42d99a]/30',
  PENDING:   'bg-[#f3b85a]/20 text-[#f3b85a] border-[#f3b85a]/30',
  REJECTED:  'bg-[#f87171]/20 text-[#f87171] border-[#f87171]/30',
  SUSPENDED: 'bg-[#a78bfa]/20 text-[#a78bfa] border-[#a78bfa]/30',
};

export default function DriverProfile() {
  const { toasts, toast, remove } = useToast();

  const [profile,   setProfile]   = useState<any>(null);
  const [stats,     setStats]     = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [toggling,  setToggling]  = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [p, s] = await Promise.all([
        apiClient.get('/driver/me'),
        apiClient.get('/driver/stats'),
      ]);
      setProfile(p.data);
      setStats(s.data);
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

  // star rating display
  const stars = (rating: number) => {
    const full  = Math.floor(rating);
    const empty = 5 - full;
    return '★'.repeat(full) + '☆'.repeat(empty);
  };

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      {/* Header */}
      <section className="glass-panel scan-lines fade-rise mb-4 rounded-2xl p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[#79afc5]">Driver Console</p>
        <h1 className="mt-1 text-2xl font-black uppercase leading-none tracking-tight text-[#e8fbff] sm:text-3xl">My Profile</h1>
        <p className="mt-1 text-sm text-[#9cc1d1]">Your driver information and performance overview.</p>
      </section>

      {loading ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#2ec5f5] border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">

          {/* Identity card */}
          <article className="glass-panel rounded-2xl p-5">
            <p className="mb-4 text-[10px] uppercase tracking-[0.18em] text-[#7eaec4]">Identity</p>

            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#2ec5f5]/50 bg-[#0b2433] text-xl font-black text-[#c8f2ff]">
                {profile?.user?.firstName?.[0]}{profile?.user?.lastName?.[0]}
              </div>
              <div>
                <p className="text-lg font-black text-[#e4f9ff]">{profile?.user?.firstName} {profile?.user?.lastName}</p>
                <p className="text-xs text-[#7ea8bc]">{profile?.user?.email}</p>
                {profile?.user?.phone && <p className="text-xs text-[#7ea8bc]">{profile?.user?.phone}</p>}
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-2">
              {[
                { label: 'License Number',    value: profile?.licenseNumber },
                { label: 'Experience',        value: `${profile?.experienceYears} years` },
                { label: 'Member Since',      value: new Date(profile?.createdAt).toLocaleDateString() },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between rounded-xl border border-[#1e5670] bg-[#051a28]/80 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-[#7eaec4]">{row.label}</p>
                  <p className="text-xs font-semibold text-[#e4f9ff]">{row.value}</p>
                </div>
              ))}

              {/* Status */}
              <div className="flex items-center justify-between rounded-xl border border-[#1e5670] bg-[#051a28]/80 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-widest text-[#7eaec4]">Account Status</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[profile?.status] ?? ''}`}>
                  {profile?.status}
                </span>
              </div>

              {/* Availability toggle */}
              <div className="flex items-center justify-between rounded-xl border border-[#1e5670] bg-[#051a28]/80 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-widest text-[#7eaec4]">Availability</p>
                <button
                  onClick={toggleAvailability}
                  disabled={toggling || profile?.status !== 'APPROVED'}
                  className={`rounded-lg border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-40
                    ${profile?.isAvailable
                      ? 'border-[#42d99a]/40 bg-[#42d99a]/10 text-[#42d99a] hover:bg-[#42d99a]/20'
                      : 'border-[#f87171]/40 bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171]/20'}`}
                >
                  {toggling ? '...' : profile?.isAvailable ? '● Online' : '○ Offline'}
                </button>
              </div>
            </div>

            {profile?.status !== 'APPROVED' && (
              <p className="mt-3 text-[11px] text-[#f3b85a]">
                ⚠ Your account is {profile?.status?.toLowerCase()}. Contact admin to restore access.
              </p>
            )}
          </article>

          {/* Performance card */}
          <div className="flex flex-col gap-4">

            {/* Rating */}
            <article className="glass-panel rounded-2xl p-5">
              <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-[#7eaec4]">Rating</p>
              <div className="flex items-end gap-3">
                <p className="text-5xl font-black text-[#e4f9ff]">{Number(profile?.rating ?? 0).toFixed(1)}</p>
                <div className="pb-1">
                  <p className="text-lg tracking-widest text-[#f3b85a]">{stars(Number(profile?.rating ?? 0))}</p>
                  <p className="text-[10px] text-[#4a8fa8]">out of 5.0</p>
                </div>
              </div>
            </article>

            {/* Stats grid */}
            <article className="glass-panel rounded-2xl p-5">
              <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-[#7eaec4]">Performance</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Missions', value: stats?.total     ?? 0, color: 'border-[#2ec5f5]/30 bg-[#071d29]' },
                  { label: 'Completed',      value: stats?.completed ?? 0, color: 'border-[#42d99a]/30 bg-[#071f23]' },
                  { label: 'Confirmed',      value: stats?.confirmed ?? 0, color: 'border-[#f3b85a]/30 bg-[#211d07]' },
                  { label: 'Pending',        value: stats?.pending   ?? 0, color: 'border-[#a78bfa]/30 bg-[#201a33]' },
                ].map(k => (
                  <div key={k.label} className={`rounded-xl border p-3 ${k.color}`}>
                    <p className="text-[10px] uppercase tracking-widest text-[#7eaec4]">{k.label}</p>
                    <p className="mt-1 text-2xl font-black text-[#e4f9ff]">{k.value}</p>
                  </div>
                ))}
              </div>
            </article>

            {/* Earnings */}
            <article className="glass-panel rounded-2xl p-5">
              <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#7eaec4]">Total Earnings</p>
              <p className="text-3xl font-black text-[#42d99a]">${Number(stats?.earnings ?? 0).toFixed(2)}</p>
              <p className="mt-1 text-[10px] text-[#4a8fa8]">From completed trips only</p>
            </article>
          </div>
        </div>
      )}
    </>
  );
}
