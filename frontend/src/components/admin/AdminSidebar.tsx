'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import ThemeToggle from '@/components/ThemeToggle';

const NAV = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    ),
  },
  {
    label: 'Drivers',
    href: '/admin/drivers',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <circle cx="12" cy="8" r="4" /><path d="M5 17H3v-5l2-5h14l2 5v5h-2" />
        <circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" />
      </svg>
    ),
  },
  {
    label: 'Vehicles',
    href: '/admin/vehicles',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <path d="M5 17H3v-5l2-5h14l2 5v5h-2" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" />
        <path d="M5 12h14" />
      </svg>
    ),
  },
  {
    label: 'Reservations',
    href: '/admin/reservations',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    ),
  },
  {
    label: 'Verifications',
    href: '/admin/verifications',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

export default function AdminSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm xl:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 flex w-60 flex-col
        theme-sidebar border-r
        transition-transform duration-300
        xl:static xl:translate-x-0 xl:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ borderColor: 'var(--line-soft)' }}>

        {/* ── Logo ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4"
          style={{ borderBottom: '1px solid var(--line-soft)' }}>
            <Link href={'/'}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#fe7f32] to-[#e06820] shadow-lg shadow-[#fe7f32]/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="h-4 w-4">
                <path d="M5 17H3v-5l2-5h14l2 5v5h-2" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" />
              </svg>
            </div>
            <span className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: 'var(--text-main)' }}>Drivana</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 xl:hidden transition" style={{ color: 'var(--text-muted)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          </Link>
        </div>

        {/* ── Admin badge ── */}
        {user && (
          <div className="mx-3 mt-4 rounded-2xl p-3"
            style={{ border: '1px solid var(--line)', background: 'var(--bg-card)' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-black text-[#f3b85a]"
                style={{ borderColor: 'rgba(243,184,90,0.3)', background: 'rgba(243,184,90,0.12)' }}>
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold" style={{ color: 'var(--text-main)' }}>{user.firstName} {user.lastName}</p>
                <p className="text-[10px] text-[#f3b85a]">Administrator</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#fe7f32]" />
              <span className="text-[10px] text-[#fe7f32]">Active session</span>
            </div>
          </div>
        )}

        <p className="mt-5 mb-2 px-5 text-[9px] font-bold uppercase tracking-[0.28em]"
          style={{ color: 'var(--text-muted)' }}>Management</p>

        <nav className="flex flex-col gap-0.5 px-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200"
                style={{
                  background: active ? 'rgba(254,127,50,0.12)' : 'transparent',
                  borderBottom:     active ? '1px solid rgba(254,127,50,0.25)' : '1px solid #fe7f32',
                  color:      active ? '#fe7f32' : 'var(--text-soft)',
                }}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-[#fe7f32]" />}
                <span style={{ color: active ? '#fe7f32' : 'var(--text-muted)' }}>{item.icon}</span>
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#fe7f32]" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-3 pb-5 space-y-2">
          <div className="rounded-xl px-3 py-2.5"
            style={{ border: '1px solid var(--line-soft)', background: 'var(--bg-card)' }}>
            <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Version</p>
            <p className="text-[10px] font-semibold" style={{ color: 'var(--text-soft)' }}>Drivana v1.0</p>
          </div>
          <ThemeToggle />
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="group flex w-full items-center gap-2.5 rounded-xl border border-[#7c3d45]/50 bg-[#1a080c]/80 px-3 py-2.5 text-xs font-semibold text-[#ffc8cf] transition hover:bg-[#2a0e14] hover:border-[#f87171]/40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-[#f87171]">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
